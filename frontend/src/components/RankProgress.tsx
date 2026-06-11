"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";
import { RANK_TIERS, getTier, getTierIndex } from "@/lib/ranks";

const C = brand;

interface RankProgressProps {
  communityStatus: string;
  /** Kudos points. `null` when hidden (e.g. another user with `show_kudos: false`). */
  kudosPoints: number | null;
  /** Lower-bound kudos for current tier. Falls back to the static ladder if omitted. */
  currentStatusThreshold?: number;
  /** Enum value of the next tier. `null` at max rank. Falls back to the static ladder. */
  nextStatus?: string | null;
  /** Human label for the next tier. Falls back to the static ladder. */
  nextStatusLabel?: string | null;
  /** Kudos required to reach the next tier. `null` at max rank. Falls back to the static ladder. */
  nextStatusThreshold?: number | null;
  /**
   * Label used to mark the current tier inside the all-ranks modal.
   * Defaults to "You" (dashboard); pass a username or "Their rank" on a public profile.
   */
  subjectLabel?: string;
}

export default function RankProgress({
  communityStatus,
  kudosPoints,
  currentStatusThreshold,
  nextStatus,
  nextStatusLabel,
  nextStatusThreshold,
  subjectLabel = "You",
}: RankProgressProps) {
  const [showLadder, setShowLadder] = useState(false);

  const current = getTier(communityStatus);
  const currentIdx = getTierIndex(communityStatus);

  // Fall back to the static ladder when the backend hasn't provided progression
  // fields (e.g. the public user endpoint).
  const nextTier = RANK_TIERS[currentIdx + 1] ?? null;
  const effectiveCurrentThreshold =
    currentStatusThreshold ?? current.minKudos;
  const effectiveNextStatus =
    nextStatus !== undefined ? nextStatus : nextTier?.value ?? null;
  const effectiveNextLabel =
    nextStatusLabel !== undefined ? nextStatusLabel : nextTier?.label ?? null;
  const effectiveNextThreshold =
    nextStatusThreshold !== undefined ? nextStatusThreshold : nextTier?.minKudos ?? null;

  const atMax = effectiveNextStatus === null || effectiveNextThreshold === null;
  const kudosHidden = kudosPoints === null;

  // Progress fraction within the current tier (only when kudos visible & not at max)
  let progressPct = 100;
  let kudosToNext = 0;
  if (!kudosHidden && !atMax && effectiveNextThreshold !== null) {
    const span = Math.max(1, effectiveNextThreshold - effectiveCurrentThreshold);
    const progressed = Math.max(0, (kudosPoints as number) - effectiveCurrentThreshold);
    progressPct = Math.min(100, Math.round((progressed / span) * 100));
    kudosToNext = Math.max(0, effectiveNextThreshold - (kudosPoints as number));
  }

  return (
    <>
      <div
        className="mt-6 rounded-2xl p-5"
        style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}22` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl" aria-hidden>{current.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold" style={{ color: current.color }}>
                {current.label}
              </p>
              <p className="truncate text-[11px]" style={{ color: C.textMuted }}>
                {kudosHidden ? (
                  atMax ? "Max rank" : <>Next rank: <span style={{ color: "#fff" }}>{effectiveNextLabel}</span></>
                ) : atMax ? (
                  `Max rank · ${(kudosPoints as number).toLocaleString()} kudos`
                ) : (
                  <>
                    {(kudosPoints as number).toLocaleString()} / {effectiveNextThreshold!.toLocaleString()} kudos · {kudosToNext.toLocaleString()} to <span style={{ color: "#fff" }}>{effectiveNextLabel}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLadder(true)}
            className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition hover:opacity-80"
            style={{
              backgroundColor: `${C.primary}18`,
              color: C.primary,
              border: `1px solid ${C.primary}33`,
            }}
          >
            View all ranks
          </button>
        </div>

        {/* Progress bar — only when kudos are visible */}
        {!kudosHidden && (
          <div
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: `${C.textMuted}22` }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: atMax
                  ? `linear-gradient(90deg, ${current.color}, #f9cf58)`
                  : `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── All-ranks modal ─────────────────────────────────────────── */}
      {showLadder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowLadder(false)}
        >
          <div
            className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
            style={{
              backgroundColor: C.bgCard,
              border: `1px solid ${C.secondary}33`,
              boxShadow: `0 0 60px ${C.secondary}15`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-white transition hover:opacity-80"
              style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}44` }}
              onClick={() => setShowLadder(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="mb-1 text-lg font-bold text-white">Community Ranks</h3>
            <p className="mb-5 text-xs" style={{ color: C.textMuted }}>
              Earn kudos by writing reviews, getting helpful votes, and gaining followers.
            </p>

            <ol className="space-y-2">
              {RANK_TIERS.map((tier, i) => {
                const isCurrent = i === currentIdx;
                const isReached = i <= currentIdx;
                const nextThreshold = RANK_TIERS[i + 1]?.minKudos;
                const rangeLabel = nextThreshold
                  ? `${tier.minKudos.toLocaleString()}–${(nextThreshold - 1).toLocaleString()} kudos`
                  : `${tier.minKudos.toLocaleString()}+ kudos`;
                return (
                  <li
                    key={tier.value}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{
                      backgroundColor: isCurrent ? tier.bg : `${C.bgDeep}`,
                      border: isCurrent
                        ? `1.5px solid ${tier.color}`
                        : `1px solid ${C.textMuted}22`,
                      opacity: isReached ? 1 : 0.65,
                    }}
                  >
                    <span className="text-xl" aria-hidden>{tier.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-bold"
                        style={{ color: isReached ? tier.color : C.textMuted }}
                      >
                        {tier.label}
                        {isCurrent && (
                          <span
                            className="ml-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                            style={{ backgroundColor: `${tier.color}33`, color: tier.color }}
                          >
                            {subjectLabel}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px]" style={{ color: C.textMuted }}>
                        {rangeLabel}
                      </p>
                    </div>
                    {isReached && !isCurrent && (
                      <span style={{ color: tier.color }} aria-label="Earned">{"✓"}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
