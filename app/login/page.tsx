"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const emailTrimmed = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        throw new Error("Please enter a valid email address.");
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (loginError) {
        throw new Error(loginError.message || "Unable to sign in.");
      }

      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 px-4 py-12 text-slate-100">
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_transparent_55%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
            <span className="text-lg font-semibold">EDU</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
              Edu Annotate
            </p>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-200/80">
          Log in to access your classroom documents.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none ring-indigo-400/40 placeholder:text-slate-300/70 focus:border-indigo-300/50 focus:ring-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.edu"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none ring-indigo-400/40 placeholder:text-slate-300/70 focus:border-indigo-300/50 focus:ring-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          <button
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-200/80">
          Don&apos;t have an account?{" "}
          <Link
            className="font-semibold text-white transition hover:text-indigo-200"
            href="/signup"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
