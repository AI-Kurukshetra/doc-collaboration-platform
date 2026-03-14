"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeader from "@/components/PageHeader";

type StudentRow = {
  id: string;
  name: string | null;
  email: string | null;
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.role_id) {
          throw new Error("Role not found.");
        }

        const { data: roleRow } = await supabase
          .from("roles")
          .select("name")
          .eq("id", profile.role_id)
          .maybeSingle();

        if (roleRow?.name !== "teacher") {
          router.push("/dashboard");
          return;
        }

        const { data: teacherClassrooms, error: classroomsError } =
          await supabase
            .from("classrooms")
            .select("id")
            .eq("teacher_id", user.id);

        if (classroomsError) throw classroomsError;

        const classroomIds =
          teacherClassrooms?.map((row) => row.id) ?? [];
        if (!classroomIds.length) {
          if (isMounted) setStudents([]);
          return;
        }

        const { data: roleRows } = await supabase
          .from("roles")
          .select("id, name");
        const studentRoleId =
          roleRows?.find((role) => role.name === "student")?.id ?? null;

        const { data: memberRows, error: memberError } = await supabase
          .from("classroom_members")
          .select("user_id, role_id")
          .in("classroom_id", classroomIds);

        if (memberError) throw memberError;

        const studentIds = Array.from(
          new Set(
            (memberRows ?? [])
              .filter((row) => row.role_id === studentRoleId)
              .map((row) => row.user_id)
          )
        );

        if (!studentIds.length) {
          if (isMounted) setStudents([]);
          return;
        }

        const { data: studentProfiles, error: studentsError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", studentIds);

        if (studentsError) throw studentsError;

        if (isMounted) {
          setStudents(studentProfiles ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load students."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Students" },
            ]}
          />
          <PageHeader
            title="Students"
            subtitle="Students enrolled in your classrooms."
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              Loading students...
            </div>
          ) : students.length ? (
            students.map((student) => (
              <div
                key={student.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {student.name || "Unnamed student"}
                    </p>
                    <p className="text-xs text-slate-300">
                      {student.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              No students enrolled yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
