"use client";

import Link from "next/link";
import { brand } from "@/lib/brand";

interface BatchMiniCardProps {
  id: number;
  batchNumber: string;
  growerName: string;
  growerId?: number;
  growerLogoUrl?: string | null;
  avgRating: number;
  /** Whether the batch itself has been admin-approved yet. Post-moderation:
   *  patient-submitted batches go live immediately but wear a badge until
   *  an admin verifies them. */
  approved?: boolean;
}

function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="text-xs"
          style={{ color: s <= Math.round(rating) ? brand.primary : `${brand.textMuted}44` }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function BatchMiniCard({
  id,
  batchNumber,
  growerName,
  growerId,
  growerLogoUrl,
  avgRating,
  approved = true,
}: BatchMiniCardProps) {
  return (
    <Link
      href={`/batch/${id}`}
      className="relative flex min-w-[140px] flex-col items-center rounded-xl p-4 transition hover:brightness-110"
      style={{
        backgroundColor: brand.bgCard,
        border: approved ? "none" : `1px solid ${brand.secondary}44`,
      }}
    >
      {!approved && (
        <span
          className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${brand.secondary}22`,
            color: brand.secondary,
            border: `1px solid ${brand.secondary}55`,
          }}
          title="Awaiting admin verification"
        >
          Unverified
        </span>
      )}
      {/* Grower logo */}
      <div
        className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: brand.bgDeep }}
      >
        {growerLogoUrl ? (
          <img src={growerLogoUrl} alt={growerName} className="h-full w-full object-contain p-1.5" />
        ) : (
          <span className="text-sm font-bold" style={{ color: brand.textMuted }}>
            {growerName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Batch number */}
      <p className="mb-0.5 text-sm font-semibold text-white">
        Batch #{batchNumber}
      </p>

      {/* Grower name */}
      <p className="mb-1.5 text-xs" style={{ color: brand.textMuted }}>
        {growerName}
      </p>

      {/* Stars */}
      <ReadOnlyStars rating={avgRating} />
    </Link>
  );
}
