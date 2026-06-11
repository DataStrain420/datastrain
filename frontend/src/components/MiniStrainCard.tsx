"use client";

import { useState, useEffect } from "react";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import StrainCard, { type CardData } from "@/components/StrainCard";

const C = brand;

interface MiniStrainCardProps {
  batchId: number | null;
  strainName: string;
  batchNumber: string | null;
}

/**
 * Lightweight loader that fetches a batch's card data by ID and renders the
 * full `StrainCard` used elsewhere on the site. The component name is kept
 * for backwards compatibility with existing dashboard imports — the original
 * "mini" layout has been replaced with the full-size card.
 */
export default function MiniStrainCard({ batchId, strainName, batchNumber }: MiniStrainCardProps) {
  const [card, setCard] = useState<CardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    apiFetch<CardData>(`/batches/${batchId}/card`)
      .then(setCard)
      .catch(() => setFailed(true));
  }, [batchId]);

  if (card) {
    return <StrainCard card={card} />;
  }

  // ── Loading / error placeholder ─────────────────────────────────────
  return (
    <div
      className="flex h-[460px] w-full flex-col items-center justify-center rounded-2xl px-4 text-center"
      style={{
        backgroundColor: C.bgCard,
        border: `1px solid ${C.textMuted}22`,
      }}
    >
      <p className="text-sm font-bold" style={{ color: C.primary }}>
        {strainName}
      </p>
      {batchNumber && (
        <p className="mt-1 font-mono text-xs" style={{ color: C.textMuted }}>
          {batchNumber}
        </p>
      )}
      <p className="mt-4 text-xs" style={{ color: C.textMuted }}>
        {failed ? "Couldn't load card" : "Loading..."}
      </p>
    </div>
  );
}
