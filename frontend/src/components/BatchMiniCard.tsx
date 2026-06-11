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
}: BatchMiniCardProps) {
  return (
    <Link
      href={`/batch/${id}`}
      className="flex min-w-[140px] flex-col items-center rounded-xl p-4 transition hover:brightness-110"
      style={{ backgroundColor: brand.bgCard }}
    >
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
