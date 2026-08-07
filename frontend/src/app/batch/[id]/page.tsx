"use client";

import StrainCard, { type CardData } from "@/components/StrainCard";
import ReviewCard from "@/components/ReviewCard";
import BatchMiniCard from "@/components/BatchMiniCard";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";

const C = brand;
const LEFT_COLUMN_MAX = 360;

interface Review {
  id: number;
  username: string | null;
  avatar_url: string | null;
  community_status: string | null;
  batch_id: number;
  strain_id: number | null;
  strain_name: string | null;
  batch_number: string | null;
  grower_id: number | null;
  grower_name: string | null;
  appearance_rating: number;
  aroma_rating: number;
  moisture_rating: number;
  flavour_rating: number;
  effect_rating: number;
  written_narrative: string | null;
  photo_product_url: string | null;
  photo_closeup_url: string | null;
  photo_packaging_url: string | null;
  effects: string[] | null;
  flavours: string[] | null;
  condition_ratings: { condition_name: string; efficacy_rating: number }[];
  helpful_votes: number;
  is_verified?: boolean;
  created_at: string;
}

interface SiblingBatch {
  id: number;
  batch_number: string;
  strain_name: string | null;
  grower_id: number | null;
  grower_name: string | null;
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [card, setCard] = useState<CardData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [siblings, setSiblings] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await apiFetch<CardData>(`/batches/${id}/card`);
        setCard(c);
        setLoading(false);

        // Reviews + sibling batches load in the background.
        const [r, sibs] = await Promise.all([
          apiFetch<Review[]>(`/reviews/?batch_id=${id}`).catch(() => []),
          c.strain_id
            ? apiFetch<SiblingBatch[]>(`/batches/?strain_id=${c.strain_id}&approved=true`).catch(() => [])
            : Promise.resolve([] as SiblingBatch[]),
        ]);
        setReviews(r);

