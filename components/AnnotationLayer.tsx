"use client";

import { useMemo, useState } from "react";
import { MessageSquarePlus } from "lucide-react";

export type AnnotationPosition = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Annotation = {
  id: string;
  type: "highlight" | "note";
  content: string | null;
  position: AnnotationPosition;
  user_id: string;
  created_at: string;
};

type AnnotationLayerProps = {
  page: number;
  pageWidth: number;
  annotations: Annotation[];
  enabled: boolean;
  onCreate: (payload: {
    type: "highlight" | "note";
    content: string | null;
    position: AnnotationPosition;
  }) => void;
};

type DraftSelection = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export default function AnnotationLayer({
  page,
  pageWidth,
  annotations,
  enabled,
  onCreate,
}: AnnotationLayerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<DraftSelection | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [noteText, setNoteText] = useState("");

  const normalizedSelection = useMemo(() => {
    if (!selection) return null;
    const x = Math.min(selection.startX, selection.endX);
    const y = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);
    if (width < 8 || height < 8) return null;
    return { x, y, width, height };
  }, [selection]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setShowMenu(false);
    setNoteText("");
    const bounds = event.currentTarget.getBoundingClientRect();
    const startX = event.clientX - bounds.left;
    const startY = event.clientY - bounds.top;
    setSelection({ startX, startY, endX: startX, endY: startY });
    setIsSelecting(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selection) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const endX = event.clientX - bounds.left;
    const endY = event.clientY - bounds.top;
    setSelection({ ...selection, endX, endY });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    if (normalizedSelection) {
      setShowMenu(true);
      return;
    }

    if (selection) {
      const fallbackWidth = 140;
      const fallbackHeight = 28;
      setSelection({
        startX: selection.startX,
        startY: selection.startY,
        endX: selection.startX + fallbackWidth,
        endY: selection.startY + fallbackHeight,
      });
      setShowMenu(true);
      return;
    }

    setSelection(null);
  };

  const handleCreate = (type: "highlight" | "note") => {
    if (!normalizedSelection) return;
    const position: AnnotationPosition = {
      page,
      x: normalizedSelection.x / pageWidth,
      y: normalizedSelection.y / pageWidth,
      width: normalizedSelection.width / pageWidth,
      height: normalizedSelection.height / pageWidth,
    };
    onCreate({
      type,
      content: type === "note" ? noteText.trim() || null : null,
      position,
    });
    setSelection(null);
    setShowMenu(false);
    setNoteText("");
  };

  if (!enabled) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isSelecting) handleMouseUp();
      }}
      role="presentation"
    >
      {annotations.map((annotation) => {
        const pos = annotation.position;
        const left = pos.x * pageWidth;
        const top = pos.y * pageWidth;
        const width = pos.width * pageWidth;
        const height = pos.height * pageWidth;
        return (
          <div
            key={annotation.id}
            className={`absolute rounded ${
              annotation.type === "highlight"
                ? "bg-yellow-300/40"
                : "bg-indigo-400/20"
            }`}
            style={{ left, top, width, height }}
          >
            {annotation.type === "note" ? (
              <div className="absolute -right-2 -top-2 rounded-full bg-indigo-500 p-1 text-white shadow">
                <MessageSquarePlus className="h-3 w-3" />
              </div>
            ) : null}
          </div>
        );
      })}

      {normalizedSelection ? (
        <div
          className="absolute rounded border border-indigo-300/70 bg-indigo-200/20"
          style={{
            left: normalizedSelection.x,
            top: normalizedSelection.y,
            width: normalizedSelection.width,
            height: normalizedSelection.height,
          }}
        />
      ) : null}

      {showMenu && normalizedSelection ? (
        <div
          className="absolute flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-lg"
          style={{
            left: normalizedSelection.x,
            top: Math.max(0, normalizedSelection.y - 36),
          }}
        >
          <button
            className="rounded-full px-2 py-1 font-semibold text-slate-700 transition hover:bg-slate-100"
            type="button"
            onClick={() => handleCreate("highlight")}
          >
            Highlight
          </button>
          <button
            className="rounded-full px-2 py-1 font-semibold text-slate-700 transition hover:bg-slate-100"
            type="button"
            onClick={() => setShowMenu(false)}
          >
            Add Note
          </button>
        </div>
      ) : null}

      {!showMenu && normalizedSelection ? (
        <div
          className="absolute w-56 rounded-2xl border border-white/10 bg-slate-950/90 p-3 text-xs text-slate-100 shadow-xl"
          style={{
            left: normalizedSelection.x,
            top: Math.min(normalizedSelection.y + normalizedSelection.height + 8, 520),
          }}
        >
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
            Add Note
          </p>
          <textarea
            className="h-20 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-indigo-300/50"
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Write a note..."
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="rounded-full px-2 py-1 text-xs text-slate-300 transition hover:text-white"
              type="button"
              onClick={() => {
                setSelection(null);
                setNoteText("");
              }}
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-indigo-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-indigo-400"
              type="button"
              onClick={() => handleCreate("note")}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
