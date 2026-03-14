"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeader from "@/components/PageHeader";

type ProfileState = {
  name: string;
  email: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUserId(session.user.id);
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", session.user.id)
        .maybeSingle();

      if (isMounted) {
        setProfile({
          name: profileRow?.name ?? "",
          email: profileRow?.email ?? session.user.email ?? "",
        });
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_60%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Profile" },
          ]}
        />
        <PageHeader title="Profile" subtitle="Update your account details." />
      </div>

      <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/70">
              Account
            </p>
            <h2 className="mt-1 text-lg font-semibold">Edit profile</h2>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="h-10 w-full animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-white/10" />
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!userId) {
                toast.error("Unable to load profile");
                return;
              }
              if (!profile.name.trim()) {
                toast.error("Name is required");
                return;
              }
              setSaving(true);
              const { error } = await supabase
                .from("profiles")
                .update({ name: profile.name.trim() })
                .eq("id", userId);

              if (error) {
                toast.error("Failed to update profile");
                setSaving(false);
                return;
              }

              toast.success("Profile updated");
              setSaving(false);
              router.push("/dashboard");
            }}
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/70">
                Name
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                value={profile.name}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/70">
                Email
              </label>
              <input
                className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400"
                value={profile.email}
                disabled
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => router.push("/dashboard")}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
