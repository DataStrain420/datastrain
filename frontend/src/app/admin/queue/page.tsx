"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { brand } from "@/lib/brand";

const C = brand;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";
// Photo paths are stored as "/uploads/..." relative to the backend origin;
// prepend the backend origin (API URL without the trailing /api/v1) so the
// admin UI can render them regardless of where the backend is hosted.
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

function resolvePhoto(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url}`;
}

interface ConditionRating {
  id: number;
  condition_name: string;
  efficacy_rating: number;
}

interface Review {
  id: number;
  username: string | null;
  batch_number: string | null;
  strain_name: string | null;
  appearance_rating: number;
  aroma_rating: number;
  moisture_rating: number;
  flavour_rating: number;
  effect_rating: number;
  written_narrative: string | null;
  photo_product_url: string | null;
  condition_ratings: ConditionRating[];
  created_at: string;
}

interface Strain {
  id: number;
  name: string;
  strain_type: string;
  approved: boolean;
}

interface Batch {
  id: number;
  batch_number: string;
  strain_name: string | null;
  approved: boolean;
}

type Tab = "reviews" | "strains" | "batches";

function Chip({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition"
      style={{
        borderColor: active ? `${C.secondary}66` : `${C.textMuted}22`,
        color: active ? C.secondary : C.textMuted,
        backgroundColor: active ? `${C.secondary}18` : "transparent",
      }}
    >
      {label}
      <span
        className="min-w-[20px] rounded-full px-1.5 text-center text-[10px]"
        style={{
          backgroundColor: value > 0 ? C.secondary : `${C.textMuted}22`,
          color: value > 0 ? C.bgDeep : C.textMuted,
        }}
      >
        {value}
      </span>
    </span>
  );
}

export default function AdminQueuePage() {
  const [tab, setTab] = useState<Tab>("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    // Independent .catch() per call so a 500 on batches (or strains) can't
    // hide the reviews queue — historically one endpoint failing dropped
    // the whole tab to zero silently.
    const [r, s, b] = await Promise.all([
      adminFetch<Review[]>("/admin/queue/reviews").catch((err) => {
        console.error("queue/reviews:", err);
        return [] as Review[];
      }),
      adminFetch<Strain[]>("/admin/queue/strains").catch((err) => {
        console.error("queue/strains:", err);
        return [] as Strain[];
      }),
      adminFetch<Batch[]>("/admin/queue/batches").catch((err) => {
        console.error("queue/batches:", err);
        return [] as Batch[];
      }),
    ]);
    setReviews(r);
    setStrains(s);
    setBatches(b);
  }

  useEffect(() => {
    load();
  }, []);

  async function approveReview(id: number) {
    setBusyId(id);
    try {
      await adminFetch(`/reviews/${id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve" }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function rejectReview(id: number) {
    setBusyId(id);
    try {
      await adminFetch(`/reviews/${id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectionReason,
        }),
      });
      setRejectingId(null);
      setRejectionReason("");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function approveStrain(id: number) {
    setBusyId(id);
    try {
      await adminFetch(`/strains/${id}/approve`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function approveBatch(id: number) {
    setBusyId(id);
    try {
      await adminFetch(`/batches/${id}/approve`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "reviews", label: "Reviews", count: reviews.length },
    { key: "strains", label: "Strains", count: strains.length },
    { key: "batches", label: "Batches", count: batches.length },
  ];

  const primaryBtn = {
    backgroundColor: C.primary,
    color: C.bgDeep,
  } as const;
  const dangerBtn = {
    backgroundColor: "#f87171",
    color: C.bgDeep,
  } as const;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-white">Moderation queue</h2>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
          Approve or reject patient submissions before they hit the public site.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "cursor-pointer border-0 bg-transparent p-0 text-left transition hover:brightness-125",
            )}
          >
            <Chip label={t.label} value={t.count} active={tab === t.key} />
          </button>
        ))}
      </div>

      {tab === "reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <p className="text-sm" style={{ color: C.textMuted }}>
                No pending reviews. You&apos;re all caught up. 🎉
              </p>
            </div>
          )}
          {reviews.map((r) => {
            const photo = resolvePhoto(r.photo_product_url);
            return (
              <article
                key={r.id}
                className="rounded-2xl p-5"
                style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {photo && (
                    <img
                      src={photo}
                      alt="Review photo"
                      className="h-32 w-32 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-base font-bold text-white">{r.strain_name}</p>
                      {r.batch_number && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-mono"
                          style={{
                            backgroundColor: C.bgDeep,
                            color: C.textMuted,
                            border: `1px solid ${C.textMuted}22`,
                          }}
                        >
                          {r.batch_number}
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: C.textMuted }}>
                      by <span className="font-semibold text-white">{r.username || "anonymous"}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.textMuted }}>
                      <span>Appearance <b className="text-white">{r.appearance_rating}</b>/5</span>
                      <span>Aroma <b className="text-white">{r.aroma_rating}</b>/5</span>
                      <span>Moisture <b className="text-white">{r.moisture_rating}</b>/5</span>
                      <span>Flavour <b className="text-white">{r.flavour_rating}</b>/5</span>
                      <span>Effect <b className="text-white">{r.effect_rating}</b>/5</span>
                    </div>
                    {r.condition_ratings.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.condition_ratings.map((cr) => (
                          <span
                            key={cr.id}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: `${C.success}18`,
                              color: C.success,
                              border: `1px solid ${C.success}55`,
                            }}
                          >
                            {cr.condition_name} · {cr.efficacy_rating}/5
                          </span>
                        ))}
                      </div>
                    )}
                    {r.written_narrative && (
                      <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                        &ldquo;{r.written_narrative}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: `${C.textMuted}18` }}>
                  <button
                    onClick={() => approveReview(r.id)}
                    disabled={busyId === r.id}
                    className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                    style={primaryBtn}
                  >
                    {busyId === r.id ? "..." : "Approve"}
                  </button>
                  {rejectingId === r.id ? (
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <input
                        placeholder="Rejection reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: C.bgDeep,
                          border: `1px solid ${C.textMuted}33`,
                          outlineColor: C.secondary,
                        }}
                      />
                      <button
                        onClick={() => rejectReview(r.id)}
                        disabled={busyId === r.id}
                        className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                        style={dangerBtn}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                        className="text-xs underline"
                        style={{ color: C.textMuted }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRejectingId(r.id)}
                      className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:brightness-110"
                      style={{
                        borderColor: "#f8717166",
                        color: "#f87171",
                        backgroundColor: "#f8717110",
                      }}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "strains" && (
        <div className="space-y-3">
          {strains.length === 0 && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <p className="text-sm" style={{ color: C.textMuted }}>
                No pending strains.
              </p>
            </div>
          )}
          {strains.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl p-4"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <div className="min-w-0">
                <Link
                  href={`/strain/${s.id}`}
                  target="_blank"
                  className="text-sm font-semibold text-white hover:underline"
                >
                  {s.name}
                </Link>
                <span className="ml-2 text-xs capitalize" style={{ color: C.textMuted }}>
                  {s.strain_type}
                </span>
              </div>
              <button
                onClick={() => approveStrain(s.id)}
                disabled={busyId === s.id}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                style={primaryBtn}
              >
                {busyId === s.id ? "..." : "Approve"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "batches" && (
        <div className="space-y-3">
          {batches.length === 0 && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <p className="text-sm" style={{ color: C.textMuted }}>
                No pending batches.
              </p>
            </div>
          )}
          {batches.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl p-4"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <div className="min-w-0">
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-xs"
                  style={{
                    backgroundColor: C.bgDeep,
                    color: C.textMuted,
                    border: `1px solid ${C.textMuted}22`,
                  }}
                >
                  {b.batch_number}
                </span>
                <span className="ml-2 text-sm text-white">{b.strain_name}</span>
              </div>
              <button
                onClick={() => approveBatch(b.id)}
                disabled={busyId === b.id}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                style={primaryBtn}
              >
                {busyId === b.id ? "..." : "Approve"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
