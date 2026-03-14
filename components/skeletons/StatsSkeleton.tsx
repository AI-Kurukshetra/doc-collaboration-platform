"use client";

export default function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`stat-skel-${index}`}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/40"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded-md bg-gray-700/80 animate-pulse" />
              <div className="h-6 w-16 rounded-md bg-gray-700/80 animate-pulse" />
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gray-700/80 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
