"use client";

import { brand } from "@/lib/brand";

const C = brand;

/**
 * Placeholder shown in place of a StrainCard while card data is loading.
 * Matches the card's fixed 300x468 (Top Trumps) footprint so the layout
 * appears instantly and doesn't shift when real cards arrive. Uses a single
 * CSS pulse (animate-pulse) — no per-card JS.
 */
export default function StrainCardSkeleton() {
  const block = `${C.textMuted}1f`;
  return (
    <div
      className="aspect-[300/468] w-[300px] max-w-[calc(100vw-2rem)] animate-pulse overflow-hidden rounded-2xl border"
      style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}22` }}
      aria-hidden
    >
      <div className="flex h-full flex-col p-4">
        {/* Header: title + rank */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2 pr-3">
            <div className="h-4 w-3/4 rounded" style={{ backgroundColor: block }} />
            <div className="h-3 w-1/2 rounded" style={{ backgroundColor: block }} />
          </div>
          <div className="h-12 w-12 rounded-lg" style={{ backgroundColor: block }} />
        </div>

        {/* Photo */}
        <div className="mt-3 h-40 w-full rounded-xl" style={{ backgroundColor: block }} />

        {/* Pills row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="h-6 w-20 rounded-full" style={{ backgroundColor: block }} />
          <div className="h-6 w-28 rounded-full" style={{ backgroundColor: block }} />
        </div>

        {/* Rating bars */}
        <div className="mt-auto space-y-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2.5 w-full rounded-full" style={{ backgroundColor: block }} />
          ))}
        </div>
      </div>
    </div>
  );
}
