"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LogOut, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

type HeaderUser = {
  name: string | null;
  email: string | null;
};

const HIDE_ON_PATHS = new Set(["/", "/login", "/signup"]);

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [loading, setLoading] = useState(true);

  const appName = "EDUANNOTATE";

  useEffect(() => {
    if (!pathname || HIDE_ON_PATHS.has(pathname)) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", session.user.id)
        .maybeSingle();

      if (isMounted) {
        const nextUser = {
          name: profile?.name ?? null,
          email: profile?.email ?? session.user.email ?? null,
        };
        setUser(nextUser);
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (!pathname || HIDE_ON_PATHS.has(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-[64px] w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
            type="button"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-indigo-200 transition group-hover:-translate-x-0.5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200 shadow-inner shadow-indigo-500/30">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-indigo-200/80">
                {appName}
              </span>
              <span className="mt-1 h-[2px] w-10 rounded-full bg-indigo-400/60" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          ) : (
            <>
              <button
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => router.push("/profile")}
              >
                <UserCircle className="h-5 w-5 text-indigo-200" />
                <span className="font-semibold text-white">
                  {user?.name || user?.email || "User"}
                </span>
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() =>
                  supabase.auth
                    .signOut()
                    .then(() => {
                      toast.success("Logged out successfully");
                      router.push("/login");
                    })
                    .catch(() => toast.error("Logout failed"))
                }
              >
                <LogOut className="h-4 w-4 text-indigo-200" />
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
