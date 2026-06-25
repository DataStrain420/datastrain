"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import StrainCard, { CardData } from "@/components/StrainCard";
import StrainCardSkeleton from "@/components/StrainCardSkeleton";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

const C = brand;

/* ── Banner logic ──────────────────────────────────────────────────────────── */

/** Icon lookup tables — match the sidebar filter icons so the banner mirrors
 *  whatever the user just clicked on. Defaults handle unrecognised values. */
const CONDITION_ICONS: Record<string, string> = {
  Insomnia: "\u{1F634}",
  Anxiety: "\u{1F630}",
  "Chronic Pain": "\u{1FA79}",
  Depression: "\u{1F614}",
  PTSD: "\u{1F9E0}",
  Migraines: "\u{1F915}",
  Nausea: "\u{1F922}",
  ADHD: "\u{26A1}",
};

const EFFECT_ICONS: Record<string, string> = {
  Relaxed: "\u{1F60C}",
  Euphoric: "\u{1F929}",
  Creative: "\u{1F3A8}",
  Sleepy: "\u{1F4A4}",
  Focused: "\u{1F3AF}",
  Calm: "\u{1F9D8}",
  Happy: "\u{1F60A}",
  Energetic: "\u{26A1}",
};

const TYPE_COLORS: Record<string, string> = {
  indica: C.tertiary,
  sativa: "#f59e0b",
  hybrid: "#ec4899",
};

