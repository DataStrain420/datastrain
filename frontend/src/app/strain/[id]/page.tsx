"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import StrainCard, { CardData } from "@/components/StrainCard";
import ReviewCard from "@/components/ReviewCard";
import BatchMiniCard from "@/components/BatchMiniCard";
import StrainShareRow from "@/components/StrainShareRow";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { terpeneSummary } from "@/lib/terpenes";

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
  grower_country?: string | null;
  grower_verified?: boolean | null;
  created_at?: string;
}

/** UK 2-letter country codes for the flag emoji trick — accepts common
 *  full names our seed data uses and returns the emoji. */
function countryFlag(country: string | null | undefined): string {
  if (!country) return "";
  const map: Record<string, string> = {
    "United Kingdom": "\u{1F1EC}\u{1F1E7}",
    Canada: "\u{1F1E8}\u{1F1E6}",
    Netherlands: "\u{1F1F3}\u{1F1F1}",
    Germany: "\u{1F1E9}\u{1F1EA}",
    Australia: "\u{1F1E6}\u{1F1FA}",
    Israel: "\u{1F1EE}\u{1F1F1}",
    Portugal: "\u{1F1F5}\u{1F1F9}",
    Uruguay: "\u{1F1FA}\u{1F1FE}",
    Colombia: "\u{1F1E8}\u{1F1F4}",
    Spain: "\u{1F1EA}\u{1F1F8}",
    Denmark: "\u{1F1E9}\u{1F1F0}",
  };
  return map[country] ?? "";
}

/** Compute the pharmacological chemotype from THC:CBD ratio.
 *  Type I ≈ THC-dominant, II ≈ balanced, III ≈ CBD-dominant.
 *  Returns null when both values are missing so the chip stays hidden. */
function chemotype(thc: number | null | undefined, cbd: number | null | undefined): { label: string; hint: string } | null {
  if (thc == null || cbd == null) return null;
  if (thc <= 0 && cbd <= 0) return null;
  const ratio = cbd === 0 ? Infinity : thc / cbd;
  if (ratio >= 3) return { label: "Type I", hint: "THC-dominant (Type I chemotype)" };
  if (ratio <= 1 / 3) return { label: "Type III", hint: "CBD-dominant (Type III chemotype)" };
  return { label: "Type II", hint: "Mixed THC/CBD (Type II chemotype)" };
}

