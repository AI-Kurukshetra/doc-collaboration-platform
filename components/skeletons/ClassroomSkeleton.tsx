"use client";

export default function ClassroomSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`classroom-skel-${index}`}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/40"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded-md bg-gray-700/80 animate-pulse" />
              <div className="h-5 w-32 rounded-md bg-gray-700/80 animate-pulse" />
            </div>
            <div className="h-11 w-11 rounded-2xl bg-gray-700/80 animate-pulse" />
          </div>
          <div className="mt-4 h-3 w-28 rounded-md bg-gray-700/80 animate-pulse" />
          <div className="mt-6 h-9 w-full rounded-xl bg-gray-700/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
