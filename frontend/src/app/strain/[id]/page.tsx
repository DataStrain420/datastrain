"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import StrainCard, { CardData } from "@/components/StrainCard";
import ReviewCard from "@/components/ReviewCard";
import BatchMiniCard from "@/components/BatchMiniCard";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const C = brand;
const REVIEWS_PER_PAGE = 10;
const LEFT_COLUMN_MAX = 360; // matches the strain card's natural width, so
                              // the supporting boxes below it align to its edges

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Strain {
  id: number;
  name: string;
  aliases: string | null;
  genetics: string | null;
  strain_type: string;
  description: string | null;
  grower_id: number | null;
  grower_name: string | null;
}

interface StatEntry { name: string; percentage: number }

interface StrainStats {
  strain_id: number;
  total_strains: number;
  overall_rank: number;
  avg_thc: number;
  avg_cbd: number;
  review_count: number;
  top_conditions: StatEntry[];
  top_effects: StatEntry[];
  top_flavours: StatEntry[];
  top_terpenes: string[];
}

interface SimilarStrain {
  id: number;
  name?: string;
  strain_type?: string;
  grower_name?: string | null;
}

interface ReviewData {
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
  created_at: string;
}

import StrainTypeIcon from "@/components/StrainTypeIcon";

/* ── Stat row helper ───────────────────────────────────────────────────────── */

