"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, MessageCircle, Send } from "lucide-react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import AnnotationLayer, {
  Annotation,
  AnnotationPosition,
} from "@/components/AnnotationLayer";
import AnnotationMarkers, {
  MarkerAnnotation,
} from "@/components/AnnotationMarkers";
import Breadcrumbs from "@/components/Breadcrumbs";
import toast from "react-hot-toast";
import ListSkeleton from "@/components/skeletons/ListSkeleton";

const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
});

type DocumentRow = {
  id: string;
  title: string | null;
  uploaded_by: string;
  created_at: string;
  file_url: string | null;
  classroom_id: string | null;
};

type CommentRow = {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profile: { name: string | null } | null;
};

const normalizeProfile = (
  profile:
    | { name: string | null }
    | ({ name: string | null } | null)[]
    | null
) => {
  if (!profile) return null;
  if (Array.isArray(profile)) {
    return profile.find((item) => item !== null) ?? null;
  }
  return profile;
};

const normalizeUser = (
  user:
    | { name: string | null }
    | ({ name: string | null } | null)[]
    | null
) => {
  if (!user) return null;
  if (Array.isArray(user)) {
    return user.find((item) => item !== null) ?? null;
  }
  return user;
};

export default function DocumentViewerPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<DocumentRow | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [noteAnnotations, setNoteAnnotations] = useState<MarkerAnnotation[]>(
    []
  );
  const [newComment, setNewComment] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isValidPdf, setIsValidPdf] = useState(true);
  const [isAnnotateMode, setIsAnnotateMode] = useState(false);
  const [noteDraft, setNoteDraft] = useState<{
    page: number;
    x: number;
    y: number;
  } | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDocument = async () => {
      const { pdfjs } = await import("react-pdf");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const { data: docData, error: docError } = await supabase
          .from("documents")
          .select("id, title, uploaded_by, created_at, file_url, classroom_id")
          .eq("id", documentId)
          .single();

        if (docError) {
          throw docError;
        }

        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("id, message, created_at, user_id, profile:profiles(name)")
          .eq("document_id", documentId)
          .order("created_at", { ascending: false });

        if (commentsError) {
          throw commentsError;
        }

        const { data: annotationsData, error: annotationsError } =
          await supabase
            .from("annotations")
            .select("id, type, content, position, user_id, created_at")
            .eq("document_id", documentId);

        const { data: noteData, error: noteError } = await supabase
          .from("annotations")
          .select(
            "id, content, position, created_at, user:profiles(name)"
          )
          .eq("document_id", documentId)
          .eq("type", "note");

        if (annotationsError) {
          throw annotationsError;
        }
        if (noteError) {
          throw noteError;
        }

        if (isMounted) {
          setDoc(docData);
          const normalizedComments: CommentRow[] = (commentsData ?? []).map(
            (comment) => ({
              ...comment,
              profile: normalizeProfile(
                comment.profile as
                  | { name: string | null }
                  | ({ name: string | null } | null)[]
                  | null
              ),
            })
          );
          setComments(normalizedComments);
          setAnnotations((annotationsData ?? []) as Annotation[]);
          const normalizedNotes: MarkerAnnotation[] = (noteData ?? []).map(
            (note) => ({
              ...note,
              user: normalizeUser(
                note.user as
                  | { name: string | null }
                  | ({ name: string | null } | null)[]
                  | null
              ),
            })
          );
          setNoteAnnotations(normalizedNotes);
        }

        if (docData.file_url) {
          const rawUrl = docData.file_url;
          let objectPath: string | null = null;

          if (rawUrl.startsWith("http")) {
            const marker = "/documents/";
            const idx = rawUrl.indexOf(marker);
            if (idx !== -1) {
              objectPath = rawUrl.slice(idx + marker.length);
            }
          } else {
            objectPath = rawUrl;
          }

          if (objectPath) {
            objectPath = objectPath.split("?")[0];
            const { data: signed, error: signedError } =
              await supabase.storage
                .from("documents")
                .createSignedUrl(objectPath, 60 * 60);
            if (!signedError && signed?.signedUrl) {
              setViewerUrl(signed.signedUrl);
            } else {
              setViewerUrl(rawUrl);
            }
          } else {
            setViewerUrl(rawUrl);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load document."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [documentId, router]);

  useEffect(() => {
    let isMounted = true;

    const validatePdf = async () => {
      if (!viewerUrl) {
        setIsValidPdf(true);
        return;
      }

      try {
        const response = await fetch(viewerUrl);
        if (!response.ok) {
          throw new Error(`Unable to fetch PDF (status ${response.status}).`);
        }
        const buffer = await response.arrayBuffer();
        const header = new TextDecoder().decode(buffer.slice(0, 5));
        if (header !== "%PDF-") {
          throw new Error("The file is not a valid PDF.");
        }
        if (isMounted) {
          setIsValidPdf(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsValidPdf(false);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to validate the PDF file."
          );
        }
      }
    };

    validatePdf();

    return () => {
      isMounted = false;
    };
  }, [viewerUrl]);

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newComment.trim()) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: inserted, error: insertError } = await supabase
        .from("comments")
        .insert({
          document_id: documentId,
          user_id: session.user.id,
          message: newComment.trim(),
          created_at: new Date().toISOString(),
        })
        .select("id, message, created_at, user_id, profile:profiles(name)")
        .single();

      if (insertError) {
        throw insertError;
      }

      const normalizedInserted = inserted
        ? {
            ...inserted,
            profile: normalizeProfile(
              inserted.profile as
                | { name: string | null }
                | ({ name: string | null } | null)[]
                | null
            ),
          }
        : null;
      setComments((prev) =>
        normalizedInserted ? [normalizedInserted, ...prev] : prev
      );
      setNewComment("");
      toast.success("Comment added");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to add comment.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnnotation = async (payload: {
    type: "highlight" | "note";
    content: string | null;
    position: AnnotationPosition;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("annotations")
      .insert({
        document_id: documentId,
        user_id: user.id,
        type: payload.type,
        content: payload.content,
        position: payload.position,
        created_at: new Date().toISOString(),
      })
      .select("id, type, content, position, user_id, created_at")
      .single();

    if (insertError) {
      setError(insertError.message);
      toast.error(insertError.message);
      return;
    }

    setAnnotations((prev) => (inserted ? [inserted as Annotation, ...prev] : prev));
    toast.success("Annotation saved");
  };

  const handleTextHighlight = async (
    page: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isAnnotateMode) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const left = Math.max(0, rect.left - bounds.left);
    const top = Math.max(0, rect.top - bounds.top);
    const width = Math.min(rect.width, bounds.width - left);
    const height = Math.min(rect.height, bounds.height - top);

    if (width < 4 || height < 4) return;

    await handleCreateAnnotation({
      type: "highlight",
      content: null,
      position: {
        page,
        x: left / 760,
        y: top / 760,
        width: width / 760,
        height: height / 760,
      },
    });

    selection.removeAllRanges();
  };

  const handleSaveNote = async () => {
    if (!noteDraft || !noteText.trim()) {
      setNoteDraft(null);
      setNoteText("");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const position = {
      page: noteDraft.page,
      x: noteDraft.x,
      y: noteDraft.y,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("annotations")
      .insert({
        document_id: documentId,
        user_id: user.id,
        type: "note",
        content: noteText.trim(),
        position,
        created_at: new Date().toISOString(),
      })
      .select("id, content, position, created_at, user:profiles(name)")
      .single();

    if (insertError) {
      setError(insertError.message);
      toast.error(insertError.message);
      return;
    }

    const normalizedInsertedNote = inserted
      ? {
          ...inserted,
          user: normalizeUser(
            inserted.user as
              | { name: string | null }
              | ({ name: string | null } | null)[]
              | null
          ),
        }
      : null;
    setNoteAnnotations((prev) =>
      normalizedInsertedNote ? [normalizedInsertedNote, ...prev] : prev
    );
    setNoteDraft(null);
    setNoteText("");
    toast.success("Note added");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">
                Document
              </p>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-5 w-48 rounded-md bg-gray-700/80 animate-pulse" />
                  <div className="h-3 w-32 rounded-md bg-gray-700/80 animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="mt-1 text-2xl font-semibold text-white">
                    {doc?.title || "Document"}
                  </h1>
                  <p className="mt-1 text-xs text-slate-300">
                    Uploaded{" "}
                    {doc?.created_at
                      ? new Date(doc.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </>
              )}
              <Breadcrumbs
                items={[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Classrooms", href: "/classrooms" },
                  {
                    label: doc?.classroom_id ? "Classroom" : "Classroom",
                    href: doc?.classroom_id
                      ? `/classrooms/${doc.classroom_id}`
                      : "/classrooms",
                  },
                  { label: doc?.title || "Document" },
                ]}
              />
            </div>
          </div>
          <button
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/20"
            type="button"
            onClick={() =>
              doc?.classroom_id
                ? router.push(`/classrooms/${doc.classroom_id}`)
                : router.back()
            }
          >
            Back to Classroom
          </button>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/40">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Document Viewer</p>
              <div className="flex items-center gap-3">
                <button
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isAnnotateMode
                      ? "border-indigo-300/40 bg-indigo-500/20 text-indigo-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
                  }`}
                  type="button"
                  onClick={() => setIsAnnotateMode((prev) => !prev)}
                >
                  {isAnnotateMode ? "Annotate: On" : "Annotate: Off"}
                </button>
                <span className="text-xs text-slate-400">
                  {pageCount ? `${pageCount} pages` : ""}
                </span>
              </div>
            </div>
            <div className="flex max-h-[72vh] justify-center overflow-y-auto rounded-2xl bg-slate-900/60 p-6">
              {loading ? (
                <p className="text-sm text-slate-300">Loading document...</p>
              ) : viewerUrl && isValidPdf ? (
                <Document
                  file={viewerUrl}
                  onLoadSuccess={({ numPages }) => setPageCount(numPages)}
                  loading={<p className="text-sm text-slate-300">Loading…</p>}
                >
                  {Array.from({ length: pageCount }, (_, index) => (
                    <div
                      key={`page_${index + 1}`}
                      className="relative mb-8 last:mb-0"
                      style={{ width: 760 }}
                      onMouseUp={(event) =>
                        handleTextHighlight(index + 1, event)
                      }
                    >
                      <Page
                        pageNumber={index + 1}
                        width={760}
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                        className="rounded-lg"
                      />
                      <AnnotationLayer
                        page={index + 1}
                        pageWidth={760}
                        annotations={annotations.filter(
                          (item) => item.position.page === index + 1
                        )}
                        enabled={isAnnotateMode}
                        onCreate={handleCreateAnnotation}
                      />
                      <div
                        className={`absolute inset-0 ${
                          isAnnotateMode ? "" : "pointer-events-none"
                        }`}
                        role="presentation"
                        onClick={(event) => {
                          if (!isAnnotateMode) return;
                          const bounds =
                            event.currentTarget.getBoundingClientRect();
                          const x = event.clientX - bounds.left;
                          const y = event.clientY - bounds.top;
                          setNoteDraft({
                            page: index + 1,
                            x: x / 760,
                            y: y / 760,
                          });
                        }}
                      />
                      <AnnotationMarkers
                        page={index + 1}
                        pageWidth={760}
                        annotations={noteAnnotations}
                      />
                    </div>
                  ))}
                </Document>
              ) : (
                <p className="text-sm text-slate-300">
                  No file attached to this document.
                </p>
              )}
            </div>
          </section>

          <aside className="relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-900/40 lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-indigo-300" />
                <h2 className="text-sm font-semibold text-white">Comments</h2>
              </div>
              <span className="text-xs text-slate-400">
                {comments.length}
              </span>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <ListSkeleton rows={3} />
              ) : comments.length ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">
                        {comment.profile?.name || "User"}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      {comment.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-300">
                  No comments yet. Start the discussion.
                </p>
              )}
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleAddComment}>
              <textarea
                className="min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none ring-indigo-400/40 placeholder:text-slate-400 focus:border-indigo-300/50 focus:ring-2"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
              />
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={submitting}
              >
                <Send className="h-4 w-4" />
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </aside>
        </div>
      </div>

      {noteDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => {
              setNoteDraft(null);
              setNoteText("");
            }}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">Add Note</h2>
            <p className="mt-1 text-sm text-slate-300">
              Leave a quick note at this spot.
            </p>
            <textarea
              className="mt-4 h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-indigo-400/40 placeholder:text-slate-400 focus:border-indigo-300/50 focus:ring-2"
              placeholder="Type your note..."
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                type="button"
                onClick={() => {
                  setNoteDraft(null);
                  setNoteText("");
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                type="button"
                onClick={handleSaveNote}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
