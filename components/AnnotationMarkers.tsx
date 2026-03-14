"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";

type MarkerPosition = {
  page: number;
  x: number;
  y: number;
};

export type MarkerAnnotation = {
  id: string;
  content: string | null;
  position: MarkerPosition;
  created_at: string;
  user: { name: string | null } | null;
};

type AnnotationMarkersProps = {
  page: number;
  pageWidth: number;
  annotations: MarkerAnnotation[];
};

export default function AnnotationMarkers({
  page,
  pageWidth,
  annotations,
}: AnnotationMarkersProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const pageAnnotations = useMemo(
    () => annotations.filter((item) => item.position.page === page),
    [annotations, page]
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {pageAnnotations.map((annotation) => {
        const left = annotation.position.x * pageWidth;
        const top = annotation.position.y * pageWidth;
        const isActive = activeId === annotation.id;
        return (
          <div
            key={annotation.id}
            className="pointer-events-auto absolute"
            style={{ left, top }}
          >
            <button
              className="group flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 transition hover:scale-105"
              type="button"
              onClick={() =>
                setActiveId(isActive ? null : annotation.id)
              }
            >
              <MapPin className="h-3.5 w-3.5" />
            </button>

            {isActive ? (
              <div className="absolute left-7 top-0 z-20 w-56 rounded-2xl border border-white/10 bg-slate-950/95 p-3 text-xs text-slate-100 shadow-xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">
                  Note
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {annotation.user?.name || "User"}
                </p>
                <p className="mt-2 text-xs text-slate-200">
                  {annotation.content || "No content"}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {new Date(annotation.created_at).toLocaleString()}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
