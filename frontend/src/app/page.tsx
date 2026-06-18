"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import StrainCard, { CardData } from "@/components/StrainCard";
import GrowerCard from "@/components/GrowerCard";
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
  created_at: string;
}

/* ── Static data ───────────────────────────────────────────────────────────── */

const filterPills = [
  { label: "Browse All", color: brand.secondary, href: "/strains" },
  { label: "Sativa", color: "#f59e0b", href: "/strains?type=sativa" },
  { label: "Indica", color: brand.tertiary, href: "/strains?type=indica" },
  { label: "Hybrid", color: "#ec4899", href: "/strains?type=hybrid" },
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
  const [topStrains, setTopStrains] = useState<CardData[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewData[]>([]);
  const [latestReviews, setLatestReviews] = useState<ReviewData[]>([]);
  useEffect(() => {
    // Top rated growers
    apiFetch<RankedGrower[]>("/growers/top-rated?limit=12")
      .then(setGrowers)
      .catch((err) => console.error("Growers:", err));

    // Top rated strains (card data)
    apiFetch<CardData[]>("/batches/top-rated?limit=8")
      .then(setTopStrains)
      .catch((err) => console.error("Top strains:", err));

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

          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-6">
            <span className="text-sm font-medium" style={{ color: brand.textMuted }}>{"\u2B50"} 4,000+ reviews</span>
            <span className="text-sm font-medium" style={{ color: brand.textMuted }}>{"\u{1F331}"} 120+ strains tracked</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: brand.textMuted }}>
              <svg viewBox="0 0 60 30" className="inline-block h-3.5 w-7 rounded-sm" xmlns="http://www.w3.org/2000/svg">
                <clipPath id="uk"><rect width="60" height="30"/></clipPath>
                <g clipPath="url(#uk)">
                  <rect width="60" height="30" fill="#012169"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk)"/>
                  <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
                  <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
                </g>
              </svg>
              UK medical products only
            </span>
          </div>

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-4">
            <p className="w-full text-center text-xs font-semibold uppercase tracking-widest" style={{ color: brand.textMuted }}>
              Quick Browse
            </p>
            {filterPills.map((pill) => (
              <Link
                key={pill.label}
                href={pill.href}
                className="flex items-center gap-2.5 rounded-full border px-6 py-2.5 text-base font-semibold transition hover:brightness-110 hover:text-white"
                style={{
                  borderColor: `${pill.color}66`,
                  backgroundColor: `${pill.color}18`,
                  color: "white",
                }}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pill.color }} />
                {pill.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Top Rated Strains ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHeading>Top Rated Strains</SectionHeading>
        <div className="flex flex-wrap justify-center gap-6">
          {topStrains.map((card) => (
            <StrainCard key={card.id} card={card} />
          ))}
        </div>
        {topStrains.length > 0 && (
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

      {/* ── 3. Most Recent Reviews ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHeading>Most Recent Reviews</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
