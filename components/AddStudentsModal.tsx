"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

type StudentProfile = {
  id: string;
  name: string | null;
  email: string | null;
};

type AddStudentsModalProps = {
  open: boolean;
  students: StudentProfile[];
  existingStudentIds: Set<string>;
  onClose: () => void;
  onSubmit: (studentIds: string[]) => Promise<void>;
};

export default function AddStudentsModal({
  open,
  students,
  existingStudentIds,
  onClose,
  onSubmit,
}: AddStudentsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const selectableStudents = useMemo(
    () => students.filter((student) => !existingStudentIds.has(student.id)),
    [students, existingStudentIds]
  );

  if (!open) return null;

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(Array.from(selected));
      setSelected(new Set());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
        role="presentation"
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Add Students
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Select students to add to this classroom.
            </p>
          </div>
          <button
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            type="button"
            onClick={() => !saving && onClose()}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
          {students.length ? (
            students.map((student) => {
              const isExisting = existingStudentIds.has(student.id);
              return (
                <label
                  key={student.id}
                  className={`flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white ${
                    isExisting ? "opacity-60" : "hover:border-white/20"
                  }`}
                >
                  <div>
                    <p className="font-semibold">
                      {student.name || "Unnamed student"}
                    </p>
                    <p className="text-xs text-slate-300">
                      {student.email || "No email"}
                    </p>
                    {isExisting ? (
                      <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">
                        Already added
                      </p>
                    ) : null}
                  </div>
                  <input
                    className="h-4 w-4 accent-indigo-500"
                    type="checkbox"
                    checked={isExisting || selected.has(student.id)}
                    disabled={isExisting || saving}
                    onChange={() => handleToggle(student.id)}
                  />
                </label>
              );
            })
          ) : (
            <p className="text-sm text-slate-300">
              No students found.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
            type="button"
            onClick={handleSubmit}
            disabled={saving || selectableStudents.length === 0}
          >
            {saving ? "Adding..." : "Add Selected Students"}
          </button>
        </div>
      </div>
    </div>
  );
}
