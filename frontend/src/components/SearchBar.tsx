"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

interface SearchResult {
  type: "strain" | "grower" | "condition" | "effect" | "terpene";
  id: number | null;
  name: string;
  detail: string | null;
}

interface SearchBarProps {
  /** Visual size variant */
  size?: "sm" | "lg";
  /** Placeholder text */
  placeholder?: string;
}

const TYPE_ICONS: Record<string, string> = {
  strain: "\u{1F33F}",
  grower: "\u{1F3ED}",
  condition: "\u{1FA7A}",
  effect: "\u{2728}",
  terpene: "\u{1F9EA}",
};

const TYPE_COLORS: Record<string, string> = {
  strain: brand.primary,
  grower: brand.secondary,
  condition: brand.tertiary,
  effect: "#f9cf58",
  terpene: brand.accent,
};

const TYPE_LABELS: Record<string, string> = {
  strain: "Strains",
  grower: "Growers",
  condition: "Conditions",
  effect: "Effects",
  terpene: "Terpenes",
};

/** Fallback quick search chips — used when no trending data exists */
const FALLBACK_CHIPS = [
  { label: "\u{1F4A4} Best for sleep", href: "/strains?condition=Insomnia&sort=top-rated" },
  { label: "\u{1F9EA} Highest THC", href: "/strains?sort=top-rated" },
  { label: "\u{2B50} Top rated this week", href: "/strains?sort=top-rated-week" },
  { label: "\u{1F630} Best for anxiety", href: "/strains?condition=Anxiety&sort=top-rated" },
  { label: "\u{1FA79} Best for pain", href: "/strains?condition=Chronic%20Pain&sort=top-rated" },
  { label: "\u{1F614} Best for depression", href: "/strains?condition=Depression&sort=top-rated" },
];

interface TrendingItem {
  query: string;
  count: number;
  top_result_type: string | null;
}

/** Map a trending search to a chip with label + route */
function trendingToChip(t: TrendingItem): { label: string; href: string } {
  const icon = TYPE_ICONS[t.top_result_type || ""] || "\u{1F50D}";
  const label = `${icon} ${t.query.charAt(0).toUpperCase() + t.query.slice(1)}`;

  if (t.top_result_type === "condition") {
    return { label, href: `/strains?condition=${encodeURIComponent(t.query)}&sort=top-rated` };
  }
  if (t.top_result_type === "effect") {
    return { label, href: `/strains?effect=${encodeURIComponent(t.query)}&sort=top-rated` };
  }
  if (t.top_result_type === "strain") {
    return { label, href: `/strains?sort=top-rated` };
  }
  return { label, href: `/strains?sort=top-rated` };
}

