"use client";

import StrainCard, { type CardData } from "@/components/StrainCard";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar, { PublicNavActions } from "@/components/Navbar";

const C = brand;

interface Review {
  id: number;
  username: string | null;
  appearance_rating: number;
  aroma_rating: number;
  moisture_rating: number;
  flavour_rating: number;
  effect_rating: number;
  written_narrative: string | null;
  photo_product_url: string | null;
  helpful_votes: number;
  created_at: string;
  condition_ratings: { condition_name: string; efficacy_rating: number }[];
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [card, setCard] = useState<CardData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  async function load() {
    const [c, r] = await Promise.all([
      apiFetch<CardData>(`/batches/${id}/card`),
      apiFetch<Review[]>(`/reviews/?batch_id=${id}&status=approved`),
    ]);
    setCard(c);
    setReviews(r);
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: C.textMuted }}>Loading...</p>
      </div>
    );
  }

  const avgRating = (r: Review) => {
    const sum = r.appearance_rating + r.aroma_rating + r.moisture_rating + r.flavour_rating + r.effect_rating;
    return (sum / 5).toFixed(1);
  };

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mx-auto max-w-sm">
          <StrainCard card={card} />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Reviews ({reviews.length})
            </h2>
            {user ? (
              <Link
                href="/portal/review/new"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: C.primary, color: C.bgDeep }}
              >
                Write a Review
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: C.primary, color: C.bgDeep }}
              >
                Sign in to Review
              </Link>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {reviews.length === 0 && (
              <p className="py-8 text-center" style={{ color: C.textMuted }}>
                No approved reviews yet. Be the first!
              </p>
            )}
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: C.bgCard,
                  border: `1px solid ${C.textMuted}22`,
                }}
              >
                <div className="flex gap-4">
                  {r.photo_product_url && (
                    <img
                      src={
                        r.photo_product_url.startsWith("http")
                          ? r.photo_product_url
                          : `http://localhost:8001${r.photo_product_url}`
                      }
                      alt="Review"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{r.username}</span>
                      <span className="text-xl font-bold" style={{ color: C.primary }}>
                        {avgRating(r)}/5
                      </span>
                    </div>
                    {r.condition_ratings.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.condition_ratings.map((cr, i) => (
                          <span
                            key={i}
                            className="rounded px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: `${C.secondary}20`,
                              color: C.secondary,
                            }}
                          >
                            {cr.condition_name}: {cr.efficacy_rating}/5
                          </span>
                        ))}
                      </div>
                    )}
                    {r.written_narrative && (
                      <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
                        {r.written_narrative}
                      </p>
                    )}
                    <div
                      className="mt-2 flex items-center gap-3 text-xs"
                      style={{ color: C.textMuted }}
                    >
                      <span>{r.helpful_votes} helpful</span>
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
