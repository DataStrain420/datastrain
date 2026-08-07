"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import StrainCard, { CardData } from "@/components/StrainCard";
import StrainCardSkeleton from "@/components/StrainCardSkeleton";
import CoverFlowCarousel from "@/components/CoverFlowCarousel";
import GrowerCard from "@/components/GrowerCard";
import DiscoveryGrid from "@/components/DiscoveryGrid";
import LatestListings from "@/components/LatestListings";
import ReviewCard from "@/components/ReviewCard";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import HeroBackground from "@/components/HeroBackground";
import StrainTypeIcon from "@/components/StrainTypeIcon";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RankedGrower {
  id: number;
  name: string;
  logo_url: string | null;
  verified: boolean;
  rank: number;
  avg_rating: number;
  review_count: number;
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
  is_verified?: boolean;
  created_at: string;
}

/* ── Static data ───────────────────────────────────────────────────────────── */

const filterPills: { label: string; color: string; href: string; type?: string; emoji?: string }[] = [
  { label: "Browse All", color: brand.secondary, href: "/strains" },
  { label: "Sativa", color: "#f59e0b", href: "/strains?type=sativa", type: "sativa" },
  { label: "Indica", color: brand.tertiary, href: "/strains?type=indica", type: "indica" },
  { label: "Hybrid", color: "#ec4899", href: "/strains?type=hybrid", type: "hybrid" },
];

const browseTypes = [
  { label: "Indica", value: "indica", color: brand.tertiary, href: "/strains?type=indica" },
  { label: "Sativa", value: "sativa", color: "#f59e0b", href: "/strains?type=sativa" },
  { label: "Hybrid", value: "hybrid", color: "#ec4899", href: "/strains?type=hybrid" },
];

const browseConditions = [
  { label: "Insomnia", icon: "\u{1F634}" },
  { label: "Anxiety", icon: "\u{1F630}" },
  { label: "Chronic Pain", icon: "\u{1FA79}" },
  { label: "Depression", icon: "\u{1F614}" },
  { label: "PTSD", icon: "\u{1F9E0}" },
  { label: "Migraines", icon: "\u{1F915}" },
  { label: "Nausea", icon: "\u{1F922}" },
  { label: "Appetite Loss", icon: "\u{1F37D}\u{FE0F}" },
  { label: "Muscle Spasms", icon: "\u{1F4AA}" },
  { label: "ADHD", icon: "\u{26A1}" },
];

const browseEffects = [
  { label: "Relaxed", icon: "\u{1F60C}" },
  { label: "Euphoric", icon: "\u{1F929}" },
  { label: "Creative", icon: "\u{1F3A8}" },
  { label: "Sleepy", icon: "\u{1F4A4}" },
  { label: "Uplifted", icon: "\u{1F64C}" },
  { label: "Focused", icon: "\u{1F3AF}" },
  { label: "Happy", icon: "\u{1F60A}" },
  { label: "Hungry", icon: "\u{1F354}" },
  { label: "Energetic", icon: "\u{26A1}" },
  { label: "Calm", icon: "\u{1F9D8}" },
];

/* ── Stat rounding helper ─────────────────────────────────────────────────── */

// Rounds a raw count down to a "friendly" figure with a trailing "+" so the
// trust strip reads like curated marketing copy instead of a live counter.
// Small numbers stay exact so a new site with 4 strains doesn't awkwardly
// display "0+".
function roundStat(n: number): string {
  if (n < 10) return String(n);
  if (n < 100) return `${Math.floor(n / 10) * 10}+`;
  if (n < 1000) return `${Math.floor(n / 100) * 100}+`;
  if (n < 10000) return `${(Math.floor(n / 500) * 500).toLocaleString()}+`;
  return `${(Math.floor(n / 1000) * 1000).toLocaleString()}+`;
}