export default function SearchBar({
  size = "sm",
  placeholder = "Search strains, growers, or conditions...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const isLarge = size === "lg";

  // Fetch trending searches (large variant only)
  const [trendingChips, setTrendingChips] = useState<{ label: string; href: string }[]>([]);
  useEffect(() => {
    if (!isLarge) return;
    apiFetch<TrendingItem[]>("/search/trending?limit=8")
      .then((data) => {
        if (data.length > 0) {
          setTrendingChips(data.map(trendingToChip));
        }
      })
      .catch(() => {});
  }, [isLarge]);

  const chips = trendingChips.length > 0 ? trendingChips : FALLBACK_CHIPS;

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      if (query.trim().length === 0) {
        // Keep chips open if focused
      } else {
        setOpen(false);
        setShowChips(false);
      }
      return;
    }

    setShowChips(false);
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      apiFetch<{ query: string; results: SearchResult[] }>(
        `/search/?q=${encodeURIComponent(query.trim())}&limit=10`
      )
        .then((data) => {
          setResults(data.results);
          setOpen(data.results.length > 0);
          setActiveIdx(-1);
        })
        .catch(() => {
          setResults([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowChips(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(item: SearchResult) {
    setOpen(false);
    setShowChips(false);
    setQuery("");
    if (item.type === "strain" && item.id) {
      router.push(`/strain/${item.id}`);
    } else if (item.type === "grower" && item.id) {
      router.push(`/grower/${item.id}`);
    } else if (item.type === "condition") {
      router.push(`/strains?condition=${encodeURIComponent(item.name)}&sort=top-rated`);
    } else if (item.type === "effect") {
      router.push(`/strains?effect=${encodeURIComponent(item.name)}&sort=top-rated`);
    } else if (item.type === "terpene") {
      router.push(`/strains?sort=top-rated`);
    }
  }

  function handleFocus() {
    if (query.trim().length >= 2 && results.length > 0) {
      setOpen(true);
    } else if (query.trim().length === 0 && isLarge) {
      setShowChips(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      navigate(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setShowChips(false);
    }
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  // Flat list for keyboard nav index mapping
  const flatResults: SearchResult[] = [];
  for (const type of ["strain", "grower", "condition", "effect", "terpene"]) {
    if (grouped[type]) flatResults.push(...grouped[type]);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={isLarge
            ? "Search strains, growers, or conditions (e.g. 'ADHD', 'Pink Kush')"
            : placeholder
          }
          className={`w-full rounded-xl border text-white placeholder-gray-500 outline-none transition focus:border-opacity-60 ${
            isLarge ? "py-4 pl-5 pr-14 text-base" : "py-1.5 pl-3 pr-8 text-sm"
          }`}
          style={{
            backgroundColor: isLarge ? brand.bgCard : brand.bgDeep,
            borderColor: isLarge ? `${brand.textMuted}33` : `${brand.primary}44`,
          }}
        />
        {/* Search icon / spinner */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            isLarge ? "right-1.5" : "right-2.5"
          }`}
        >
          {isLarge ? (
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg transition hover:opacity-80"
              style={{ backgroundColor: brand.primary }}
              onClick={() => {
                if (activeIdx >= 0) navigate(flatResults[activeIdx]);
              }}
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${brand.bgDeep}66`, borderTopColor: "transparent" }} />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke={brand.bgDeep} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke={brand.textMuted} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Quick search chips — shown on focus when empty (large variant only) */}
      {showChips && !open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border p-4 shadow-2xl"
          style={{
            backgroundColor: brand.bgCard,
            borderColor: `${brand.textMuted}22`,
          }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: brand.textMuted }}>
            {trendingChips.length > 0 ? "\u{1F525} Trending searches" : "Quick searches"}
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setShowChips(false);
                  router.push(chip.href);
                }}
                className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:brightness-125 hover:text-white"
                style={{
                  borderColor: `${brand.textMuted}33`,
                  color: brand.textMuted,
                  backgroundColor: `${brand.textMuted}08`,
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grouped search results dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border shadow-2xl"
          style={{
            backgroundColor: brand.bgCard,
            borderColor: `${brand.textMuted}22`,
          }}
        >
          {(["strain", "grower", "condition", "effect", "terpene"] as const).map((type) => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            return (
              <div key={type}>
                {/* Section header */}
                <div
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ backgroundColor: `${brand.bgDeep}88` }}
                >
                  <span className="text-xs">{TYPE_ICONS[type]}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TYPE_COLORS[type] }}>
                    {TYPE_LABELS[type]}
                  </span>
                </div>
                {/* Items */}
                {items.map((item) => {
                  const flatIdx = flatResults.indexOf(item);
                  return (
                    <button
                      key={`${item.type}-${item.id ?? item.name}-${flatIdx}`}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setActiveIdx(flatIdx)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition"
                      style={{
                        backgroundColor: flatIdx === activeIdx ? `${brand.primary}12` : "transparent",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{item.name}</p>
                        {item.detail && (
                          <p className="truncate text-xs" style={{ color: brand.textMuted }}>
                            {item.detail}
                          </p>
                        )}
                      </div>

                      {/* Type label */}
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          backgroundColor: `${TYPE_COLORS[item.type]}18`,
                          color: TYPE_COLORS[item.type],
                        }}
                      >
                        {item.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {results.length === 0 && query.length >= 2 && !loading && (
            <p className="px-4 py-3 text-center text-sm" style={{ color: brand.textMuted }}>
              No results for &quot;{query}&quot;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
