"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  GraduationCap,
  NotebookPen,
  PlusCircle,
  UploadCloud,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatsSkeleton from "@/components/skeletons/StatsSkeleton";
import ListSkeleton from "@/components/skeletons/ListSkeleton";

type DashboardStats = {
  classrooms: number;
  documents: number;
  students: number;
};

type RecentDocument = {
  id: string;
  title: string | null;
  created_at: string;
  classroom_id: string | null;
  classroom_name?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("there");
  const [roleName, setRoleName] = useState<"teacher" | "student" | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    classrooms: 0,
    documents: 0,
    students: 0,
  });
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const userId = user.id;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role_id")
          .eq("id", userId)
          .maybeSingle();

        const nameValue = profile?.name?.trim();
        if (isMounted && nameValue) {
          setDisplayName(nameValue);
        }

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

        const isTeacher = roleValue === "teacher";

        let classrooms: { id: string }[] = [];
        let classroomCount: number | null = 0;
        let documentsError: { message: string } | null = null;
        let recentError: { message: string } | null = null;
        let documentCount: number | null = 0;
        let studentCount = 0;
        let recent: RecentDocument[] = [];

        if (isTeacher) {
          const {
            data: teacherClassrooms,
            count,
            error: classroomsError,
          } = await supabase
            .from("classrooms")
            .select("id", { count: "exact" })
            .eq("teacher_id", userId);

          if (classroomsError) {
            throw classroomsError;
          }

          classrooms = teacherClassrooms ?? [];
          classroomCount = count ?? classrooms.length;

          const { count: docCount, error: docError } = await supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("uploaded_by", userId);
          documentCount = docCount ?? 0;
          documentsError = docError ?? null;

          if (classrooms.length) {
            const { count, error: membersError } = await supabase
              .from("classroom_members")
              .select("*", { count: "exact", head: true })
              .in(
                "classroom_id",
                classrooms.map((room) => room.id)
              );
            if (!membersError) {
              studentCount = count ?? 0;
            }
          }

          const { data: recentDocs, error: recentDocsError } = await supabase
            .from("documents")
            .select("id, title, created_at, classroom_id")
            .eq("uploaded_by", userId)
            .order("created_at", { ascending: false })
            .limit(5);
          recent = recentDocs ?? [];
          recentError = recentDocsError ?? null;
        } else {
          const { data: memberRows, error: memberError } = await supabase
            .from("classroom_members")
            .select("classroom_id")
            .eq("user_id", userId);

          if (memberError) {
            throw memberError;
          }

          const classroomIds =
            (memberRows as { classroom_id: string }[] | null)?.map(
              (row) => row.classroom_id
            ) ?? [];
          classroomCount = classroomIds.length;

          if (classroomIds.length) {
            const { count: docCount, error: docError } = await supabase
              .from("documents")
              .select("*", { count: "exact", head: true })
              .in("classroom_id", classroomIds);
            documentCount = docCount ?? 0;
            documentsError = docError ?? null;

            const { data: recentDocs, error: recentDocsError } = await supabase
              .from("documents")
              .select("id, title, created_at, classroom_id")
              .in("classroom_id", classroomIds)
              .order("created_at", { ascending: false })
              .limit(5);
            recent = recentDocs ?? [];
            recentError = recentDocsError ?? null;
          }
        }

        let recentWithNames: RecentDocument[] = recent ?? [];
        if (!recentError && recent && recent.length) {
          const classroomIdsForRecent = Array.from(
            new Set(recent.map((doc) => doc.classroom_id).filter(Boolean))
          ) as string[];

          if (classroomIdsForRecent.length) {
            const { data: classroomRows } = await supabase
              .from("classrooms")
              .select("id, name")
              .in("id", classroomIdsForRecent);

            const typedClassroomRows =
              (classroomRows as { id: string; name: string | null }[] | null) ??
              [];
            const nameMap = new Map(
              typedClassroomRows.map((row) => [row.id, row.name])
            );

            recentWithNames = recent.map((doc) => ({
              ...doc,
              classroom_name: doc.classroom_id
                ? nameMap.get(doc.classroom_id) ?? null
                : null,
            }));
          }
        }

        if (isMounted) {
          setStats({
            classrooms: classroomCount ?? classrooms?.length ?? 0,
            documents: documentCount ?? 0,
            students: isTeacher ? studentCount : 0,
          });
          setRecentDocs(recentWithNames);
        }
        if (isMounted && documentsError) {
          setError("Unable to read document stats. Check RLS policies.");
        }
        if (isMounted && recentError) {
          setError("Unable to read recent documents. Check RLS policies.");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const statCards = useMemo(() => {
    const base = [
      {
        title: roleName === "student" ? "Joined Classrooms" : "Classrooms",
        value: stats.classrooms,
        icon: GraduationCap,
      },
      {
        title: "Documents",
        value: stats.documents,
        icon: NotebookPen,
      },
    ];
    if (roleName === "teacher") {
      base.push({
        title: "Students",
        value: stats.students,
        icon: BookOpenCheck,
      });
    }
    return base;
  }, [roleName, stats]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">
              Edu Annotate
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Welcome, {displayName}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Here&apos;s a quick overview of your classrooms and documents.
            </p>
            <Breadcrumbs
              items={[{ label: "Dashboard" }]}
            />
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:border-white/20 hover:bg-white/20"
            type="button"
            onClick={() =>
              supabase.auth.signOut().then(() => router.push("/login"))
            }
          >
            Sign out
          </button>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <StatsSkeleton />
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-lg shadow-slate-900/40 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                  type="button"
                  onClick={() => {
                    if (card.title.includes("Classroom")) {
                      router.push("/classrooms");
                    } else if (card.title === "Documents") {
                      router.push("/documents");
                    } else if (card.title === "Students") {
                      router.push("/students");
                    }
                  }}
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_60%)]" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        {card.title}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {card.value}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                      <Icon className="h-5 w-5 text-indigo-200" />
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/40">
            <h2 className="text-lg font-semibold text-white">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Jump straight into your most common tasks.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {roleName === "teacher" ? (
                <>
                  <button
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300/40 hover:bg-indigo-500/10"
                    type="button"
                    onClick={() => router.push("/classrooms")}
                  >
                    <PlusCircle className="h-4 w-4 text-indigo-300" />
                    Create Classroom
                  </button>
                 
                </>
              ) : (
                <button
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300/40 hover:bg-indigo-500/10"
                  type="button"
                  onClick={() => router.push("/classrooms")}
                >
                  <GraduationCap className="h-4 w-4 text-indigo-300" />
                  View Classrooms
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/40 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Recent activity
              </h2>
              <span className="text-xs text-slate-400">
                Latest 5 uploads
              </span>
            </div>
            <div className="mt-4 divide-y divide-white/10">
              {loading ? (
                <ListSkeleton rows={3} />
              ) : recentDocs.length ? (
                recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {doc.title || "Untitled document"}
                      </p>
                      <p className="text-xs text-slate-300">
                        {doc.classroom_name || "No classroom"} •{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                      Uploaded
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-sm text-slate-400">
                  No recent documents yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
