"use client";

export default function DocumentSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`doc-skel-${index}`}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/40"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-2xl bg-gray-700/80 animate-pulse" />
            <div className="h-3 w-16 rounded-md bg-gray-700/80 animate-pulse" />
          </div>
          <div className="mt-4 h-4 w-32 rounded-md bg-gray-700/80 animate-pulse" />
          <div className="mt-2 h-3 w-20 rounded-md bg-gray-700/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
