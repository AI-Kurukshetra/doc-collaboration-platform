import Link from "next/link";
import {
  BookOpenCheck,
  FileText,
  GraduationCap,
  Highlighter,
  MessageCircle,
  School,
  Upload,
  Users,
} from "lucide-react";

const features = [
  {
    icon: School,
    title: "Virtual Classrooms",
    description:
      "Create and manage classrooms, invite students, and keep everything organized in one place.",
  },
  {
    icon: Upload,
    title: "Document Uploads",
    description:
      "Upload PDFs and study materials for your entire class to access instantly.",
  },
  {
    icon: Highlighter,
    title: "Rich Annotations",
    description:
      "Highlight, pin notes, and mark up documents directly on the page for deeper understanding.",
  },
  {
    icon: MessageCircle,
    title: "Threaded Comments",
    description:
      "Discuss documents in real time with per-document comment threads visible to the whole class.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Teachers manage content and classrooms. Students view, annotate, and collaborate.",
  },
  {
    icon: BookOpenCheck,
    title: "Organized Dashboard",
    description:
      "A single dashboard to see classrooms, recent documents, and student activity at a glance.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create a classroom",
    description:
      "Sign up as a teacher, name your classroom, and you're ready to go.",
  },
  {
    step: "02",
    title: "Upload documents",
    description:
      "Add PDFs and study materials that your students can access anytime.",
  },
  {
    step: "03",
    title: "Invite students",
    description:
      "Add students to your classroom so they can view and annotate documents.",
  },
  {
    step: "04",
    title: "Collaborate",
    description:
      "Annotate, highlight, and discuss documents together in real time.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200 shadow-inner shadow-indigo-500/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200/90">
              EduAnnotate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-50 [background:radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(129,140,248,0.15),transparent_50%)]" />

        <div className="mx-auto max-w-5xl px-6 pb-24 pt-28 text-center sm:pt-36">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-200">
            <FileText className="h-3.5 w-3.5" />
            Classroom document collaboration
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Annotate, discuss &amp;{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              learn together
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300/90">
            EduAnnotate brings teachers and students onto one platform where
            documents come alive with highlights, notes, and real-time
            discussions.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400"
            >
              Start for free
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* decorative divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
      </section>

      {/* ── Features ── */}
      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 opacity-30 [background:radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.2),transparent_60%)]" />

        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300/80">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Everything you need for classroom collaboration
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              From uploading materials to annotating and discussing them,
              EduAnnotate covers every step of the collaborative learning
              process.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_60%)]" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 shadow-inner shadow-indigo-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── How it works ── */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300/80">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Up and running in minutes
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div key={item.step} className="relative text-center">
                <span className="text-5xl font-black text-indigo-500/15">
                  {item.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── CTA ── */}
      <section className="relative py-24">
        <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_55%)]" />

        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to transform your classroom?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Join teachers and students who are already using EduAnnotate to make
            document collaboration effortless.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400"
            >
              Create free account
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
