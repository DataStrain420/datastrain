"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

const C = brand;

type ReportType = "bug" | "feature" | "feedback" | "other";
type Severity = "low" | "medium" | "high" | "critical";

const TYPE_OPTIONS: { value: ReportType; label: string; icon: string }[] = [
  { value: "bug", label: "Bug", icon: "\u{1F41E}" },
  { value: "feature", label: "Feature", icon: "\u{2728}" },
  { value: "feedback", label: "Feedback", icon: "\u{1F4AC}" },
  { value: "other", label: "Other", icon: "\u{2753}" },
];

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const MAX_IMAGES = 10;

interface UploadedImage {
  url: string;
  name: string;
}

/**
 * Floating Quick Report widget. A small circular launcher pinned to the
 * bottom-left of every page; click (or press F8) to open a slide-up panel
 * where the visitor can file a bug / feature / feedback note. Esc closes.
 * Submissions go to POST /reports.
 */
export default function QuickReport() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [reportType, setReportType] = useState<ReportType>("bug");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts — Esc to close, F8 to toggle (mirrors the screenshot
  // the user shared). Paste from clipboard adds images when the panel is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "F8") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Autofocus title when the panel opens; reset success banner.
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setError(null);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [open]);

  // Paste images directly from the clipboard while the panel is open.
  useEffect(() => {
    if (!open) return;
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items || []);
      const files = items
        .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) {
        e.preventDefault();
        void uploadFiles(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, images.length]);

  function resetForm() {
    setReportType("bug");
    setSeverity("medium");
    setTitle("");
    setDescription("");
    setImages([]);
    setError(null);
  }

  async function uploadFiles(files: File[]) {
    if (images.length >= MAX_IMAGES) return;
    const slots = MAX_IMAGES - images.length;
    const accepted = files.slice(0, slots);
    setUploading(true);
    setError(null);
    try {
      const uploaded: UploadedImage[] = [];
      for (const file of accepted) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await apiFetch<{ url: string }>("/reports/upload", {
          method: "POST",
          body: fd,
        });
        uploaded.push({ url: r.url, name: file.name });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/reports/", {
        method: "POST",
        body: JSON.stringify({
          report_type: reportType,
          severity,
          title: title.trim(),
          description: description.trim() || null,
          page_path: pathname,
          screenshot_urls: images.map((i) => i.url),
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
        }),
      });
      setSubmitted(true);
      resetForm();
      // Auto-close after a moment so the success banner is seen
      setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
    setSubmitting(false);
  }

  return (
    <>
      {/* ── Floating launcher ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open quick report"
        className="fixed bottom-4 left-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition hover:scale-105 active:scale-95"
        style={{
          backgroundColor: C.bgCard,
          border: `1.5px solid ${C.primary}66`,
          boxShadow: `0 4px 14px rgba(0,0,0,0.4), 0 0 0 4px ${C.primary}10`,
          color: C.primary,
        }}
        title="Report a bug or suggest a feature (F8)"
      >
        {/* Warning-triangle icon — same vibe as the reference screenshot */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* ── Slide-up panel ───────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-3xl px-4 pb-4"
          role="dialog"
          aria-labelledby="quickreport-heading"
        >
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: C.bgCard,
              border: `1px solid ${C.primary}55`,
              boxShadow: `0 -8px 32px rgba(0,0,0,0.55), 0 0 60px ${C.primary}10`,
            }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: `${C.textMuted}22` }}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h2 id="quickreport-heading" className="text-sm font-bold text-white">
                  Quick Report
                </h2>
                <span className="font-mono text-[11px]" style={{ color: C.textMuted }}>
                  {pathname || "/"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-[11px] sm:inline" style={{ color: C.textMuted }}>
                  Esc to close · F8 to toggle
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition hover:opacity-80"
                  style={{ color: C.textMuted, backgroundColor: C.bgDeep }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
              {/* Type + Severity row */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none"
                  style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                  aria-label="Report type"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none"
                  style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                  aria-label="Severity"
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="What's the problem or idea? *"
                className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
              />

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="More details (optional)."
                className="w-full resize-none rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
              />

              {/* Image upload row */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || images.length >= MAX_IMAGES}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33`, color: "#fff" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  {uploading ? "Uploading..." : "Add image"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    if (files.length) void uploadFiles(files);
                    e.target.value = "";
                  }}
                  hidden
                />
                <span className="text-[11px]" style={{ color: C.textMuted }}>
                  {images.length}/{MAX_IMAGES} · or paste with Ctrl+V
                </span>
              </div>

              {/* Image previews */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => {
                    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace(/\/api\/v1\/?$/, "");
                    const src = img.url.startsWith("http") ? img.url : `${apiBase}${img.url}`;
                    return (
                      <div key={i} className="relative">
                        <img
                          src={src}
                          alt={img.name}
                          className="h-14 w-14 rounded-md object-cover"
                          style={{ border: `1px solid ${C.textMuted}33` }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs leading-none text-white shadow-md transition hover:opacity-80"
                          style={{ backgroundColor: "#dc2626" }}
                          aria-label={`Remove ${img.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Error + success banners */}
              {error && (
                <p className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: "#dc262622", color: "#fca5a5" }}>
                  {error}
                </p>
              )}
              {submitted && (
                <p className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: `${C.primary}22`, color: C.primary }}>
                  Thanks — report submitted.
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: C.primary, color: C.bgDeep }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {submitting ? "Sending..." : "Send report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
