"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";

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

export default function AdminQueuePage() {
  const [tab, setTab] = useState<Tab>("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function load() {
    const [r, s, b] = await Promise.all([
      adminFetch<Review[]>("/admin/queue/reviews"),
      adminFetch<Strain[]>("/admin/queue/strains"),
      adminFetch<Batch[]>("/admin/queue/batches"),
    ]);
    setReviews(r);
    setStrains(s);
    setBatches(b);
  }

  useEffect(() => {
    load();
  }, []);

  async function approveReview(id: number) {
    await adminFetch(`/reviews/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ action: "approve" }),
    });
    load();
  }

  async function rejectReview(id: number) {
    await adminFetch(`/reviews/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "reject",
        rejection_reason: rejectionReason,
      }),
    });
    setRejectingId(null);
    setRejectionReason("");
    load();
  }

  async function approveStrain(id: number) {
    await adminFetch(`/strains/${id}/approve`, { method: "POST" });
    load();
  }

  async function approveBatch(id: number) {
    await adminFetch(`/batches/${id}/approve`, { method: "POST" });
    load();
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "reviews", label: "Reviews", count: reviews.length },
    { key: "strains", label: "Strains", count: strains.length },
    { key: "batches", label: "Batches", count: batches.length },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Moderation Queue</h1>

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === t.key
                ? "bg-green-900/40 text-green-400"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-2 rounded-full bg-yellow-600 px-2 py-0.5 text-xs text-white">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-gray-400">No pending reviews.</p>
          )}
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-gray-800 bg-gray-900 p-4"
            >
              <div className="flex gap-4">
                {r.photo_product_url && (
                  <img
                    src={
                      r.photo_product_url.startsWith("http")
                        ? r.photo_product_url
                        : `http://localhost:8001${r.photo_product_url}`
                    }
                    alt="Review photo"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {r.strain_name} — {r.batch_number}
                  </p>
                  <p className="text-sm text-gray-400">by {r.username}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                    <span>Appearance: {r.appearance_rating}/5</span>
                    <span>Aroma: {r.aroma_rating}/5</span>
                    <span>Moisture: {r.moisture_rating}/5</span>
                    <span>Flavour: {r.flavour_rating}/5</span>
                    <span>Effect: {r.effect_rating}/5</span>
                  </div>
                  {r.condition_ratings.length > 0 && (
                    <div className="mt-1 flex gap-2">
                      {r.condition_ratings.map((cr) => (
                        <span
                          key={cr.id}
                          className="rounded bg-gray-800 px-2 py-0.5 text-xs"
                        >
                          {cr.condition_name}: {cr.efficacy_rating}/5
                        </span>
                      ))}
                    </div>
                  )}
                  {r.written_narrative && (
                    <p className="mt-2 text-sm text-gray-300">
                      {r.written_narrative}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approveReview(r.id)}
                  className="rounded bg-green-700 px-4 py-1 text-sm hover:bg-green-600"
                >
                  Approve
                </button>
                {rejectingId === r.id ? (
                  <div className="flex gap-2">
                    <input
                      placeholder="Rejection reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => rejectReview(r.id)}
                      className="rounded bg-red-700 px-3 py-1 text-sm hover:bg-red-600"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setRejectingId(null)}
                      className="text-sm text-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRejectingId(r.id)}
                    className="rounded bg-red-900 px-4 py-1 text-sm hover:bg-red-800"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "strains" && (
        <div className="space-y-2">
          {strains.length === 0 && (
            <p className="text-gray-400">No pending strains.</p>
          )}
          {strains.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-3"
            >
              <div>
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-xs capitalize text-gray-400">
                  {s.strain_type}
                </span>
              </div>
              <button
                onClick={() => approveStrain(s.id)}
                className="rounded bg-green-700 px-3 py-1 text-sm hover:bg-green-600"
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "batches" && (
        <div className="space-y-2">
          {batches.length === 0 && (
            <p className="text-gray-400">No pending batches.</p>
          )}
          {batches.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-3"
            >
              <div>
                <span className="font-mono text-sm">{b.batch_number}</span>
                <span className="ml-2 text-sm text-gray-400">
                  {b.strain_name}
                </span>
              </div>
              <button
                onClick={() => approveBatch(b.id)}
                className="rounded bg-green-700 px-3 py-1 text-sm hover:bg-green-600"
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
