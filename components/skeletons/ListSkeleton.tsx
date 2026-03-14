"use client";

type ListSkeletonProps = {
  rows?: number;
};

export default function ListSkeleton({ rows = 4 }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`list-skel-${index}`}
          className="rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <div className="h-4 w-32 rounded-md bg-gray-700/80 animate-pulse" />
          <div className="mt-2 h-3 w-48 rounded-md bg-gray-700/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