        // Fetch card data for each sibling batch (excluding this one) so we
        // can render them with the same visual language as the hero card.
        const otherIds = sibs.filter((b) => b.id !== Number(id));
        const sibCards = await Promise.all(
          otherIds.map((b) => apiFetch<CardData>(`/batches/${b.id}/card`).catch(() => null)),
        );
        setSiblings(sibCards.filter((c): c is CardData => c !== null));
      } catch {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const currentAvg = useMemo(() => {
    if (!card) return null;
    const r = [
      card.avg_appearance_rating,
      card.avg_aroma_rating,
      card.avg_moisture_rating,
      card.avg_flavour_rating,
      card.avg_effect_rating,
    ].filter((v): v is number => typeof v === "number");
    return r.length === 5 ? r.reduce((a, b) => a + b, 0) / 5 : null;
  }, [card]);

  const trend = useMemo(() => {
    if (currentAvg === null || card?.previous_avg_rating == null) return null;
    const delta = currentAvg - card.previous_avg_rating;
    if (delta > 0.3) return { icon: "↑", delta, label: "Improving", color: C.primary };
    if (delta < -0.3) return { icon: "↓", delta, label: "Declining", color: "#f87171" };
    return { icon: "→", delta, label: "Steady", color: C.textMuted };
  }, [currentAvg, card?.previous_avg_rating]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: C.textMuted }}>Loading batch...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: C.textMuted }}>Batch not found.</p>
      </div>
    );
  }

  const chipStyle = (bg: string, fg: string, border: string) => ({
    backgroundColor: bg,
    color: fg,
    border: `1px solid ${border}`,
  });

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ── Hero: card on left, batch-first info panel on right ────── */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="mx-auto w-full shrink-0 lg:mx-0" style={{ maxWidth: LEFT_COLUMN_MAX }}>
            <StrainCard card={card} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <header
              className="rounded-2xl px-6 py-5"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.secondary }}>
                Batch report
              </p>
              <h1 className="font-mono text-2xl font-extrabold text-white sm:text-3xl">
                {card.batch_number}
              </h1>
              <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
                {card.strain_id ? (
                  <Link
                    href={`/strain/${card.strain_id}`}
                    className="font-semibold transition hover:underline"
                    style={{ color: C.primary }}
                  >
                    {card.strain_name}
                  </Link>
                ) : (
                  <span className="font-semibold text-white">{card.strain_name}</span>
                )}
                {card.grower_name && (
                  <>
                    {" · by "}
                    {card.grower_id ? (
                      <Link
                        href={`/grower/${card.grower_id}`}
                        className="font-semibold transition hover:underline"
                        style={{ color: C.primary }}
                      >
                        {card.grower_name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">{card.grower_name}</span>
                    )}
                  </>
                )}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {card.tested_date && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium"
                    style={chipStyle(C.bgDeep, C.textMuted, `${C.textMuted}22`)}
                    title={`Tested ${new Date(card.tested_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
                  >
                    <span aria-hidden>{"\u{1F5D3}\u{FE0F}"}</span>
                    Tested {new Date(card.tested_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
                  style={chipStyle(`${C.primary}18`, C.primary, `${C.primary}55`)}
                >
                  THC {card.thc_percentage}%
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
                  style={chipStyle(`${C.tertiary}18`, C.tertiary, `${C.tertiary}55`)}
                >
                  CBD {card.cbd_percentage}%
                </span>
                {card.irradiated !== null && card.irradiated !== undefined && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium"
                    style={chipStyle(C.bgDeep, C.textMuted, `${C.textMuted}22`)}
                    title={card.irradiated ? "Gamma-irradiated for sterilisation" : "Not irradiated"}
                  >
                    <span aria-hidden>{card.irradiated ? "\u{2622}\u{FE0F}" : "\u{1F33F}"}</span>
                    {card.irradiated ? "Irradiated" : "Non-irradiated"}
                  </span>
                )}
              </div>
            </header>

            {/* Rating + trend panel */}
            <section
              className="flex flex-1 flex-col rounded-2xl p-5"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>
                This batch
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold" style={{ color: currentAvg ? C.primary : C.textMuted }}>
                  {currentAvg ? currentAvg.toFixed(1) : "—"}
                </span>
                <span className="text-sm" style={{ color: C.textMuted }}>
                  / 5 · from {card.review_count.toLocaleString()} patient review{card.review_count === 1 ? "" : "s"}
                </span>
              </div>

              {(card.previous_batch_number || trend) && (
                <div className="mt-4 border-t pt-4" style={{ borderColor: `${C.textMuted}18` }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>
                    Trend vs previous batch
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {card.previous_batch_number && (
                      <span className="text-sm" style={{ color: C.textMuted }}>
                        <span className="font-mono text-white">{card.previous_batch_number}</span>
                        {card.previous_avg_rating != null && (
                          <>: <b className="text-white">{card.previous_avg_rating.toFixed(1)}</b>/5</>
                        )}
                        {typeof card.previous_review_count === "number" && card.previous_review_count > 0 && (
                          <span className="ml-1">({card.previous_review_count} review{card.previous_review_count === 1 ? "" : "s"})</span>
                        )}
                      </span>
                    )}
                    {trend && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: `${trend.color}18`,
                          color: trend.color,
                          border: `1px solid ${trend.color}55`,
                        }}
                      >
                        {trend.icon} {trend.label} ({trend.delta >= 0 ? "+" : ""}{trend.delta.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Reviews ─────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              Reviews of this batch{reviews.length > 0 && ` (${reviews.length})`}
            </h2>
            <Link
              href={user ? "/portal/review/new" : "/login"}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
              style={{ backgroundColor: C.primary, color: C.bgDeep }}
            >
              {user ? "Write a Review" : "Sign in to Review"}
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div
              className="flex items-center justify-center rounded-2xl p-8 text-center"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <p className="text-sm" style={{ color: C.textMuted }}>
                No reviews of this batch yet. Be the first!
              </p>
            </div>
          ) : (
            <div className="columns-1 gap-4 lg:columns-2">
              {reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  id={r.id}
                  username={r.username || "Anonymous"}
                  avatarUrl={r.avatar_url}
                  communityStatus={r.community_status}
                  strainName={r.strain_name || card.strain_name}
                  strainId={r.strain_id ?? card.strain_id ?? undefined}
                  batchNumber={r.batch_number || card.batch_number}
                  batchId={r.batch_id}
                  growerName={r.grower_name || card.grower_name}
                  growerId={r.grower_id ?? card.grower_id ?? undefined}
                  ratings={{
                    appearance: r.appearance_rating,
                    aroma: r.aroma_rating,
                    moisture: r.moisture_rating,
                    flavour: r.flavour_rating,
                    effect: r.effect_rating,
                  }}
                  narrative={r.written_narrative}
                  photos={[r.photo_product_url, r.photo_closeup_url, r.photo_packaging_url].filter((u): u is string => !!u)}
                  effects={r.effects || []}
                  flavours={r.flavours || []}
                  conditions={(r.condition_ratings || []).map((c) => c.condition_name)}
                  helpfulVotes={r.helpful_votes}
                  createdAt={r.created_at}
                  verified={r.is_verified ?? true}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Other batches of this strain ───────────────────────── */}
        {siblings.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">
              Other batches of {card.strain_name}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {siblings.map((sib) => {
                const sr = [
                  sib.avg_appearance_rating,
                  sib.avg_aroma_rating,
                  sib.avg_moisture_rating,
                  sib.avg_flavour_rating,
                  sib.avg_effect_rating,
                ].filter((v): v is number => typeof v === "number");
                const savg = sr.length === 5 ? sr.reduce((a, b) => a + b, 0) / 5 : 0;
                return (
                  <BatchMiniCard
                    key={sib.id}
                    id={sib.id}
                    batchNumber={sib.batch_number}
                    growerName={sib.grower_name}
                    growerId={sib.grower_id ?? undefined}
                    avgRating={savg}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ── Prescription CTA ───────────────────────────────────── */}
        <section className="mb-8">
          <div
            className="flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{
              backgroundColor: `${C.secondary}12`,
              border: `1px solid ${C.secondary}44`,
            }}
          >
            <div>
              <h3 className="text-base font-bold text-white">Need a prescription?</h3>
              <p className="mt-0.5 text-sm" style={{ color: C.textMuted }}>
                See the UK clinics that can assess and prescribe medical cannabis.
              </p>
            </div>
            <Link
              href="/clinics"
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition hover:brightness-110"
              style={{ backgroundColor: C.secondary, color: C.bgDeep }}
            >
              Browse clinics
              <span aria-hidden>{"→"}</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
