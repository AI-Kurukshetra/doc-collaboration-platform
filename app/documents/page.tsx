"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeader from "@/components/PageHeader";

type DocumentRow = {
  id: string;
  title: string | null;
  created_at: string;
  classroom_id: string | null;
  classroom_name?: string | null;
};

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
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

        let docs: DocumentRow[] = [];
        if (roleValue === "teacher") {
          const { data: docRows, error: docsError } = await supabase
            .from("documents")
            .select("id, title, created_at, classroom_id")
            .eq("uploaded_by", user.id)
            .order("created_at", { ascending: false });
          if (docsError) throw docsError;
          docs = docRows ?? [];
        } else {
          const { data: memberRows, error: memberError } = await supabase
            .from("classroom_members")
            .select("classroom_id")
            .eq("user_id", user.id);
          if (memberError) throw memberError;
          const classroomIds =
            (memberRows as { classroom_id: string }[] | null)?.map(
              (row) => row.classroom_id
            ) ?? [];
          if (classroomIds.length) {
            const { data: docRows, error: docsError } = await supabase
              .from("documents")
              .select("id, title, created_at, classroom_id")
              .in("classroom_id", classroomIds)
              .order("created_at", { ascending: false });
            if (docsError) throw docsError;
            docs = docRows ?? [];
          }
        }

        if (docs.length) {
          const classroomIds = Array.from(
            new Set(docs.map((doc) => doc.classroom_id).filter(Boolean))
          ) as string[];
          if (classroomIds.length) {
            const { data: classroomRows } = await supabase
              .from("classrooms")
              .select("id, name")
              .in("id", classroomIds);
            const typedClassroomRows =
              (classroomRows as { id: string; name: string | null }[] | null) ??
              [];
            const nameMap = new Map(
              typedClassroomRows.map((row) => [row.id, row.name])
            );
            docs = docs.map((doc) => ({
              ...doc,
              classroom_name: doc.classroom_id
                ? nameMap.get(doc.classroom_id) ?? null
                : null,
            }));
          }
        }

        if (isMounted) {
          setDocuments(docs);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load documents."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDocuments();

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
              { label: "Documents" },
            ]}
          />
          <PageHeader
            title="Documents"
            subtitle="Browse documents available to you."
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
              Loading documents...
            </div>
          ) : documents.length ? (
            documents.map((doc) => (
              <button
                key={doc.id}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-lg shadow-slate-900/40 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => router.push(`/documents/${doc.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white">
                  {doc.title || "Untitled document"}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {doc.classroom_name || "No classroom"}
                </p>
              </button>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              No documents found.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