/* ── Section heading helper ────────────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mx-auto mb-6 h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${brand.textMuted}33, transparent)` }} />
      <h2 className="text-center text-2xl font-bold text-white">
        {children}
      </h2>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function Home() {
  const [growers, setGrowers] = useState<RankedGrower[]>([]);
  const [topBatches, setTopBatches] = useState<CardData[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [monthBatches, setMonthBatches] = useState<CardData[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewData[]>([]);
  const [latestReviews, setLatestReviews] = useState<ReviewData[]>([]);
  const [publicStats, setPublicStats] = useState<{ total_strains: number; total_reviews: number } | null>(null);
  useEffect(() => {
    apiFetch<{ total_strains: number; total_reviews: number }>("/stats/public")
      .then(setPublicStats)
      .catch((err) => console.error("Public stats:", err));

    // Top rated growers
    apiFetch<RankedGrower[]>("/growers/top-rated?limit=12")
      .then(setGrowers)
      .catch((err) => console.error("Growers:", err));

    // Top rated batches (all-time)
    apiFetch<CardData[]>("/batches/top-rated?limit=8")
      .then(setTopBatches)
      .catch((err) => console.error("Top batches:", err))
      .finally(() => setTopLoading(false));

    // Top rated batches (last 30 days) — surfaces batches with fresh
    // momentum instead of long-standing favourites.
    apiFetch<CardData[]>("/batches/top-rated?limit=8&days=30")
      .then(setMonthBatches)
      .catch((err) => console.error("Monthly batches:", err));

    // Recent reviews (first 3)
    apiFetch<ReviewData[]>("/reviews/?limit=3")
      .then(setRecentReviews)
      .catch((err) => console.error("Recent reviews:", err));

    // Latest reviews (next 6, offset by 3)
    apiFetch<ReviewData[]>("/reviews/?limit=6&skip=3")
      .then(setLatestReviews)
      .catch((err) => console.error("Latest reviews:", err));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      {/* ── 1. Hero + Search ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-16 text-center">
        <HeroBackground />
        <div className="relative z-10">
          <h1 className="mx-auto max-w-none text-4xl font-extrabold leading-tight text-white md:max-w-[60vw] md:text-5xl">
            The trusted voice of quality in the UK medical cannabis market.
          </h1>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar size="lg" />
          </div>

          <div className="mx-auto mt-6">
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-4 md:max-w-none md:flex-nowrap md:gap-3">
            {filterPills.map((pill) => (
              <Link
                key={pill.label}
                href={pill.href}
                className="flex items-center gap-2.5 whitespace-nowrap rounded-full border px-6 py-2.5 text-base font-semibold transition hover:brightness-110 hover:text-white md:px-4 md:py-2 md:text-sm"
                style={{
                  borderColor: `${pill.color}66`,
                  backgroundColor: `${pill.color}18`,
                  color: "white",
                }}
              >
                {pill.type ? (
                  <StrainTypeIcon type={pill.type} size={16} />
                ) : pill.emoji ? (
                  <span className="text-base leading-none" aria-hidden>{pill.emoji}</span>
                ) : (
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pill.color }} />
                )}
                {pill.label}
              </Link>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 1b. Trust indicator strip ──────────────────────────────────── */}
      {/* Four short "why trust this" badges below the hero. MedBud does
          a longer version of this pattern; we lean on our differentiators
          (batch-linked, verified reviewers, UK medical only, photo-required).
          Kept small and horizontally-scrollable so it doesn't crowd the hero. */}
      <section className="border-y" style={{ borderColor: `${brand.textMuted}15`, backgroundColor: `${brand.bgCard}55` }}>
        <div className="mx-auto max-w-7xl overflow-hidden px-4 py-3">
          <div className="trust-marquee-track gap-10 text-xs">
            {(() => {
              const items = [
                {
                  icon: "\u{1F331}",
                  title: publicStats ? `${roundStat(publicStats.total_strains)} strains tracked` : "Strains tracked",
                  desc: "Curated UK medical cannabis catalogue",
                },
                {
                  icon: "\u{2B50}",
                  title: publicStats ? `${roundStat(publicStats.total_reviews)} reviews` : "Patient reviews",
                  desc: "Verified reviews across every batch",
                },
                { icon: "\u{1F9EA}", title: "Batch-Linked Data", desc: "Every review tied to a specific tested batch" },
                { icon: "\u{1F4F8}", title: "Photos Required", desc: "Product, close-up and packaging verified per review" },
                { icon: "\u{1F1EC}\u{1F1E7}", title: "UK Medical Only", desc: "Private-prescription flower — no recreational products" },
              ];
              // Two identical copies — the CSS translates the track by -50%
              // so the second copy lands exactly where the first started for a
              // seamless loop.
              return [...items, ...items].map((item, i) => (
                <div
                  key={`${item.title}-${i}`}
                  className="flex shrink-0 items-center gap-2.5 pr-10"
                  aria-hidden={i >= items.length ? "true" : undefined}
                >
                  <span className="text-lg" aria-hidden>{item.icon}</span>
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-white">{item.title}</span>
                    <span style={{ color: brand.textMuted }}>{item.desc}</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* ── 2. Top Rated Batches ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHeading>Top Rated Batches</SectionHeading>
        {/* Batch-first — the section was previously mislabelled as "Top
            Rated Strains" but its data source (/batches/top-rated) has
            always been batch-ranked. Truth-in-labelling. */}
        <CoverFlowCarousel>
          {topLoading
            ? Array.from({ length: 8 }).map((_, i) => <StrainCardSkeleton key={i} />)
            : topBatches.map((card) => <StrainCard key={card.id} card={card} />)}
        </CoverFlowCarousel>
        {topBatches.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/strains"
              className="inline-block rounded-full border-2 px-8 py-2.5 text-sm font-semibold transition hover:opacity-90"
              style={{ borderColor: brand.primary, color: brand.primary }}
            >
              View All Strains
            </Link>
          </div>
        )}
      </section>

      {/* ── 2a. Top Batches This Month ─────────────────────────────────── */}
      {/* Ranks by average rating restricted to reviews from the last 30
          days. Surfaces batches with current momentum instead of long-
          standing favourites that no longer benefit from fresh evidence. */}
      {monthBatches.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <SectionHeading>Top Batches This Month</SectionHeading>
          <CoverFlowCarousel>
            {monthBatches.map((card) => <StrainCard key={card.id} card={card} />)}
          </CoverFlowCarousel>
        </section>
      )}

      {/* ── 2b. Browse By (Conditions / Effects / Flavours / Terpenes) ── */}
      {/* Surface the four discovery taxonomies directly on the home so
          patients don't have to open the mega-menu to see the breadth
          of browse options. Mirrors the weedstrain.com IA pattern. */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHeading>Browse by</SectionHeading>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DiscoveryGrid
            title="By Condition"
            subtitle="Find strains that patients rate highly for a specific condition."
            accent={brand.success}
            viewAllHref="/strains"
            items={[
              { label: "Chronic Pain", href: "/strains?condition=Chronic+Pain", icon: "\u{1FA79}" },
              { label: "Anxiety", href: "/strains?condition=Anxiety", icon: "\u{1F630}" },
              { label: "Insomnia", href: "/strains?condition=Insomnia", icon: "\u{1F634}" },
              { label: "Depression", href: "/strains?condition=Depression", icon: "\u{1F614}" },
              { label: "PTSD", href: "/strains?condition=PTSD", icon: "\u{1F9E0}" },
              { label: "Migraines", href: "/strains?condition=Migraines", icon: "\u{1F915}" },
              { label: "Nausea", href: "/strains?condition=Nausea", icon: "\u{1F922}" },
              { label: "Appetite Loss", href: "/strains?condition=Appetite+Loss", icon: "\u{1F37D}\u{FE0F}" },
              { label: "Muscle Spasms", href: "/strains?condition=Muscle+Spasms", icon: "\u{1F4AA}" },
              { label: "ADHD", href: "/strains?condition=ADHD", icon: "\u{26A1}" },
              { label: "Arthritis", href: "/strains?condition=Arthritis", icon: "\u{1F9B4}" },
              { label: "Fibromyalgia", href: "/strains?condition=Fibromyalgia", icon: "\u{1FA7A}" },
            ]}
          />
          <DiscoveryGrid
            title="By Effect"
            subtitle="Filter by how patients say the strain made them feel."
            accent={brand.secondary}
            viewAllHref="/strains"
            items={[
              { label: "Relaxed", href: "/strains?effect=Relaxed", icon: "\u{1F60C}" },
              { label: "Euphoric", href: "/strains?effect=Euphoric", icon: "\u{1F929}" },
              { label: "Sleepy", href: "/strains?effect=Sleepy", icon: "\u{1F4A4}" },
              { label: "Uplifted", href: "/strains?effect=Uplifted", icon: "\u{1F31E}" },
              { label: "Creative", href: "/strains?effect=Creative", icon: "\u{1F3A8}" },
              { label: "Focused", href: "/strains?effect=Focused", icon: "\u{1F3AF}" },
              { label: "Calm", href: "/strains?effect=Calm", icon: "\u{1F9D8}" },
              { label: "Energetic", href: "/strains?effect=Energetic", icon: "\u{26A1}" },
              { label: "Happy", href: "/strains?effect=Happy", icon: "\u{1F604}" },
              { label: "Hungry", href: "/strains?effect=Hungry", icon: "\u{1F37D}\u{FE0F}" },
            ]}
          />
          <DiscoveryGrid
            title="By Flavour"
            subtitle="Notes patients pick up in aroma and taste."
            accent={brand.tertiary}
            viewAllHref="/strains"
            items={[
              { label: "Citrus", href: "/strains?flavour=Citrus", icon: "\u{1F34B}" },
              { label: "Earthy", href: "/strains?flavour=Earthy", icon: "\u{1F331}" },
              { label: "Pine", href: "/strains?flavour=Pine", icon: "\u{1F332}" },
              { label: "Sweet", href: "/strains?flavour=Sweet", icon: "\u{1F36C}" },
              { label: "Berry", href: "/strains?flavour=Berry", icon: "\u{1FAD0}" },
              { label: "Diesel", href: "/strains?flavour=Diesel", icon: "\u{26FD}" },
              { label: "Pepper", href: "/strains?flavour=Pepper", icon: "\u{1F336}\u{FE0F}" },
              { label: "Skunky", href: "/strains?flavour=Skunky", icon: "\u{1F9A8}" },
              { label: "Woody", href: "/strains?flavour=Woody", icon: "\u{1FAB5}" },
              { label: "Floral", href: "/strains?flavour=Floral", icon: "\u{1F337}" },
            ]}
          />
          <DiscoveryGrid
            title="By Terpene"
            subtitle="Aromatic compounds that shape both smell and effect."
            accent="#3b82f6"
            viewAllHref="/strains"
            items={[
              { label: "Myrcene", href: "/strains?terpene=Myrcene" },
              { label: "Limonene", href: "/strains?terpene=Limonene" },
              { label: "Caryophyllene", href: "/strains?terpene=Caryophyllene" },
              { label: "Linalool", href: "/strains?terpene=Linalool" },
              { label: "Pinene", href: "/strains?terpene=Pinene" },
              { label: "Humulene", href: "/strains?terpene=Humulene" },
              { label: "Terpinolene", href: "/strains?terpene=Terpinolene" },
              { label: "Ocimene", href: "/strains?terpene=Ocimene" },
              { label: "Bisabolol", href: "/strains?terpene=Bisabolol" },
              { label: "Valencene", href: "/strains?terpene=Valencene" },
            ]}
          />
        </div>
      </section>

      {/* ── 2c. Latest Batches Added ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <LatestListings />
      </section>

      {/* ── 3. Most Recent Reviews ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHeading>Most Recent Reviews</SectionHeading>
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {recentReviews.map((r) => (
            <ReviewCard
              key={r.id}
              id={r.id}
              username={r.username || "Anonymous"}
              avatarUrl={r.avatar_url}
              communityStatus={r.community_status}
              strainName={r.strain_name || "Unknown Strain"}
              strainId={r.strain_id ?? undefined}
              batchNumber={r.batch_number || ""}
              batchId={r.batch_id}
              growerName={r.grower_name || "Unknown Grower"}
              growerId={r.grower_id ?? undefined}
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
      </section>

      {/* ── 4. About Us ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-16 text-center">
        <SectionHeading>About DataStrain</SectionHeading>
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: brand.bgCard }}
        >
          <p className="text-base leading-relaxed" style={{ color: brand.textMuted }}>
            DataStrain is the UK&apos;s first dedicated review platform for medical cannabis patients.
            We believe patients deserve a single, trusted source of truth — real reviews from real patients,
            tied to verified batches and lab-tested data. No guesswork, no anonymous forums, just structured,
            searchable, honest feedback that helps you find the right strain for your condition.
          </p>
          <p className="mt-4 text-base leading-relaxed" style={{ color: brand.textMuted }}>
            Our community-driven approach means every review is moderated, every batch is verified,
            and every voice matters. Whether you&apos;re newly prescribed or a seasoned patient,
            DataStrain is built for you.
          </p>
        </div>
      </section>

      {/* ── 5. Browse By ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <SectionHeading>Browse Strains</SectionHeading>

        {/* By Type */}
        <div className="mb-8">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider" style={{ color: brand.textMuted }}>
            By Type
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {browseTypes.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="flex items-center gap-2 rounded-full border-2 px-6 py-2 text-sm font-semibold transition hover:brightness-110"
                style={{ borderColor: t.color, color: t.color }}
              >
                <StrainTypeIcon type={t.value} size={14} /> {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* By Condition */}
        <div className="mb-8">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider" style={{ color: brand.textMuted }}>
            By Condition
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {browseConditions.map((c) => (
              <Link
                key={c.label}
                href={`/strains?condition=${encodeURIComponent(c.label)}`}
                className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition hover:text-white hover:brightness-110"
                style={{ borderColor: `${brand.textMuted}33`, color: brand.textMuted }}
              >
                <span>{c.icon}</span> {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* By Effect */}
        <div>
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider" style={{ color: brand.textMuted }}>
            By Effect
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {browseEffects.map((e) => (
              <Link
                key={e.label}
                href={`/strains?effect=${encodeURIComponent(e.label)}`}
                className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition hover:text-white hover:brightness-110"
                style={{ borderColor: `${brand.textMuted}33`, color: brand.textMuted }}
              >
                <span>{e.icon}</span> {e.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Latest Reviews ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHeading>Latest Reviews</SectionHeading>
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {latestReviews.map((r) => (
            <ReviewCard
              key={r.id}
              id={r.id}
              username={r.username || "Anonymous"}
              avatarUrl={r.avatar_url}
              communityStatus={r.community_status}
              strainName={r.strain_name || "Unknown Strain"}
              strainId={r.strain_id ?? undefined}
              batchNumber={r.batch_number || ""}
              batchId={r.batch_id}
              growerName={r.grower_name || "Unknown Grower"}
              growerId={r.grower_id ?? undefined}
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
        <div className="mt-8 text-center">
          <Link
            href="/reviews"
            className="inline-block rounded-full border-2 px-8 py-2.5 text-sm font-semibold transition hover:opacity-90"
            style={{ borderColor: brand.secondary, color: brand.secondary }}
          >
            View All Reviews
          </Link>
        </div>
      </section>

      {/* ── 7. Top Rated Growers ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHeading>Top Rated Growers</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {growers.map((g) => (
            <GrowerCard
              key={g.id}
              id={g.id}
              name={g.name}
              rank={g.rank}
              totalGrowers={growers.length}
              rating={g.avg_rating}
              logoUrl={g.logo_url}
            />
          ))}
        </div>
        {growers.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/growers"
              className="inline-block rounded-full border-2 px-8 py-2.5 text-sm font-semibold transition hover:opacity-90"
              style={{ borderColor: brand.primary, color: brand.primary }}
            >
              See Full Rankings
            </Link>
          </div>
        )}
      </section>

      {/* ── 8. Footer ───────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