interface BannerConfig {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

function buildBanner(params: URLSearchParams): BannerConfig {
  const sort = params.get("sort");
  const type = params.get("type");      // indica / sativa / hybrid
  const effect = params.get("effect");
  const condition = params.get("condition");

  // ── Title — combine sort + type + effect/condition into one phrase ─────
  let sortWord = "";
  if (sort === "top-rated") sortWord = "Top Rated";
  else if (sort === "top-rated-week") sortWord = "Trending This Week";
  else if (sort === "most-reviewed") sortWord = "Most Reviewed";
  else if (sort === "newest") sortWord = "Newest";

  const typeWord = type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
  const baseParts = [sortWord, typeWord].filter(Boolean);
  let title = baseParts.length ? `${baseParts.join(" ")} Strains` : "All Strains";
  if (condition) title += ` for ${condition}`;
  else if (effect) title += ` · ${effect}`;
  const thcBucket = thcFilters.find((b) => b.id === thcBucketFromParams(params));
  if (thcBucket) title += ` · ${thcBucket.label} THC`;
  const irradiated = params.get("irradiated");
  if (irradiated === "true") title += " · Irradiated";
  else if (irradiated === "false") title += " · Non-irradiated";

  // ── Subtitle — short descriptive line ────────────────────────────────
  let subtitle = "Browse the full DataStrain catalogue.";
  if (condition) {
    subtitle = `Strains UK patients use to manage ${condition.toLowerCase()}.`;
  } else if (effect) {
    subtitle = `Strains most associated with feeling ${effect.toLowerCase()}.`;
  } else if (sort === "top-rated") {
    subtitle = "The highest-rated strains across our entire community.";
  } else if (sort === "top-rated-week") {
    subtitle = "What patients have been rating highest in the last 7 days.";
  } else if (sort === "most-reviewed") {
    subtitle = "Strains with the most patient feedback.";
  } else if (sort === "newest") {
    subtitle = "Recently added to the DataStrain catalogue.";
  } else if (type) {
    subtitle = `All ${type} cultivars listed on DataStrain.`;
  }

  // ── Icon + accent colour — most specific filter wins ─────────────────
  let icon = "\u{1F33F}";
  let color: string = C.primary;
  if (condition) {
    icon = CONDITION_ICONS[condition] || "\u{1FA7A}"; // 🩺 fallback
    color = C.success;
  } else if (effect) {
    icon = EFFECT_ICONS[effect] || "\u{26A1}";
    color = C.secondary;
  } else if (sort === "top-rated") {
    icon = "\u{1F3C6}"; // 🏆
    color = "#f9cf58";
  } else if (sort === "top-rated-week") {
    icon = "\u{1F525}"; // 🔥
    color = "#f97316";
  } else if (sort === "most-reviewed") {
    icon = "\u{1F4AC}"; // 💬
    color = C.primary;
  } else if (sort === "newest") {
    icon = "\u{2728}"; // ✨
    color = C.secondary;
  } else if (type) {
    icon = type === "indica" ? "\u{25D0}" : type === "sativa" ? "\u{25D1}" : "\u{25CF}";
    color = TYPE_COLORS[type] || C.primary;
  }

  return { title, subtitle, icon, color };
}

/* ── Banner component ──────────────────────────────────────────────────────── */

const HEX_PATH =
  "M219.9,66.7l-84,-47.4c-4.888,-2.799-10.912,-2.799-15.8,0l-84,47.4c-4.997,2.885-8.089,8.23-8.1,14l0,94.6c0.011,5.77,3.103,11.115,8.1,14l84,47.4c4.888,2.799,10.912,2.799,15.8,0l84,-47.4c4.997,-2.885,8.089,-8.23,8.1,-14l0,-94.6c-0.011,-5.77-3.103,-11.115-8.1,-14Z";

function StrainsBanner({ config, count }: { config: BannerConfig; count: number }) {
  const { title, subtitle, icon, color } = config;
  return (
    <div
      className="mb-6 overflow-hidden rounded-2xl border px-5 py-3 sm:px-6 sm:py-3.5"
      style={{
        borderColor: `${color}44`,
        background: `linear-gradient(135deg, ${color}22 0%, ${C.bgCard} 65%)`,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Brand hex with the filter icon */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center sm:h-11 sm:w-11">
          <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
            <path
              d={HEX_PATH}
              fill={color}
              fillOpacity={0.18}
              stroke={color}
              strokeWidth={5}
            />
          </svg>
          <span className="relative z-10 text-lg sm:text-xl">{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">
            {title}
          </h1>
          <p
            className="truncate text-[11px] leading-snug sm:text-xs"
            style={{ color: C.textMuted }}
          >
            {subtitle}
          </p>
        </div>

        <span
          className="hidden shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold sm:inline-flex"
          style={{ borderColor: `${color}55`, color }}
        >
          {count} {count === 1 ? "strain" : "strains"}
        </span>
      </div>
    </div>
  );
}

function buildApiUrl(params: URLSearchParams): string {
  const qp = new URLSearchParams();
  qp.set("limit", "20");

  const sort = params.get("sort");
  const type = params.get("type");
  const effect = params.get("effect");
  const condition = params.get("condition");
  const grower = params.get("grower_id");
  const thcMin = params.get("thc_min");
  const thcMax = params.get("thc_max");
  const irradiated = params.get("irradiated");

  if (sort) qp.set("sort", sort);
  if (type) qp.set("strain_type", type);
  if (effect) qp.set("effect", effect);
  if (condition) qp.set("condition", condition);
  if (grower) qp.set("grower_id", grower);
  if (thcMin) qp.set("thc_min", thcMin);
  if (thcMax) qp.set("thc_max", thcMax);
  if (irradiated === "true" || irradiated === "false") qp.set("irradiated", irradiated);

  return `/batches/cards?${qp.toString()}`;
}

/* ── Filter data ───────────────────────────────────────────────────────────── */

const typeFilters = [
  { label: "Indica", value: "indica", icon: "\u{25D0}" },
  { label: "Sativa", value: "sativa", icon: "\u{25D1}" },
  { label: "Hybrid", value: "hybrid", icon: "\u{25CF}" },
];

const conditionFilters = [
  { label: "Insomnia", icon: "\u{1F634}" },
  { label: "Anxiety", icon: "\u{1F630}" },
  { label: "Chronic Pain", icon: "\u{1FA79}" },
  { label: "Depression", icon: "\u{1F614}" },
  { label: "PTSD", icon: "\u{1F9E0}" },
  { label: "Migraines", icon: "\u{1F915}" },
  { label: "Nausea", icon: "\u{1F922}" },
  { label: "ADHD", icon: "\u{26A1}" },
];

const effectFilters = [
  { label: "Relaxed", icon: "\u{1F60C}" },
  { label: "Euphoric", icon: "\u{1F929}" },
  { label: "Creative", icon: "\u{1F3A8}" },
  { label: "Sleepy", icon: "\u{1F4A4}" },
  { label: "Focused", icon: "\u{1F3AF}" },
  { label: "Calm", icon: "\u{1F9D8}" },
  { label: "Happy", icon: "\u{1F60A}" },
  { label: "Energetic", icon: "\u{26A1}" },
];

/** THC potency buckets. Single-select — each one maps to a (min, max) range
 *  threaded through to the backend as thc_min / thc_max query params. */
const thcFilters: { id: string; label: string; min: number | null; max: number | null; sub: string }[] = [
  { id: "mild",      label: "Mild",      min: null, max: 15, sub: "Under 15%" },
  { id: "standard",  label: "Standard",  min: 15,   max: 20, sub: "15–20%" },
  { id: "high",      label: "High",      min: 20,   max: 25, sub: "20–25%" },
  { id: "very-high", label: "Very High", min: 25,   max: null, sub: "25%+" },
];

function thcBucketFromParams(params: URLSearchParams): string {
  const min = params.get("thc_min");
  const max = params.get("thc_max");
  const match = thcFilters.find(
    (b) => (b.min === null ? min === null : String(b.min) === min)
        && (b.max === null ? max === null : String(b.max) === max),
  );
  return match?.id ?? "";
}

const sortOptions = [
  { label: "Name (A-Z)", value: "" },
  { label: "Top Rated (All Time)", value: "top-rated" },
  { label: "Top Rated (This Week)", value: "top-rated-week" },
  { label: "Most Reviewed", value: "most-reviewed" },
  { label: "Newest", value: "newest" },
];

/* ── Filter button helper ──────────────────────────────────────────────────── */

function FilterBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition"
      style={{
        backgroundColor: active ? `${C.primary}18` : "transparent",
        color: active ? "white" : C.textMuted,
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
      {active && (
        <span className="ml-auto text-xs" style={{ color: C.primary }}>
          ✓
        </span>
      )}
    </button>
  );
}

/* ── Content (needs Suspense for useSearchParams) ──────────────────────────── */

function StrainsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  const bannerConfig = buildBanner(searchParams);
  const activeType = searchParams.get("type") || "";
  const activeCondition = searchParams.get("condition") || "";
  const activeEffect = searchParams.get("effect") || "";
  const activeSort = searchParams.get("sort") || "";
  const activeThc = thcBucketFromParams(searchParams);
  const activeIrradiation = searchParams.get("irradiated") || ""; // "true" | "false" | ""

  useEffect(() => {
    setLoading(true);
    apiFetch<CardData[]>(buildApiUrl(searchParams))
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function setFilter(key: string, value: string) {
    const qp = new URLSearchParams(searchParams.toString());
    if (qp.get(key) === value) {
      qp.delete(key); // toggle off
    } else {
      qp.set(key, value);
    }
    router.push(`/strains?${qp.toString()}`);
  }

  function clearFilters() {
    router.push("/strains");
  }

  /** Toggles a THC bucket — selecting the active one clears the filter,
   *  selecting a new one swaps thc_min/thc_max in one go. */
  function setThcBucket(bucketId: string) {
    const qp = new URLSearchParams(searchParams.toString());
    qp.delete("thc_min");
    qp.delete("thc_max");
    if (bucketId !== activeThc) {
      const bucket = thcFilters.find((b) => b.id === bucketId);
      if (bucket?.min !== null && bucket?.min !== undefined) qp.set("thc_min", String(bucket.min));
      if (bucket?.max !== null && bucket?.max !== undefined) qp.set("thc_max", String(bucket.max));
    }
    router.push(`/strains?${qp.toString()}`);
  }

  const hasFilters = activeType || activeCondition || activeEffect || activeSort || activeThc || activeIrradiation;

  return (
    <>
      {/* ── Banner — spans the full content width above the filter sidebar ─ */}
      <StrainsBanner config={bannerConfig} count={cards.length} />

      <div className="flex gap-8">
      {/* ── Sidebar filters ────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div
          className="sticky top-20 space-y-6 rounded-2xl p-4"
          style={{ backgroundColor: C.bgCard }}
        >
          {/* Sort */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Sort By
            </p>
            {sortOptions.map((s) => (
              <FilterBtn
                key={s.value}
                label={s.label}
                active={activeSort === s.value}
                onClick={() => setFilter("sort", s.value || "")}
              />
            ))}
          </div>

          {/* Type */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Type
            </p>
            {typeFilters.map((t) => (
              <FilterBtn
                key={t.value}
                label={t.label}
                icon={t.icon}
                active={activeType === t.value}
                onClick={() => setFilter("type", t.value)}
              />
            ))}
          </div>

          {/* THC strength */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              THC Strength
            </p>
            {thcFilters.map((b) => (
              <button
                key={b.id}
                onClick={() => setThcBucket(b.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition"
                style={{
                  backgroundColor: activeThc === b.id ? `${C.primary}18` : "transparent",
                  color: activeThc === b.id ? "white" : C.textMuted,
                }}
              >
                <span>{b.label}</span>
                <span className="text-[10px]" style={{ color: activeThc === b.id ? C.primary : `${C.textMuted}99` }}>
                  {b.sub}
                </span>
                {activeThc === b.id && (
                  <span className="ml-auto text-xs" style={{ color: C.primary }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Irradiation */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Irradiation
            </p>
            <FilterBtn
              label="Irradiated"
              icon={"☢️"}
              active={activeIrradiation === "true"}
              onClick={() => setFilter("irradiated", "true")}
            />
            <FilterBtn
              label="Non-irradiated"
              icon={"\u{1F33F}"}
              active={activeIrradiation === "false"}
              onClick={() => setFilter("irradiated", "false")}
            />
          </div>

          {/* Condition */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Helps With
            </p>
            {conditionFilters.map((c) => (
              <FilterBtn
                key={c.label}
                label={c.label}
                icon={c.icon}
                active={activeCondition === c.label}
                onClick={() => setFilter("condition", c.label)}
              />
            ))}
          </div>

          {/* Effect */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Effect
            </p>
            {effectFilters.map((e) => (
              <FilterBtn
                key={e.label}
                label={e.label}
                icon={e.icon}
                active={activeEffect === e.label}
                onClick={() => setFilter("effect", e.label)}
              />
            ))}
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="w-full rounded-lg py-2 text-center text-xs font-semibold transition hover:opacity-80"
              style={{ backgroundColor: `${C.primary}18`, color: C.primary }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="flex-1">

        {loading ? (
          <div className="flex flex-wrap justify-center gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <StrainCardSkeleton key={i} />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ color: C.textMuted }}>No strains found matching your filters.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 rounded-lg px-6 py-2 text-sm font-semibold transition hover:opacity-80"
                style={{ backgroundColor: C.primary, color: C.bgDeep }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {cards.map((card) => (
              <StrainCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

/* ── Page wrapper ──────────────────────────────────────────────────────────── */

export default function StrainsListingPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<p style={{ color: C.textMuted }}>Loading...</p>}>
          <StrainsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