function StatRow({ label, color, entries }: { label: string; color: string; entries: StatEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map((e) => (
          <span key={e.name} className="text-sm text-white">
            <span style={{ color: C.primary }} className="font-semibold">{e.percentage}%</span>{" "}
            {e.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Rank hex matching the StrainCard's RankHex visual ─────────────────────── */

const HEX_PATH =
  "M219.9,66.7l-84,-47.4c-4.888,-2.799-10.912,-2.799-15.8,0l-84,47.4c-4.997,2.885-8.089,8.23-8.1,14l0,94.6c0.011,5.77,3.103,11.115,8.1,14l84,47.4c4.888,2.799,10.912,2.799,15.8,0l84,-47.4c4.997,-2.885,8.089,-8.23,8.1,-14l0,-94.6c-0.011,-5.77-3.103,-11.115-8.1,-14Z";

function PageRankHex({ rank, totalStrains }: { rank: number; totalStrains: number }) {
  // Mirror StrainCard's tier logic so the header hex visually matches the
  // rank hex inside the card (gold for #1, silver for 2–10, cyan otherwise).
  const isGold = rank === 1;
  const isSilver = rank >= 2 && rank <= 10;
  const isHolo = isGold || isSilver;
  const fill = isGold ? "url(#page-hex-gold)" : isSilver ? "url(#page-hex-silver)" : C.secondary;
  const textColor = isGold ? "#2a1f00" : isSilver ? "#1a1d20" : C.bgDeep;
  const stroke = isGold ? "#6b4a0e" : isSilver ? "#3a3f46" : "none";
  const labelColor = isHolo ? "rgba(0,0,0,0.75)" : C.textMuted;

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex items-center gap-1.5">
        <span
          className="text-right text-xs leading-tight font-extrabold"
          style={{ color: labelColor }}
        >
          Rank
        </span>
        <div className="relative h-14 w-14">
          <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
            <defs>
              {isGold && (
                <linearGradient id="page-hex-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#d4a942" />
                  <stop offset="40%" stopColor="#f5d76e" />
                  <stop offset="60%" stopColor="#f5d76e" />
                  <stop offset="100%" stopColor="#c9953c" />
                </linearGradient>
              )}
              {isSilver && (
                <linearGradient id="page-hex-silver" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8a9199" />
                  <stop offset="35%" stopColor="#c0c8d0" />
                  <stop offset="55%" stopColor="#d8dee4" />
                  <stop offset="100%" stopColor="#8a9199" />
                </linearGradient>
              )}
            </defs>
            <path
              d={HEX_PATH}
              fill={fill}
              stroke={stroke}
              strokeWidth={isHolo ? 9 : 0}
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-lg font-black"
            style={{ color: textColor }}
          >
            {rank}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-semibold" style={{ color: labelColor }}>
        of {totalStrains.toLocaleString()}
      </span>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function StrainDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [strain, setStrain] = useState<Strain | null>(null);
  const [stats, setStats] = useState<StrainStats | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [batchCards, setBatchCards] = useState<CardData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [similarStrains, setSimilarStrains] = useState<SimilarStrain[]>([]);
  const [similarCards, setSimilarCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const similarScrollRef = useRef<HTMLDivElement>(null);
  const reviewsTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        // Phase 1 — block the loading screen on the minimum needed to render
        // the hero card. Strain + stats + the batch list go in parallel; the
        // per-batch cards then fetch in parallel too instead of sequentially.
        const [s, st, batches] = await Promise.all([
          apiFetch<Strain>(`/strains/${id}`),
          apiFetch<StrainStats>(`/strains/${id}/stats`),
          apiFetch<{ id: number }[]>(`/batches/?strain_id=${id}&approved=true`),
        ]);
        setStrain(s);
        setStats(st);

        const cardResults = await Promise.all(
          batches.map((b) =>
            apiFetch<CardData>(`/batches/${b.id}/card`).catch(() => null),
          ),
        );
        const filteredCards = cardResults.filter((c): c is CardData => c !== null);
        setBatchCards(filteredCards);
        if (filteredCards.length > 0) setCard(filteredCards[0]);

        setLoading(false);

        // Phase 2 — similar strains + reviews load in the background.
        const [similar, batchReviews] = await Promise.all([
          apiFetch<SimilarStrain[]>(`/strains/${id}/similar?limit=12`).catch(() => []),
          batches.length > 0
            ? Promise.all(
                batches.slice(0, 5).map((b) =>
                  apiFetch<ReviewData[]>(`/reviews/?batch_id=${b.id}&limit=10`).catch(() => []),
                ),
              )
            : Promise.resolve([] as ReviewData[][]),
        ]);
        setSimilarStrains(similar);
        setReviews(batchReviews.flat());

        const simCardResults = await Promise.all(
          similar.map(async (sim) => {
            const simBatches = await apiFetch<{ id: number }[]>(
              `/batches/?strain_id=${sim.id}&approved=true&limit=1`,
            ).catch(() => []);
            if (simBatches.length === 0) return null;
            return apiFetch<CardData>(`/batches/${simBatches[0].id}/card`).catch(() => null);
          }),
        );
        setSimilarCards(simCardResults.filter((c): c is CardData => c !== null));
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Reset to page 1 whenever the underlying reviews list changes (eg. on a
  // route change between strains while the component is still mounted).
  useEffect(() => {
    setReviewPage(1);
  }, [reviews.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: C.textMuted }}>Loading...</p>
      </div>
    );
  }

  if (!strain) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: C.textMuted }}>Strain not found.</p>
      </div>
    );
  }

  function scrollBatches(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 200 : -200, behavior: "smooth" });
  }

  function scrollSimilar(dir: "left" | "right") {
    const el = similarScrollRef.current;
    if (!el) return;
    const distance = dir === "right" ? 296 : -296;
    const duration = 400;
    const start = el.scrollLeft;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      el!.scrollLeft = start + distance * ease;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
  const pageStart = (reviewPage - 1) * REVIEWS_PER_PAGE;
  const pageReviews = reviews.slice(pageStart, pageStart + REVIEWS_PER_PAGE);

  function gotoPage(p: number) {
    setReviewPage(Math.max(1, Math.min(totalReviewPages, p)));
    reviewsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ── Strain header — name + aliases + grower + rank hex ───────── */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold text-white">{strain.name}</h1>
            {strain.aliases && (
              <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
                Also known as: {strain.aliases}
              </p>
            )}
            {strain.grower_name && strain.grower_id && (
              <Link
                href={`/grower/${strain.grower_id}`}
                className="mt-1 inline-block text-sm font-medium transition hover:underline"
                style={{ color: C.primary }}
              >
                By {strain.grower_name}
              </Link>
            )}
          </div>
          {stats && (
            <PageRankHex rank={stats.overall_rank} totalStrains={stats.total_strains} />
          )}
        </header>

        {/* ── Hero: narrower LEFT column with stacked supporting blocks;
              RIGHT column is a tall reviews list that paginates after 10. */}
        <div className="mb-8 grid items-start gap-8 lg:grid-cols-2">
          {/* LEFT — card + stats + terpenes/genetics + bio + batches, all
              capped at the card's own width so the column reads as a tidy
              vertical "card sheet" rather than spreading across the page. */}
          <div className="mx-auto w-full" style={{ maxWidth: LEFT_COLUMN_MAX }}>
            <div className="space-y-6">
              {/* Strain card (rank synced with header hex) */}
              <div>
                {card ? (
                  <StrainCard card={stats ? { ...card, rank: stats.overall_rank } : card} />
                ) : (
                  <div
                    className="flex h-[540px] items-center justify-center rounded-2xl"
                    style={{ backgroundColor: C.bgCard }}
                  >
                    <p style={{ color: C.textMuted }}>No batch data yet</p>
                  </div>
                )}
              </div>

              {/* What people are saying */}
              {stats && stats.review_count > 0 && (
                <div
                  className="space-y-3 rounded-2xl p-5"
                  style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
                >
                  <p className="text-sm" style={{ color: C.textMuted }}>
                    What people are saying...
                  </p>
                  <StatRow label="Helps With" color={C.success} entries={stats.top_conditions} />
                  <StatRow label="Effects" color={C.secondary} entries={stats.top_effects} />
                  <StatRow label="Flavours" color={C.tertiary} entries={stats.top_flavours} />
                </div>
              )}

              {/* Terpenes */}
              {stats && stats.top_terpenes.length > 0 && (
                <div
                  className="flex flex-wrap items-center gap-3 rounded-xl p-4"
                  style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
                >
                  <span className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#3b82f6" }}>
                    Terpenes
                  </span>
                  <span className="text-sm text-white">{stats.top_terpenes.join("   ")}</span>
                </div>
              )}

              {/* Genetics */}
              {strain.genetics && (
                <div
                  className="flex flex-wrap items-center gap-3 rounded-xl p-4"
                  style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
                >
                  <span className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#6b7280" }}>
                    Genetics
                  </span>
                  <span className="text-sm text-white">{strain.genetics}</span>
                </div>
              )}

              {/* Description */}
              {strain.description && (
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: C.bgCard, borderTop: `3px solid ${C.secondary}44` }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                    {strain.description}
                  </p>
                  <button
                    className="mt-3 flex items-center gap-1.5 text-xs transition hover:text-white"
                    style={{ color: C.textMuted }}
                  >
                    <span>{"✎"}</span> Suggest a page edit
                  </button>
                </div>
              )}

              {/* Most Recent Batches */}
              {batchCards.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">
                    Most Recent Batches
                  </h2>
                  <div className="relative">
                    <div
                      ref={scrollRef}
                      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {batchCards.map((bc) => (
                        <BatchMiniCard
                          key={bc.id}
                          id={bc.id}
                          batchNumber={bc.batch_number}
                          growerName={bc.grower_name}
                          growerId={bc.grower_id ?? undefined}
                          avgRating={
                            bc.avg_appearance_rating && bc.avg_aroma_rating && bc.avg_moisture_rating && bc.avg_flavour_rating && bc.avg_effect_rating
                              ? (bc.avg_appearance_rating + bc.avg_aroma_rating + bc.avg_moisture_rating + bc.avg_flavour_rating + bc.avg_effect_rating) / 5
                              : 0
                          }
                        />
                      ))}
                    </div>
                    {batchCards.length > 2 && (
                      <button
                        onClick={() => scrollBatches("right")}
                        className="absolute -right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-80"
                        style={{ backgroundColor: C.primary }}
                        aria-label="Scroll batches right"
                      >
                        <svg className="h-4 w-4" fill="none" stroke={C.bgDeep} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — reviews list with simple pagination at the bottom. The
              column has no fixed height; the page itself scrolls. */}
          <div ref={reviewsTopRef}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">
                Reviews{reviews.length > 0 && ` (${reviews.length})`}
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
                  No reviews yet. Be the first!
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {pageReviews.map((r) => (
                    <ReviewCard
                      key={r.id}
                      id={r.id}
                      username={r.username || "Anonymous"}
                      avatarUrl={r.avatar_url}
                      communityStatus={r.community_status}
                      strainName={r.strain_name || strain.name}
                      strainId={strain.id}
                      batchNumber={r.batch_number || ""}
                      batchId={r.batch_id}
                      growerName={r.grower_name || strain.grower_name || ""}
                      growerId={r.grower_id ?? strain.grower_id ?? undefined}
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
                    />
                  ))}
                </div>

                {totalReviewPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => gotoPage(reviewPage - 1)}
                      disabled={reviewPage === 1}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-90 disabled:opacity-40"
                      style={{
                        backgroundColor: C.bgCard,
                        border: `1px solid ${C.textMuted}33`,
                        color: C.textMuted,
                      }}
                    >
                      ‹ Prev
                    </button>
                    <span className="text-xs font-medium" style={{ color: C.textMuted }}>
                      Page {reviewPage} of {totalReviewPages}
                    </span>
                    <button
                      onClick={() => gotoPage(reviewPage + 1)}
                      disabled={reviewPage === totalReviewPages}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-90 disabled:opacity-40"
                      style={{
                        backgroundColor: C.bgCard,
                        border: `1px solid ${C.textMuted}33`,
                        color: C.textMuted,
                      }}
                    >
                      Next ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Similar Strains (full width, unchanged) ──────────────────── */}
        {similarCards.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-bold text-white">
              Similar Strains
            </h2>
            <div className="relative">
              <button
                onClick={() => scrollSimilar("left")}
                className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-80"
                style={{ backgroundColor: C.primary }}
                aria-label="Scroll similar strains left"
              >
                <svg className="h-5 w-5" fill="none" stroke={C.bgDeep} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div
                ref={similarScrollRef}
                className="flex gap-4 overflow-x-auto px-6 pb-2"
                style={{ scrollbarWidth: "none" }}
              >
                {similarCards.map((c) => (
                  <div key={c.id} className="flex-shrink-0">
                    <StrainCard card={c} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollSimilar("right")}
                className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-80"
                style={{ backgroundColor: C.primary }}
                aria-label="Scroll similar strains right"
              >
                <svg className="h-5 w-5" fill="none" stroke={C.bgDeep} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
