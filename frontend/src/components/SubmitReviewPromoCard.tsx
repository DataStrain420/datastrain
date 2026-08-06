"use client";

import Link from "next/link";
import { brand } from "@/lib/brand";

/**
 * Sits at the end of the strains listing to fill the leftover slot on the
 * last row when the total isn't a clean multiple of the column count.
 * Same footprint as StrainCard (300x468) so it slots in cleanly. When the
 * last row is already full, it starts a new row on its own — which is
 * fine here because it's an intentional CTA, not filler.
 */
export default function SubmitReviewPromoCard() {
  return (
    <Link
      href="/portal/review/new"
      className="group relative flex aspect-[300/468] w-[300px] max-w-[calc(100vw-2rem)] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition hover:brightness-125"
      style={{
        borderColor: `${brand.primary}55`,
        backgroundColor: `${brand.primary}0d`,
      }}
    >
      {/* Big icon */}
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
        style={{
          backgroundColor: `${brand.primary}20`,
          color: brand.primary,
        }}
      >
        {"\u{270F}\u{FE0F}"}
      </div>

      <h3 className="mb-2 text-lg font-extrabold text-white">
        Missing a strain?
      </h3>
      <p className="mb-5 text-sm leading-relaxed" style={{ color: brand.textMuted }}>
        Add your review with three verification photos and help build the UK&apos;s
        most trusted medical cannabis database.
      </p>

      <span
        className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition group-hover:brightness-110"
        style={{ backgroundColor: brand.primary, color: brand.bgDeep }}
      >
        Submit a review
        <span aria-hidden>{"\u{2192}"}</span>
      </span>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: `${brand.textMuted}88` }}>
        3-min form · Batch verified
      </p>
    </Link>
  );
}