function formatFirstListed(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
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

interface StrainPharmacy {
  id: number;
  name: string;
  location: string;
  website: string | null;
  logo_url: string | null;
  verified: boolean;
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
  const [pharmacies, setPharmacies] = useState<StrainPharmacy[]>([]);
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
        const [similar, batchReviews, strainPharmacies] = await Promise.all([
          apiFetch<SimilarStrain[]>(`/strains/${id}/similar?limit=12`).catch(() => []),
          batches.length > 0
            ? Promise.all(
                batches.slice(0, 5).map((b) =>
                  apiFetch<ReviewData[]>(`/reviews/?batch_id=${b.id}&limit=10`).catch(() => []),
                ),
              )
            : Promise.resolve([] as ReviewData[][]),
          apiFetch<StrainPharmacy[]>(`/strains/${id}/pharmacies`).catch(() => []),
        ]);
        setSimilarStrains(similar);
        setReviews(batchReviews.flat());
        setPharmacies(strainPharmacies);

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
        {/* ── Hero: strain card (left) + name/grower/chips/share (right) on
              desktop. Mobile stacks with the card on top so the visual
              anchor still leads. */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="mx-auto w-full shrink-0 lg:mx-0" style={{ maxWidth: LEFT_COLUMN_MAX }}>
            {card ? (
              <StrainCard card={stats ? { ...card, rank: stats.overall_rank } : card} />
            ) : (
              <div
                className="flex h-[468px] w-full items-center justify-center rounded-2xl"
                style={{ backgroundColor: C.bgCard }}
              >
                <p style={{ color: C.textMuted }}>No batch data yet</p>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
          <header
            className="flex flex-wrap items-start justify-between gap-4 rounded-2xl px-6 py-5"
            style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
          >
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

            {/* Provenance + chemotype + first-listed chips.
                MedBud pattern — surface the "who / where / when / what
                type of medication" facts right at the top of the page
                instead of burying them in a sidebar. */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {strain.grower_country && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium"
                  style={{ backgroundColor: C.bgDeep, color: C.textMuted, border: `1px solid ${C.textMuted}22` }}
                  title={`Produced in ${strain.grower_country}`}
                >
                  <span aria-hidden>{countryFlag(strain.grower_country)}</span>
                  Produced in {strain.grower_country}
                </span>
              )}
              {strain.grower_verified && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
                  style={{ backgroundColor: `${C.primary}18`, color: C.primary, border: `1px solid ${C.primary}55` }}
                  title="Verified grower"
                >
                  {"\u{2705}"} Verified grower
                </span>
              )}
              {(() => {
                const ct = chemotype(stats?.avg_thc, stats?.avg_cbd);
                if (!ct) return null;
                return (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
                    style={{ backgroundColor: `${C.secondary}18`, color: C.secondary, border: `1px solid ${C.secondary}55` }}
                    title={ct.hint}
                  >
                    {"\u{1F9EA}"} {ct.label}
                  </span>
                );
              })()}
              {strain.created_at && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                  style={{ backgroundColor: C.bgDeep, color: C.textMuted, border: `1px solid ${C.textMuted}22` }}
                  title={`First listed on DataStrain ${new Date(strain.created_at).toLocaleDateString("en-GB")}`}
                >
                  {"\u{1F5D3}\u{FE0F}"} Listed {formatFirstListed(strain.created_at)}
                </span>
              )}
            </div>

            {/* Share row — one-tap out to common places patients share links.
                Kept as icon-only pill row so it doesn't dominate the header. */}
            <StrainShareRow name={strain.name} />
          </div>
            {stats && (
              <PageRankHex rank={stats.overall_rank} totalStrains={stats.total_strains} />
            )}
          </header>

            {/* Info blocks that sit next to the card on desktop —
                aggregated stats, terpenes, genetics and description all
                live here so the reader can absorb the strain's identity in
                one glance before dropping into the batches / pharmacies /
                reviews content further down the page. */}

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

            {/* Terpenes — hover a name to see what it does / how it smells */}
            {stats && stats.top_terpenes.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-3 rounded-xl p-4"
                style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
              >
                <span className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#3b82f6" }}>
                  Terpenes
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {stats.top_terpenes.map((name) => (
                    <span
                      key={name}
                      title={terpeneSummary(name)}
                      className="cursor-help text-sm text-white underline decoration-dotted decoration-1 underline-offset-2"
                    >
                      {name}
                    </span>
                  ))}
                </div>
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
          </div>
        </div>

        {/* ── Most Recent Batches — full-width horizontal row so the
              batches read as a sequence rather than a stack. */}
        {batchCards.length > 0 && (
          <section className="mb-8">
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
          </section>
        )}

        {/* ── Where to get it — pharmacies that dispense this strain */}
        {pharmacies.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">
              Where to Get It
            </h2>
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
            >
              <p className="mb-3 text-xs" style={{ color: C.textMuted }}>
                UK pharmacies currently dispensing batches of {strain.name}.
              </p>
              <div className="flex flex-wrap gap-2">
                {pharmacies.map((p) => (
                  <Link
                    key={p.id}
                    href={`/pharmacy/${p.id}`}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:brightness-125"
                    style={{
                      backgroundColor: `${C.primary}15`,
                      color: C.primary,
                      border: `1px solid ${C.primary}44`,
                    }}
                  >
                    <span>{"\u{1F3E5}"}</span>
                    <span>{p.name}</span>
                    {p.verified && <span title="Verified pharmacy">{"\u{2705}"}</span>}
                    <span aria-hidden style={{ opacity: 0.6 }}>{"→"}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Reviews — full width; the cards themselves flow into two
              columns on desktop so the section fills the viewport width. */}
        <section ref={reviewsTopRef} id="reviews" className="mb-8">
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        </section>

        {/* ── Prescription CTA — links out to /clinics regardless of
              whether pharmacies were found, since patients need a
              prescription before any pharmacy will dispense. */}
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

        {/* ── Community contributions — always visible so patients know
              they can help correct the record. MedBud pattern. Simple
              mailto/prefilled review flow for now — a proper submission
              form is a later iteration. */}
        <section className="mt-12 mb-4">
          <div
            className="grid gap-3 rounded-2xl p-5 sm:grid-cols-2"
            style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
          >
            <a
              href={`mailto:corrections@datastrain.co.uk?subject=${encodeURIComponent(`Correction for ${strain.name}`)}&body=${encodeURIComponent(`Strain: ${strain.name}\nURL: ${typeof window !== "undefined" ? window.location.href : ""}\n\nWhat's wrong:\n\n\nSuggested correction:\n`)}`}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:brightness-125"
              style={{ backgroundColor: C.bgDeep, color: C.textMuted, border: `1px solid ${C.textMuted}22` }}
            >
              <span className="text-lg" aria-hidden>{"\u{270F}\u{FE0F}"}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-white">Submit a correction</span>
                <span className="text-xs" style={{ color: C.textMuted }}>
                  Spot something wrong on this page? Tell us.
                </span>
              </div>
            </a>
            <Link
              href={user ? "/portal/review/new" : "/register?redirect=/portal/review/new"}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:brightness-125"
              style={{ backgroundColor: `${C.primary}18`, color: C.primary, border: `1px solid ${C.primary}55` }}
            >
              <span className="text-lg" aria-hidden>{"\u{1F4F8}"}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-white">Submit a photo review</span>
                <span className="text-xs" style={{ color: C.textMuted }}>
                  Add your own batch photos + rating.
                </span>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
