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

interface BatchInfo {
  id: number;
  batch_number: string;
  grower_name: string;
  grower_id: number;
  thc_percentage: number;
  cbd_percentage: number;
  avg_rating: number;
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

import StrainTypeIcon, { typeColor, typeLabel as getTypeLabel } from "@/components/StrainTypeIcon";

/* ── Stat row helper ───────────────────────────────────────────────────────── */

function StatRow({ label, color, entries }: { label: string; color: string; entries: StatEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <span
        className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
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

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function StrainDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [strain, setStrain] = useState<Strain | null>(null);
  const [stats, setStats] = useState<StrainStats | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [batchCards, setBatchCards] = useState<CardData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [similarStrains, setSimilarStrains] = useState<SimilarStrain[]>([]);
  const [similarCards, setSimilarCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const similarScrollRef = useRef<HTMLDivElement>(null);

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

        // Hero is ready — drop the loading screen.
        setLoading(false);

        // Phase 2 — similar strains + reviews load in the background so the
        // page is interactive immediately. Both phases use Promise.all so
        // the previous sequential awaits don't compound.
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

        // Similar-strain card data — parallel per strain instead of an
        // await-in-a-loop that compounded latency (12 strains × 2 sequential
        // requests each was the page's worst offender).
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
        // Safety net — if Phase 1 threw before flipping loading off, do it now.
        setLoading(false);
      }
    }
    load();
  }, [id]);

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

  const tColor = typeColor(strain.strain_type);
  const tLabel = getTypeLabel(strain.strain_type);

  function scrollBatches(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
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
      // ease-in-out cubic
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      el!.scrollLeft = start + distance * ease;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ── Strain header — name + rank + aliases + grower + pills ──── */}
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
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
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold" style={{ color: C.textMuted }}>Rank</span>
                <div className="relative h-12 w-12">
                  <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
                    <path
                      d="M219.9,66.7l-84,-47.4c-4.888,-2.799-10.912,-2.799-15.8,0l-84,47.4c-4.997,2.885-8.089,8.23-8.1,14l0,94.6c0.011,5.77,3.103,11.115,8.1,14l84,47.4c4.888,2.799,10.912,2.799,15.8,0l84,-47.4c4.997,-2.885,8.089,-8.23,8.1,-14l0,-94.6c-0.011,-5.77-3.103,-11.115-8.1,-14Z"
                      fill={C.secondary}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-black" style={{ color: C.bgDeep }}>
                    {stats.overall_rank}
                  </span>
                </div>
                <span className="text-xs" style={{ color: C.textMuted }}>
                  of {stats.total_strains}
                </span>
              </div>
            )}
          </div>

          {/* Type + THC + CBD + favourite */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-4 py-1 text-sm font-semibold"
              style={{ borderColor: `${C.textMuted}33`, color: "white" }}
            >
              <StrainTypeIcon type={strain.strain_type} size={14} className="inline-block" /> {tLabel}
            </span>
            {stats && (
              <>
                <span
                  className="rounded-full border px-4 py-1 text-sm font-semibold"
                  style={{ borderColor: `${C.textMuted}33`, color: "white" }}
                >
                  THC <span style={{ color: C.primary }}>{stats.avg_thc}%</span>
                </span>
                <span
                  className="rounded-full border px-4 py-1 text-sm font-semibold"
                  style={{ borderColor: `${C.textMuted}33`, color: "white" }}
                >
                  CBD <span style={{ color: C.primary }}>{stats.avg_cbd}%</span>
                </span>
              </>
            )}
            <button
              className="ml-auto flex items-center gap-2 text-sm transition hover:text-white"
              style={{ color: C.textMuted }}
            >
              <span className="text-lg">{"♡"}</span> Favourite
            </button>
          </div>
        </header>

        {/* ── Hero: Card left, latest reviews right ───────────────────── */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Left — Strain card. Rank kept consistent with the header hex. */}
          <div className="mx-auto w-fit">
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

          {/* Right — Latest reviews. Caps at the card height with internal
              scroll so the hero stays neat when there's a lot of feedback. */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Latest Reviews{reviews.length > 0 && ` (${reviews.length})`}
              </h2>
              <Link
                href={user ? "/portal/review/new" : "/login"}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
                style={{ backgroundColor: C.primary, color: C.bgDeep }}
              >
                {user ? "Write a Review" : "Sign in to Review"}
              </Link>
            </div>
            {reviews.length === 0 ? (
              <div
                className="flex flex-1 items-center justify-center rounded-2xl p-8 text-center"
                style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
              >
                <p className="text-sm" style={{ color: C.textMuted }}>
                  No reviews yet. Be the first!
                </p>
              </div>
            ) : (
              <div
                className="flex flex-col gap-4 overflow-y-auto pr-1"
                style={{ maxHeight: 540 }}
              >
                {reviews.map((r) => (
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
            )}
          </div>
        </div>

        {/* ── What people are saying (full width, below hero) ──────────── */}
        {stats && stats.review_count > 0 && (
          <div
            className="mb-6 space-y-3 rounded-2xl p-5"
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

        {/* Terpenes + Genetics — full-width pill rows. */}
        {((stats && stats.top_terpenes.length > 0) || strain.genetics) && (
          <div className="mb-8 flex flex-col gap-3">
            {stats && stats.top_terpenes.length > 0 && (
              <div
                className="flex items-center gap-3 rounded-xl p-4"
                style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
              >
                <span className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#3b82f6" }}>
                  Terpenes
                </span>
                <span className="text-sm text-white">{stats.top_terpenes.join("   ")}</span>
              </div>
            )}
            {strain.genetics && (
              <div
                className="flex items-center gap-3 rounded-xl p-4"
                style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
              >
                <span className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#6b7280" }}>
                  Genetics
                </span>
                <span className="text-sm text-white">{strain.genetics}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Description ──────────────────────────────────────────────── */}
        {strain.description && (
          <div
            className="mb-8 rounded-2xl p-6"
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

        {/* ── Most Recent Batches (horizontal scroll) ──────────────────── */}
        {batchCards.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-bold text-white">
              Most Recent Batches of {strain.name}
            </h2>
            <div className="relative">
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
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
              {/* Scroll arrow */}
              {batchCards.length > 4 && (
                <button
                  onClick={() => scrollBatches("right")}
                  className="absolute -right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-80"
                  style={{ backgroundColor: C.primary }}
                >
                  <svg className="h-5 w-5" fill="none" stroke={C.bgDeep} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link
                href={`/strains`}
                className="inline-block rounded-full border-2 px-8 py-2.5 text-sm font-semibold transition hover:opacity-90"
                style={{ borderColor: C.primary, color: C.primary }}
              >
                See Full Rankings
              </Link>
            </div>
          </section>
        )}

        {/* ── Similar Strains ──────────────────────────────────────────── */}
        {similarCards.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-bold text-white">
              Similar Strains
            </h2>
            <div className="relative">
              {/* Left arrow */}
              <button
                onClick={() => scrollSimilar("left")}
                className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-80"
                style={{ backgroundColor: C.primary }}
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

              {/* Right arrow */}
              <button
                onClick={() => scrollSimilar("right")}
                className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-80"
                style={{ backgroundColor: C.primary }}
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
