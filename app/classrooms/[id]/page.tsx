"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  PlusCircle,
  UploadCloud,
  Users,
  X,
  GraduationCap,
  Trash2,
  PencilLine,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AddStudentsModal from "@/components/AddStudentsModal";
import Breadcrumbs from "@/components/Breadcrumbs";
import toast from "react-hot-toast";
import DocumentSkeleton from "@/components/skeletons/DocumentSkeleton";
import ListSkeleton from "@/components/skeletons/ListSkeleton";

type ClassroomRecord = {
  id: string;
  name: string | null;
  teacher_id: string;
  created_at: string;
};

type ProfileRecord = {
  id: string;
  name: string | null;
  email: string | null;
  role_id: string | null;
};

type RoleRecord = {
  id: string;
  name: string | null;
};

type MemberRow = {
  id: string;
  user_id: string;
  role_id: string | null;
};

type DocumentRow = {
  id: string;
  title: string | null;
  created_at: string;
  uploaded_by: string;
  file_url?: string | null;
};

export default function ClassroomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classroom, setClassroom] = useState<ClassroomRecord | null>(null);
  const [teacher, setTeacher] = useState<ProfileRecord | null>(null);
  const [members, setMembers] = useState<ProfileRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [students, setStudents] = useState<ProfileRecord[]>([]);
  const [studentRoleId, setStudentRoleId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"teacher" | "student" | null>(
    null
  );
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string | null;
  } | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteDocTarget, setDeleteDocTarget] = useState<{
    id: string;
    title: string | null;
    file_url?: string | null;
  } | null>(null);

  const roleMap = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach((role) => {
      if (role.id && role.name) {
        map.set(role.id, role.name);
      }
    });
    return map;
  }, [roles]);

  useEffect(() => {
    let isMounted = true;

    const loadClassroom = async () => {
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const { data: classroomData, error: classroomError } = await supabase
          .from("classrooms")
          .select("id, name, teacher_id, created_at")
          .eq("id", classroomId)
          .single();

        if (classroomError) {
          throw classroomError;
        }

        const { data: teacherData } = await supabase
          .from("profiles")
          .select("id, name, email, role_id")
          .eq("id", classroomData.teacher_id)
          .maybeSingle();

        const { data: membersData, error: membersError } = await supabase
          .from("classroom_members")
          .select("id, user_id, role_id")
          .eq("classroom_id", classroomId);

        if (membersError) {
          throw membersError;
        }

        const memberIds = membersData?.map((row) => row.user_id) ?? [];
        const { data: memberProfiles } = memberIds.length
          ? await supabase
              .from("profiles")
              .select("id, name, email, role_id")
              .in("id", memberIds)
          : { data: [] as ProfileRecord[] };

        const { data: roleData } = await supabase
          .from("roles")
          .select("id, name");

        const studentRole = roleData?.find((role) => role.name === "student");
        const studentRoleValue = studentRole?.id ?? null;
        const teacherRoleValue =
          roleData?.find((role) => role.name === "teacher")?.id ?? null;

        const { data: docsData, error: docsError } = await supabase
          .from("documents")
          .select("id, title, created_at, uploaded_by, file_url")
          .eq("classroom_id", classroomId)
          .order("created_at", { ascending: false });

        if (docsError) {
          throw docsError;
        }

        const { data: studentProfiles } = studentRoleValue
          ? await supabase
              .from("profiles")
              .select("id, name, email, role_id")
              .eq("role_id", studentRoleValue)
          : { data: [] as ProfileRecord[] };

        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("role_id")
          .eq("id", session.user.id)
          .maybeSingle();

        const roleValue =
          currentProfile?.role_id === teacherRoleValue
            ? "teacher"
            : currentProfile?.role_id === studentRoleValue
            ? "student"
            : null;

        const isMember =
          session.user.id === classroomData.teacher_id ||
          memberIds.includes(session.user.id);

        if (roleValue === "student" && !isMember) {
          router.push("/classrooms");
          return;
        }

        if (isMounted) {
          setClassroom(classroomData);
          setTeacher(teacherData ?? null);
          setMembers(memberProfiles ?? []);
          setRoles(roleData ?? []);
          setDocuments(docsData ?? []);
          setRenameValue(classroomData.name ?? "");
          setStudents(studentProfiles ?? []);
          setStudentRoleId(studentRoleValue);
          setCurrentRole(roleValue);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load classroom."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadClassroom();

    return () => {
      isMounted = false;
    };
  }, [classroomId, router]);

  const isTeacher =
    classroom?.teacher_id &&
    members.length >= 0 &&
    classroom.teacher_id ===
      (members.find((member) => member.id === classroom.teacher_id)?.id ??
        classroom.teacher_id);

  const teacherName = teacher?.name?.trim() || "Teacher";

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!docFile) {
      setError("Please select a file to upload.");
      return;
    }
    if (docFile.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !classroom) {
      router.push("/login");
      return;
    }

    setUploading(true);

    try {
      const safeTitle = docTitle.trim() || docFile.name;
      const sanitizedName = docFile.name.replace(/\s+/g, "_");
      const filePath = `${classroom.id}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, docFile, {
          upsert: false,
          contentType: "application/pdf",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const { data: docRow, error: insertError } = await supabase
        .from("documents")
        .insert({
          title: safeTitle,
          file_url: publicUrlData.publicUrl,
          uploaded_by: session.user.id,
          classroom_id: classroom.id,
          created_at: new Date().toISOString(),
        })
        .select("id, title, created_at, uploaded_by")
        .single();

      if (insertError) {
        throw insertError;
      }

      setDocuments((prev) => (docRow ? [docRow, ...prev] : prev));
      setDocTitle("");
      setDocFile(null);
      setIsUploadOpen(false);
      toast.success("Document uploaded successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to upload document.";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddStudents = async (studentIds: string[]) => {
    if (!studentRoleId || studentIds.length === 0 || !classroom) {
      setIsAddStudentsOpen(false);
      return;
    }

    const rows = studentIds.map((id) => ({
      classroom_id: classroom.id,
      user_id: id,
      role_id: studentRoleId,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("classroom_members")
      .insert(rows);

    if (insertError) {
      setError(insertError.message);
      toast.error(insertError.message);
      return;
    }

    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select("id, name, email, role_id")
      .in("id", studentIds);

    if (memberProfiles) {
      setMembers((prev) => {
        const existing = new Set(prev.map((member) => member.id));
        return [...prev, ...memberProfiles.filter((m) => !existing.has(m.id))];
      });
    }

    setIsAddStudentsOpen(false);
    toast.success("Students added successfully");
  };

  const handleRenameClassroom = async () => {
    if (!classroom || currentRole !== "teacher") return;
    const nextName = renameValue.trim();
    if (!nextName) {
      setError("Classroom name cannot be empty.");
      return;
    }

    const { error: updateError } = await supabase
      .from("classrooms")
      .update({ name: nextName })
      .eq("id", classroom.id);

    if (updateError) {
      setError(updateError.message);
      toast.error(updateError.message);
      return;
    }

    setClassroom({ ...classroom, name: nextName });
    setIsRenameOpen(false);
    toast.success("Classroom renamed successfully");
  };

  const handleDeleteClassroom = async () => {
    if (!classroom || currentRole !== "teacher") return;
    const { error: deleteError } = await supabase
      .from("classrooms")
      .delete()
      .eq("id", classroom.id);

    if (deleteError) {
      setError(deleteError.message);
      toast.error(deleteError.message);
      return;
    }

    toast.success("Classroom deleted successfully");
    router.push("/dashboard");
  };

  const getStoragePath = (url?: string | null) => {
    if (!url) return null;
    if (!url.startsWith("http")) return url;
    const marker = "/documents/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length).split("?")[0];
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocTarget || currentRole !== "teacher") return;

    const storagePath = getStoragePath(deleteDocTarget.file_url);
    if (storagePath) {
      await supabase.storage.from("documents").remove([storagePath]);
    }

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", deleteDocTarget.id);

    if (deleteError) {
      setError(deleteError.message);
      toast.error(deleteError.message);
      return;
    }

    setDocuments((prev) =>
      prev.filter((doc) => doc.id !== deleteDocTarget.id)
    );
    setDeleteDocTarget(null);
    toast.success("Document deleted successfully");
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!classroom || currentRole !== "teacher") return;

    const { error: deleteError } = await supabase
      .from("classroom_members")
      .delete()
      .eq("classroom_id", classroom.id)
      .eq("user_id", studentId);

    if (deleteError) {
      setError(deleteError.message);
      toast.error(deleteError.message);
      return;
    }

    setMembers((prev) => prev.filter((member) => member.id !== studentId));
    toast.success("Student removed successfully");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">
              Classroom
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">
                {classroom?.name || "Classroom"}
              </h1>
              {currentRole === "teacher" ? (
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    type="button"
                    onClick={() => setIsRenameOpen(true)}
                    aria-label="Rename classroom"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-rose-300/40 hover:bg-rose-500/10 hover:text-rose-200"
                    type="button"
                    onClick={() => setIsDeleteClassOpen(true)}
                    aria-label="Delete classroom"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Teacher: {teacherName} • Created{" "}
              {classroom?.created_at
                ? new Date(classroom.created_at).toLocaleDateString()
                : "—"}
            </p>
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Classrooms", href: "/classrooms" },
                { label: classroom?.name || "Classroom" },
              ]}
            />
          </div>
          {currentRole === "teacher" &&
          classroom?.teacher_id &&
          teacher?.id === classroom.teacher_id ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:border-white/20 hover:bg-white/20"
                type="button"
                onClick={() => setIsAddStudentsOpen(true)}
              >
                <PlusCircle className="h-4 w-4 text-indigo-200" />
                Add Students
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:border-white/20 hover:bg-white/20"
                type="button"
                onClick={() => setIsUploadOpen(true)}
              >
                <UploadCloud className="h-4 w-4 text-indigo-200" />
                Upload Document
              </button>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Members</h2>
              <Users className="h-5 w-5 text-indigo-300" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {loading ? (
                <ListSkeleton rows={4} />
              ) : members.length ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {member.name || "Unnamed user"}
                      </p>
                      {currentRole === "teacher" &&
                      member.role_id === studentRoleId ? (
                        <button
                          className="rounded-full p-2 text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                          type="button"
                          onClick={() =>
                            setRemoveTarget({
                              id: member.id,
                              name: member.name,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-300">
                      {member.email || "No email"}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">
                      {member.role_id && roleMap.get(member.role_id)
                        ? roleMap.get(member.role_id)
                        : "member"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-300">
                  No members yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/40 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Documents</h2>
              <FileText className="h-5 w-5 text-indigo-300" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {loading ? (
                <DocumentSkeleton />
              ) : documents.length ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg shadow-slate-900/40 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        {currentRole === "teacher" ? (
                          <button
                            className="rounded-full p-2 text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                            type="button"
                            onClick={() =>
                              setDeleteDocTarget({
                                id: doc.id,
                                title: doc.title,
                                file_url: doc.file_url ?? null,
                              })
                            }
                            aria-label="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {doc.title || "Untitled document"}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Uploaded by{" "}
                        {doc.uploaded_by === classroom?.teacher_id
                          ? teacherName
                          : "Member"}
                      </p>
                    </div>
                    <button
                      className="text-left text-xs font-semibold text-indigo-300 transition hover:text-indigo-200"
                      type="button"
                      onClick={() => router.push(`/documents/${doc.id}`)}
                    >
                      Open Document
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  No documents yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isUploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => !uploading && setIsUploadOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Upload Document
                </h2>
                <p className="text-sm text-slate-300">
                  Add a new file for students to annotate.
                </p>
              </div>
              <button
                className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                type="button"
                onClick={() => !uploading && setIsUploadOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleUpload}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Document title
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-indigo-400/40 placeholder:text-slate-400 focus:border-indigo-300/50 focus:ring-2"
                  value={docTitle}
                  onChange={(event) => setDocTitle(event.target.value)}
                  placeholder="Chapter 1 Worksheet"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  File
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-200"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setDocFile(event.target.files?.[0] ?? null)
                  }
                  required
                />
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={uploading}
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isRenameOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsRenameOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">
              Rename Classroom
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Update the classroom name.
            </p>
            <input
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-indigo-400/40 focus:border-indigo-300/50 focus:ring-2"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="Classroom name"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => setIsRenameOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                type="button"
                onClick={handleRenameClassroom}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteClassOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsDeleteClassOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">
              Delete Classroom
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Do you want to delete this classroom?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => setIsDeleteClassOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                type="button"
                onClick={handleDeleteClassroom}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteDocTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setDeleteDocTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">
              Delete Document
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Do you want to delete{" "}
              <span className="font-semibold text-white">
                {deleteDocTarget.title || "this document"}
              </span>
              ?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => setDeleteDocTarget(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                type="button"
                onClick={handleDeleteDocument}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddStudentsModal
        open={isAddStudentsOpen}
        students={students}
        existingStudentIds={new Set(
          members.filter((m) => m.role_id === studentRoleId).map((m) => m.id)
        )}
        onClose={() => setIsAddStudentsOpen(false)}
        onSubmit={handleAddStudents}
      />

      {removeTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setRemoveTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">
              Remove Student
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Do you want to remove{" "}
              <span className="font-semibold text-white">
                {removeTarget.name || "this student"}
              </span>{" "}
              from the classroom?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => setRemoveTarget(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                type="button"
                onClick={async () => {
                  await handleRemoveStudent(removeTarget.id);
                  setRemoveTarget(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
