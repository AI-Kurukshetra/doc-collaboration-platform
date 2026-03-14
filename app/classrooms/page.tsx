"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  PlusCircle,
  School,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import toast from "react-hot-toast";
import ClassroomSkeleton from "@/components/skeletons/ClassroomSkeleton";

type Classroom = {
  id: string;
  name: string | null;
  created_at: string;
};

export default function ClassroomsPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [roleName, setRoleName] = useState<"teacher" | "student" | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadClassrooms = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", session.user.id)
        .maybeSingle();

      let roleValue: "teacher" | "student" | null = null;
      if (profile?.role_id) {
        const { data: roleRow } = await supabase
          .from("roles")
          .select("name")
          .eq("id", profile.role_id)
          .maybeSingle();
        if (roleRow?.name === "teacher" || roleRow?.name === "student") {
          roleValue = roleRow.name;
        }
      }
      if (isMounted) {
        setRoleName(roleValue);
      }

      let data: Classroom[] | null = null;
      let fetchError: { message: string } | null = null;

      if (roleValue === "student") {
        const { data: memberRows, error: memberError } = await supabase
          .from("classroom_members")
          .select("classroom_id")
          .eq("user_id", session.user.id);

        if (memberError) {
          fetchError = memberError;
        } else {
          const classroomIds =
            memberRows?.map((row) => row.classroom_id) ?? [];
          if (classroomIds.length) {
            const { data: classroomRows, error: classroomsError } = await supabase
              .from("classrooms")
              .select("id, name, created_at")
              .in("id", classroomIds)
              .order("created_at", { ascending: false });
            data = classroomRows ?? [];
            fetchError = classroomsError ?? null;
          } else {
            data = [];
          }
        }
      } else {
        const { data: classroomRows, error: classroomsError } = await supabase
          .from("classrooms")
          .select("id, name, created_at")
          .eq("teacher_id", session.user.id)
          .order("created_at", { ascending: false });
        data = classroomRows ?? [];
        fetchError = classroomsError ?? null;
      }

      if (isMounted) {
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setClassrooms(data ?? []);
        }
        setLoading(false);
      }
    };

    loadClassrooms();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCreateClassroom = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("classrooms")
      .insert({
        name: classroomName.trim(),
        teacher_id: session.user.id,
        created_at: new Date().toISOString(),
      })
      .select("id, name, created_at")
      .single();

    if (insertError) {
      setError(insertError.message);
      toast.error(insertError.message);
      setSaving(false);
      return;
    }

    const { data: teacherRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "teacher")
      .maybeSingle();

    const { error: memberError } = await supabase
      .from("classroom_members")
      .insert({
      classroom_id: data.id,
      user_id: session.user.id,
      role_id: teacherRole?.id ?? null,
      created_at: new Date().toISOString(),
    });
    if (memberError) {
      toast.error(memberError.message);
    }

    setClassrooms((prev) => (data ? [data, ...prev] : prev));
    setClassroomName("");
    setIsModalOpen(false);
    setSaving(false);
    toast.success("Classroom created successfully");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
              <School className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">
                Edu Annotate
              </p>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <div className="h-6 w-48 rounded-md bg-gray-700/80 animate-pulse" />
                  <div className="h-3 w-56 rounded-md bg-gray-700/80 animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="mt-2 text-3xl font-semibold text-white">
                    My Classrooms
                  </h1>
                  <p className="mt-2 text-sm text-slate-300">
                    Create and manage your classroom spaces.
                  </p>
                </>
              )}
              <Breadcrumbs
                items={[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Classrooms" },
                ]}
              />
            </div>
          </div>
          {roleName === "teacher" ? (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:border-white/20 hover:bg-white/20"
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 text-indigo-200" />
              Create Classroom
            </button>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <ClassroomSkeleton />
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.length ? (
              classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/40 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_60%)]" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <School className="h-4 w-4 text-indigo-200" />
                        Classroom
                      </div>
                      <h2 className="relative mt-3 text-lg font-semibold text-white">
                        {classroom.name || "Untitled classroom"}
                      </h2>
                    </div>
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="relative mt-4 flex items-center gap-2 text-xs text-slate-300">
                    <CalendarClock className="h-4 w-4 text-indigo-200" />
                    Created{" "}
                    {new Date(classroom.created_at).toLocaleDateString()}
                  </div>
                  <button
                    className="relative mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300/40 hover:bg-indigo-500/10"
                    type="button"
                    onClick={() => router.push(`/classrooms/${classroom.id}`)}
                  >
                    Open Classroom
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                {roleName === "teacher"
                  ? "No classrooms yet. Create your first classroom to get started."
                  : "You have not joined any classrooms yet."}
              </div>
            )}
          </section>
        )}
      </div>

      {isModalOpen && roleName === "teacher" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => !saving && setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Create Classroom
              </h2>
              <button
                className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                type="button"
                onClick={() => !saving && setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Give your classroom a clear, descriptive name.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleCreateClassroom}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Classroom Name
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-indigo-400/40 placeholder:text-slate-400 focus:border-indigo-300/50 focus:ring-2"
                  value={classroomName}
                  onChange={(event) => setClassroomName(event.target.value)}
                  placeholder="e.g. Physics - Period 2"
                  required
                />
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Classroom"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
