"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { terpeneSummary } from "@/lib/terpenes";

interface TerpeneData {
  terpene_name: string;
  percentage: number;
}

export interface CardData {
  id: number;
  strain_id?: number | null;
  strain_name: string;
  strain_aliases?: string | null;
  strain_type: string;
  grower_id?: number | null;
  grower_name: string;
  batch_number: string;
  rank?: number | null;
  thc_percentage: number;
  cbd_percentage: number;
  tested_date?: string | null;
  irradiated?: boolean | null;
  top_terpenes: TerpeneData[];
  avg_appearance_rating: number | null;
  avg_aroma_rating: number | null;
  avg_moisture_rating: number | null;
  avg_flavour_rating: number | null;
  avg_effect_rating: number | null;
  review_count: number;
  recent_rank?: number | null;
  top_condition?: string | null;
  top_condition_rank?: number | null;
  top_effect?: string | null;
  top_effect_rank?: number | null;
  top_flavour_label?: string | null;
  top_flavour_rank?: number | null;
  strain_image_url?: string | null;
  strain_description?: string | null;
  previous_batch_id?: number | null;
  previous_batch_number?: string | null;
  previous_avg_rating?: number | null;
  previous_review_count?: number | null;
}

const C = brand;

import StrainTypeIcon, { typeLabel } from "@/components/StrainTypeIcon";

type RankTier = "legendary" | "rare" | "standard" | "common";

function getRankTier(rank: number): RankTier {
  if (rank === 1) return "legendary";
  if (rank >= 2 && rank <= 10) return "rare";
  if (rank >= 11 && rank <= 100) return "standard";
  return "common";
}

/** Border + shadow styles per tier — legendary/rare get a coloured trim
 *  and an outer glow while keeping the standard dark card body. The metallic
 *  gradient background was too distracting behind data-heavy content.
 *  Rank hex retains its own gold/silver treatment separately. */
function tierStyles(tier: RankTier) {
  switch (tier) {
    case "legendary":
      return {
        border: "2px solid #e8cc6a",
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), 0 0 30px rgba(201,168,76,0.35), 0 0 60px rgba(255,215,0,0.12), inset 0 1px 0 rgba(255,235,150,0.2)`,
      };
    case "rare":
      return {
        border: "2px solid #c0c8d0",
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), 0 0 24px rgba(160,170,180,0.25), 0 0 50px rgba(200,210,220,0.1), inset 0 1px 0 rgba(255,255,255,0.15)`,
      };
    case "standard":
      return {
        border: `2px solid ${C.primary}55`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      };
    default:
      return {
        border: `2px solid ${C.textMuted}33`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      };
  }
}

/** Hexagon with rank number — gold gradient for #1, default cyan otherwise.
 *  When strainId is provided, the review-count line becomes a link that
 *  jumps to the strain page's Reviews section (#reviews). */
function RankHex({
  rank,
  tier,
  reviewCount,
  strainId,
}: {
  rank: number;
  tier: RankTier;
  reviewCount: number;
  strainId?: number | null;
}) {
  const isGold = tier === "legendary";
  const isSilver = tier === "rare";
  const isHolo = isGold || isSilver;
  const hexFill = isGold ? "url(#hex-gold-grad)" : isSilver ? "url(#hex-silver-grad)" : C.secondary;
  const textColor = isGold ? "#2a1f00" : isSilver ? "#1a1d20" : C.bgDeep;
  // Match the RatingBar labels (Appearance/Aroma/etc) — same muted colour
  // on every tier now that the metallic holo background is gone. The rank
  // hex fill + inside-hex number still get gold/silver via hexFill/textColor.
  const labelColor = C.textMuted;
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Hex with 'RANK' label above the number inside it, count underneath.
          Slightly larger hex than the label-outside version (h-12) so the
          two stacked labels have room to breathe. */}
      <div className="relative h-12 w-12">
        <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
          <defs>
            {isGold && (
              <linearGradient id="hex-gold-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d4a942" />
                <stop offset="40%" stopColor="#f5d76e" />
                <stop offset="60%" stopColor="#f5d76e" />
                <stop offset="100%" stopColor="#c9953c" />
              </linearGradient>
            )}
            {isSilver && (
              <linearGradient id="hex-silver-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8a9199" />
                <stop offset="35%" stopColor="#c0c8d0" />
                <stop offset="55%" stopColor="#d8dee4" />
                <stop offset="100%" stopColor="#8a9199" />
              </linearGradient>
            )}
          </defs>
          <path
            d="M219.9,66.7l-84,-47.4c-4.888,-2.799-10.912,-2.799-15.8,0l-84,47.4c-4.997,2.885-8.089,8.23-8.1,14l0,94.6c0.011,5.77,3.103,11.115,8.1,14l84,47.4c4.888,2.799,10.912,2.799,15.8,0l84,-47.4c4.997,-2.885,8.089,-8.23,8.1,-14l0,-94.6c-0.011,-5.77-3.103,-11.115-8.1,-14Z"
            fill={hexFill}
            stroke={isGold ? "#6b4a0e" : isSilver ? "#3a3f46" : "none"}
            strokeWidth={isHolo ? 9 : 0}
            strokeLinejoin="round"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center leading-none"
          style={{ color: textColor }}
        >
          <span className="text-[7px] font-bold uppercase tracking-wider opacity-80">
            Rank
          </span>
          <span className="text-sm font-black">
            {rank}
          </span>
        </div>
      </div>
      {strainId ? (
        <Link
          href={`/strain/${strainId}#reviews`}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-semibold leading-none transition hover:underline"
          style={{ color: labelColor }}
        >
          {reviewCount.toLocaleString()} rating{reviewCount !== 1 ? "s" : ""}
        </Link>
      ) : (
        <span
          className="text-[10px] font-semibold leading-none"
          style={{ color: labelColor }}
        >
          {reviewCount.toLocaleString()} rating{reviewCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

/** THC/CBD joint pill — split design */
function ThcCbdPill({ thc, cbd }: { thc: number; cbd: number }) {
  return (
    <div
      className="flex overflow-hidden rounded-full border"
      style={{ borderColor: `${C.textMuted}33` }}
    >
      <span
        className="px-3 py-1 text-xs font-bold text-white"
        style={{ backgroundColor: C.bgDeep }}
      >
        THC <span style={{ color: C.secondary }}>{thc}%</span>
      </span>
      <span
        className="px-3 py-1 text-xs font-bold text-white"
        style={{ backgroundColor: C.bgDeep, borderLeft: `1px solid ${C.textMuted}33` }}
      >
        CBD <span style={{ color: C.secondary }}>{cbd}%</span>
      </span>
    </div>
  );
}

export default function StrainCard({ card }: { card: CardData }) {
  const [flipped, setFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);
  const typeLbl = typeLabel(card.strain_type);
  const handleImgError = useCallback(() => setImgError(true), []);
  // Rank can legitimately be null for older sibling batches — the
  // catalogue rank query only positions the latest batch per strain. Fall
  // through to a "no rank hex" render in that case instead of showing a
  // misleading "Rank 0".
  const isRanked = typeof card.rank === "number" && card.rank > 0;
  const displayRank = isRanked ? (card.rank as number) : 0;
  const tier = isRanked ? getRankTier(displayRank) : "common";
  // isHolo used to gate dark-on-light text/pill styling for legibility
  // against the metallic body. Body is now standard dark on all tiers, so
  // force this false — the RankHex still receives `tier` directly, so
  // the gold/silver rank badge continues to work.
  const isHolo = false;
  const cardBorderStyles = tierStyles(tier);

  // Back-face color palette — dark tones on holo (gold/silver) cards so the
  // text/bars stay legible against the bright metallic gradient.
  const back = {
    heading: isHolo ? "rgba(0,0,0,0.92)" : "#fff",
    body: isHolo ? "rgba(0,0,0,0.7)" : C.textMuted,
    label: isHolo ? "rgba(0,0,0,0.7)" : C.textMuted,
    value: isHolo ? "rgba(0,0,0,0.85)" : undefined,           // category color when not holo
    pillBg: isHolo ? "rgba(0,0,0,0.1)" : undefined,           // colored tint when not holo
    badgeBg: isHolo ? "rgba(0,0,0,0.78)" : undefined,
    badgeText: isHolo ? "#fff" : undefined,
    terpTrack: isHolo ? "rgba(0,0,0,0.18)" : `${C.textMuted}22`,
    terpFill: isHolo
      ? "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.55))"
      : `linear-gradient(90deg, ${C.secondary}, ${C.tertiary})`,
  };

  // Library button states
  const { token } = useAuth();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [tried, setTried] = useState(false);
  const [fired, setFired] = useState(false);
  const [libraryIds, setLibraryIds] = useState<Record<string, number>>({});

  // Load existing library state for this batch — but only when signed in.
  // Without this gate every card on the home page fires its own /library/
  // request on mount and hammers the API with 401s (one per card × Strict
  // Mode × re-renders). Skipping when there's no token drops that to zero.
  useEffect(() => {
    if (!token) return;
    apiFetch<{ id: number; list_type: string; batch_id: number | null }[]>("/library/")
      .then((entries) => {
        const ids: Record<string, number> = {};
        for (const e of entries) {
          if (e.batch_id === card.id) {
            if (e.list_type === "wishlist") { setWishlisted(true); ids.wishlist = e.id; }
            if (e.list_type === "tried") { setTried(true); ids.tried = e.id; }
            if (e.list_type === "favourite") { setFired(true); ids.favourite = e.id; }
          }
        }
        setLibraryIds(ids);
      })
      .catch(() => {}); // Token may have expired
  }, [card.id, token]);

  async function toggleLibrary(listType: string, isActive: boolean, setActive: (v: boolean) => void) {
    // Logged-out patients previously hit a silent 401 here, making the
    // buttons appear unresponsive. Route to register with a returnable
    // redirect so the action is discoverable — the strain page they came
    // from is the sensible landing after sign-up.
    if (!token) {
      const redirect = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push(`/register?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    try {
      if (isActive && libraryIds[listType]) {
        await apiFetch(`/library/${libraryIds[listType]}`, { method: "DELETE" });
        setActive(false);
        setLibraryIds((prev) => { const next = { ...prev }; delete next[listType]; return next; });
      } else {
        const entry = await apiFetch<{ id: number }>("/library/", {
          method: "POST",
          body: JSON.stringify({ batch_id: card.id, list_type: listType }),
        });
        setActive(true);
        setLibraryIds((prev) => ({ ...prev, [listType]: entry.id }));

        // Activating "tried" or "favourite" means the wishlist entry no
        // longer makes sense — you've already got it. Clear it out.
        if ((listType === "tried" || listType === "favourite") && libraryIds.wishlist) {
          const wishlistId = libraryIds.wishlist;
          apiFetch(`/library/${wishlistId}`, { method: "DELETE" }).catch(() => {});
          setWishlisted(false);
          setLibraryIds((prev) => { const next = { ...prev }; delete next.wishlist; return next; });
        }
      }
    } catch {
      // Duplicate or transient error — swallow.
    }
  }


  return (
    <div
      className="aspect-[300/468] w-[300px] max-w-[calc(100vw-2rem)] cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={clsx(
          "relative h-full w-full transition-transform duration-500",
          "[transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* ═══ FRONT FACE ═══ */}
        <div
          className={clsx(
            "absolute inset-0 flex flex-col overflow-hidden rounded-2xl [backface-visibility:hidden]",
            tier === "legendary" && "card-holographic-gold",
            tier === "rare" && "card-holographic",
            tier === "legendary" && "card-glow-pulse",
          )}
          style={{
            backgroundColor: C.bgCard,
            ...cardBorderStyles,
          }}
        >
          {/* ── Header: strain info left, rank right ─────────────────── */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2">
            <div className="min-w-0 flex-1 pr-2">
              {card.strain_id ? (
                <Link
                  href={`/strain/${card.strain_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate text-lg font-extrabold leading-tight tracking-tight transition hover:underline"
                  style={{ color: C.primary }}
                >
                  {card.strain_name}
                </Link>
              ) : (
                <h3 className="truncate text-lg font-extrabold leading-tight tracking-tight" style={{ color: C.primary }}>
                  {card.strain_name}
                </h3>
              )}
              {card.strain_aliases && (
                <p
                  className={clsx(
                    "mt-0.5 truncate text-[11px]",
                    isHolo && "font-semibold",
                  )}
                  style={{ color: isHolo ? "rgba(0,0,0,0.65)" : C.textMuted }}
                >
                  Aka: {card.strain_aliases}
                </p>
              )}
              <p className={clsx("mt-0.5 truncate text-xs", isHolo ? "font-bold" : "font-medium")}>
                <span style={{ color: isHolo ? "rgba(0,0,0,0.7)" : C.textMuted }}>By</span>{" "}
                {card.grower_id ? (
                  <Link
                    href={`/grower/${card.grower_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="transition hover:underline"
                    style={{ color: C.primary }}
                  >
                    {card.grower_name}
                  </Link>
                ) : (
                  <span style={{ color: C.primary }}>{card.grower_name}</span>
                )}
              </p>
              {/* Batch number + trend pill — batch-first UX. Small, mono,
                  immediately under the byline so patients read "Aurora by
                  Farm Gas, batch E123456 ↑" as one continuous identity.
                  Trend pill only appears when the previous sibling batch
                  has ratings to compare. */}
              {(() => {
                const ratings = [
                  card.avg_appearance_rating,
                  card.avg_aroma_rating,
                  card.avg_moisture_rating,
                  card.avg_flavour_rating,
                  card.avg_effect_rating,
                ].filter((v): v is number => typeof v === "number");
                const currentAvg = ratings.length === 5 ? ratings.reduce((a, b) => a + b, 0) / 5 : null;
                const prev = card.previous_avg_rating ?? null;
                let trend: { icon: string; delta: number; color: string } | null = null;
                if (currentAvg !== null && prev !== null) {
                  const delta = currentAvg - prev;
                  trend =
                    delta > 0.3
                      ? { icon: "↑", delta, color: C.primary }
                      : delta < -0.3
                        ? { icon: "↓", delta, color: "#f87171" }
                        : { icon: "→", delta, color: C.textMuted };
                }
                return (
                  <p
                    className={clsx(
                      "mt-1 flex items-center gap-1.5 truncate font-mono text-[10px] uppercase tracking-wider",
                      isHolo ? "font-bold" : "font-semibold",
                    )}
                    style={{ color: isHolo ? "rgba(0,0,0,0.65)" : C.textMuted }}
                    title="Current batch"
                  >
                    <span className="truncate">Batch {card.batch_number}</span>
                    {trend && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 leading-none normal-case tracking-normal"
                        style={{
                          color: trend.color,
                          backgroundColor: `${trend.color}18`,
                          border: `1px solid ${trend.color}55`,
                        }}
                        title={`${trend.delta >= 0 ? "+" : ""}${trend.delta.toFixed(1)} vs previous batch`}
                      >
                        {trend.icon} {Math.abs(trend.delta).toFixed(1)}
                      </span>
                    )}
                  </p>
                );
              })()}
            </div>
            {isRanked ? (
              <RankHex
                rank={displayRank}
                tier={tier}
                reviewCount={card.review_count}
                strainId={card.strain_id}
              />
            ) : (
              // Older batches share their strain's rank slot with the newest
              // batch — no independent rank of their own. Show a compact
              // "Older" chip so the header slot doesn't collapse but the
              // reader isn't told a lie about position.
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${C.textMuted}22`,
                    color: C.textMuted,
                    border: `1px solid ${C.textMuted}33`,
                  }}
                  title="Older batch of this strain — the newer batch holds the strain's rank"
                >
                  Older batch
                </span>
                {card.review_count > 0 && card.strain_id && (
                  <Link
                    href={`/strain/${card.strain_id}#reviews`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-semibold leading-none transition hover:underline"
                    style={{ color: C.textMuted }}
                  >
                    {card.review_count.toLocaleString()} rating{card.review_count !== 1 ? "s" : ""}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Photo area ────────────────────────────────────────────── */}
          <div
            className="relative mx-4 flex h-52 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: C.bgDeep }}
          >
            <img
              src={
                card.strain_image_url && !imgError
                  ? card.strain_image_url.startsWith("http")
                    ? card.strain_image_url
                    : card.strain_image_url.startsWith("/images/")
                      ? card.strain_image_url
                      : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace(/\/api\/v1\/?$/, "")}${card.strain_image_url}`
                  : "/images/strain-placeholder.png"
              }
              alt={card.strain_name}
              className="h-full w-full rounded-xl object-cover"
              onError={handleImgError}
            />
          </div>

          {/* ── Attribute row: type + irradiation | THC + CBD ──────────── */}
          {/* Two-group layout: type/irradiation chips on the left, THC/CBD
              chips on the right, justified so THC/CBD get room to breathe
              instead of getting squeezed inside a 4-part segmented pill. */}
          <div className="px-5 pb-2 pt-2">
            <div
              className="flex items-center justify-between gap-2 text-[11px] font-semibold"
              style={{ color: C.textMuted }}
            >
              {/* Left group */}
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-6 items-center gap-1 rounded-full border px-2"
                  style={{ backgroundColor: C.bgDeep, borderColor: `${C.textMuted}33` }}
                >
                  <StrainTypeIcon type={card.strain_type} size={12} />
                  <span>{typeLbl}</span>
                </span>
                {card.irradiated !== undefined && card.irradiated !== null && (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm leading-none"
                    style={{
                      backgroundColor: C.bgDeep,
                      borderColor: `${C.textMuted}33`,
                      color: card.irradiated ? "#f59e0b" : C.primary,
                    }}
                    title={card.irradiated ? "Gamma-irradiated for microbial sterilisation" : "Not gamma-irradiated"}
                    aria-label={card.irradiated ? "Irradiated" : "Non-irradiated"}
                  >
                    {card.irradiated ? "☢" : "\u{1F33F}"}
                  </span>
                )}
              </div>
              {/* Right group */}
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-6 items-center gap-1 rounded-full border px-2"
                  style={{ backgroundColor: C.bgDeep, borderColor: `${C.textMuted}33` }}
                >
                  <span style={{ color: C.textMuted }}>THC</span>
                  <span style={{ color: C.secondary }}>{card.thc_percentage}%</span>
                </span>
                <span
                  className="inline-flex h-6 items-center gap-1 rounded-full border px-2"
                  style={{ backgroundColor: C.bgDeep, borderColor: `${C.textMuted}33` }}
                >
                  <span style={{ color: C.textMuted }}>CBD</span>
                  <span style={{ color: C.secondary }}>{card.cbd_percentage}%</span>
                </span>
              </div>
            </div>

            {/* Best-for line — sits centred under the two chip groups.
                The condition itself links to /strains?condition=X so
                patients can jump straight to strains for that use case.
                Hidden when there's no top condition (cold-start). */}
            {card.top_condition && (
              <div
                className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold"
                style={{ color: C.textMuted }}
              >
                <span>Best for</span>
                <Link
                  href={`/strains?condition=${encodeURIComponent(card.top_condition)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="transition hover:underline"
                  style={{ color: C.primary }}
                >
                  {card.top_condition}
                </Link>
              </div>
            )}
          </div>

          {/* ── Bottom info section ───────────────────────────────────── */}
          <div className="mt-auto px-5 pb-2">
            {/* Rating bars — averaged review scores.
                Holo (gold/silver) cards switch the bars to dark text/track/fill
                so they stay readable against the bright metallic background. */}
            <div className="mb-2 space-y-0.5">
              <RatingBar label="Appearance" value={card.avg_appearance_rating} dark={isHolo} />
              <RatingBar label="Aroma" value={card.avg_aroma_rating} dark={isHolo} />
              <RatingBar label="Moisture" value={card.avg_moisture_rating} dark={isHolo} />
              <RatingBar label="Flavour" value={card.avg_flavour_rating} dark={isHolo} />
              <RatingBar label="Effect" value={card.avg_effect_rating} dark={isHolo} />
            </div>

            {/* Action buttons — three library toggles. Row is left-aligned
                with right padding so the rightmost button (Fire) stays clear
                of the 60px flip triangle in the corner. Buttons are compact
                so the gap can be tight. relative + z-10 so clicks land here
                and don't get stolen by the absolute-positioned flip wedge. */}
            <div
              className="relative z-10 mt-4 flex items-center justify-start gap-4 pr-16"
            >
              <LibraryButton
                active={wishlisted}
                isHolo={isHolo}
                icon={"+"}
                label="Wishlist"
                onClick={(e) => { e.stopPropagation(); toggleLibrary("wishlist", wishlisted, setWishlisted); }}
              />
              <LibraryButton
                active={tried}
                isHolo={isHolo}
                icon={"\u2713"}
                label="Tried"
                onClick={(e) => { e.stopPropagation(); toggleLibrary("tried", tried, setTried); }}
              />
              <LibraryButton
                active={fired}
                isHolo={isHolo}
                icon={"\u{1F525}"}
                label="Fire"
                onClick={(e) => { e.stopPropagation(); toggleLibrary("favourite", fired, setFired); }}
              />
            </div>
          </div>

          {/* Flip affordance — filled right-triangle wedge in the bottom-right
              corner tells the user the card is two-sided. The whole card
              flips on tap (see parent onClick), so this is purely visual. */}
          <div
            className="pointer-events-none absolute bottom-0 right-0"
            aria-label="Tap to flip"
            title="Tap to flip"
            style={{
              width: 60,
              height: 60,
              clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
              // Soft blend into the card — start fully transparent for
              // the first third of the wedge, then fade in to a subtle
              // brand-cyan tint at the corner. Reads as an accent, not
              // a hard shape.
              background: `linear-gradient(135deg, transparent 33%, ${C.secondary}66 100%)`,
            }}
          >
            <svg
              className="absolute h-4 w-4"
              style={{ bottom: 6, right: 6, color: C.secondary }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.933 13.04a8 8 0 1 1-9.925-8.788c3.899-1 7.935 1.007 9.425 4.747" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v5h-5" />
            </svg>
          </div>

        </div>

        {/* ═══ BACK FACE ═══ */}
        <div
          className={clsx(
            "absolute inset-0 flex flex-col overflow-hidden rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]",
            tier === "legendary" && "card-holographic-gold",
            tier === "rare" && "card-holographic",
            tier === "legendary" && "card-glow-pulse",
          )}
          style={{
            backgroundColor: C.bgCard,
            ...cardBorderStyles,
          }}
        >
          <div className="px-5 pt-5">
            <h3 className="text-lg font-extrabold" style={{ color: back.heading }}>{card.strain_name}</h3>
            <p
              className={clsx("mt-0.5 font-mono text-xs", isHolo && "font-semibold")}
              style={{ color: back.body }}
            >
              Batch: {card.batch_number}
            </p>
            {/* Batch history — surfaces the previous sibling batch's rating
                so patients can see if the grower is improving on this
                strain or slipping. Only renders when both batches actually
                have ratings, otherwise the delta is meaningless. */}
            {(() => {
              const ratings = [
                card.avg_appearance_rating,
                card.avg_aroma_rating,
                card.avg_moisture_rating,
                card.avg_flavour_rating,
                card.avg_effect_rating,
              ].filter((v): v is number => typeof v === "number");
              const currentAvg = ratings.length === 5 ? ratings.reduce((a, b) => a + b, 0) / 5 : null;
              const prev = card.previous_avg_rating ?? null;
              if (currentAvg === null || prev === null || !card.previous_batch_number) return null;
              const delta = currentAvg - prev;
              const trend =
                delta > 0.3
                  ? { icon: "↑", label: "Improving", color: C.primary }
                  : delta < -0.3
                    ? { icon: "↓", label: "Declining", color: "#f87171" }
                    : { icon: "→", label: "Steady", color: back.body };
              return (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                  <span style={{ color: back.body }}>
                    Prev <span className="font-mono">{card.previous_batch_number}</span>: <b style={{ color: back.heading }}>{prev.toFixed(1)}</b>
                  </span>
                  <span className="font-semibold" style={{ color: trend.color }}>
                    {trend.icon} {trend.label}
                  </span>
                </div>
              );
            })()}
          </div>

          {card.strain_description && (
            <p
              className={clsx(
                "mt-3 line-clamp-3 px-5 text-xs leading-relaxed",
                isHolo && "font-medium",
              )}
              style={{ color: back.body }}
            >
              {card.strain_description}
            </p>
          )}

          {/* Trait rank pills — condition / effect / flavour / 30-day */}
          {(card.recent_rank || card.top_condition || card.top_effect || card.top_flavour_label) && (
            <div className="mt-3 flex flex-col gap-1.5 px-5">
              {card.recent_rank && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: back.pillBg ?? `${C.primary}10` }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: back.label }}>30-Day Rank</span>
                  <span
                    className="ml-auto rounded px-1.5 py-0.5 text-xs font-black"
                    style={{
                      backgroundColor: back.badgeBg ?? `${C.primary}22`,
                      color: back.badgeText ?? C.primary,
                    }}
                  >
                    #{card.recent_rank}
                  </span>
                </div>
              )}
              {card.top_condition && (
                <Link
                  href={`/strains?condition=${encodeURIComponent(card.top_condition)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition hover:brightness-125"
                  style={{ backgroundColor: back.pillBg ?? `${C.success}10` }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: back.label }}>Condition Rank</span>
                  <span
                    className={clsx("ml-auto flex items-center gap-1.5 text-xs", isHolo ? "font-bold" : "font-semibold")}
                    style={{ color: back.value ?? C.accent }}
                  >
                    {card.top_condition}
                    {card.top_condition_rank && (
                      <span className="rounded px-1 py-0.5 text-[9px] font-black" style={{ backgroundColor: back.badgeBg ?? `${C.accent}22`, color: back.badgeText ?? C.accent }}>
                        #{card.top_condition_rank}
                      </span>
                    )}
                  </span>
                </Link>
              )}
              {card.top_effect && (
                <Link
                  href={`/strains?effect=${encodeURIComponent(card.top_effect)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition hover:brightness-125"
                  style={{ backgroundColor: back.pillBg ?? `#f9cf5808` }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: back.label }}>Effect Rank</span>
                  <span
                    className={clsx("ml-auto flex items-center gap-1.5 text-xs", isHolo ? "font-bold" : "font-semibold")}
                    style={{ color: back.value ?? "#f9cf58" }}
                  >
                    {card.top_effect}
                    {card.top_effect_rank && (
                      <span className="rounded px-1 py-0.5 text-[9px] font-black" style={{ backgroundColor: back.badgeBg ?? "#f9cf5822", color: back.badgeText ?? "#f9cf58" }}>
                        #{card.top_effect_rank}
                      </span>
                    )}
                  </span>
                </Link>
              )}
              {card.top_flavour_label && (
                <Link
                  href={`/strains?effect=${encodeURIComponent(card.top_flavour_label)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition hover:brightness-125"
                  style={{ backgroundColor: back.pillBg ?? `${C.tertiary}08` }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: back.label }}>Flavour Rank</span>
                  <span
                    className={clsx("ml-auto flex items-center gap-1.5 text-xs", isHolo ? "font-bold" : "font-semibold")}
                    style={{ color: back.value ?? C.tertiary }}
                  >
                    {card.top_flavour_label}
                    {card.top_flavour_rank && (
                      <span className="rounded px-1 py-0.5 text-[9px] font-black" style={{ backgroundColor: back.badgeBg ?? `${C.tertiary}22`, color: back.badgeText ?? C.tertiary }}>
                        #{card.top_flavour_rank}
                      </span>
                    )}
                  </span>
                </Link>
              )}
            </div>
          )}

          {/* Terpene profile */}
          {card.top_terpenes.length > 0 && (
            <div className="mt-4 px-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: back.label }}>
                Terpene Profile
              </p>
              {card.top_terpenes.map((t) => (
                <div key={t.terpene_name} className="mb-1.5 flex items-center gap-2">
                  <span
                    className={clsx("w-20 cursor-help text-xs underline decoration-dotted decoration-1 underline-offset-2", isHolo && "font-semibold")}
                    style={{ color: back.body }}
                    title={terpeneSummary(t.terpene_name)}
                  >
                    {t.terpene_name}
                  </span>
                  <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: back.terpTrack }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(t.percentage * 50, 100)}%`,
                        background: back.terpFill,
                      }}
                    />
                  </div>
                  <span
                    className={clsx("w-10 text-right text-xs", isHolo && "font-bold")}
                    style={{ color: back.body }}
                  >
                    {t.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto px-5 pb-5 pt-4">
            <Link
              href={card.strain_id ? `/strain/${card.strain_id}` : `/batch/${card.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block rounded-xl py-2.5 text-center text-sm font-bold transition hover:opacity-90"
              style={{ backgroundColor: C.primary, color: C.bgDeep }}
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudPlaceholder() {
  return (
    <svg viewBox="0 0 200 200" className="h-36 w-36 opacity-90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="b1" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#6ecf8a" />
          <stop offset="50%" stopColor="#3da35a" />
          <stop offset="100%" stopColor="#26713d" />
        </radialGradient>
        <radialGradient id="b2" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#82d99a" />
          <stop offset="50%" stopColor="#4eb86a" />
          <stop offset="100%" stopColor="#2d8a4a" />
        </radialGradient>
        <radialGradient id="fr" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="translate(100, 95)">
        <path d="M0 55 Q-2 70 -1 90 Q0 95 1 90 Q2 70 0 55" fill="#4a8c3e" />
        <path d="M-1 72 Q-22 58 -32 68 Q-22 72 -1 76" fill="#3da35a" opacity="0.7" />
        <path d="M1 72 Q22 58 32 68 Q22 72 1 76" fill="#3da35a" opacity="0.7" />
        <ellipse cx="-26" cy="22" rx="22" ry="28" fill="url(#b1)" transform="rotate(-15 -26 22)" />
        <ellipse cx="26" cy="22" rx="22" ry="28" fill="url(#b1)" transform="rotate(15 26 22)" />
        <ellipse cx="-14" cy="38" rx="20" ry="24" fill="url(#b2)" transform="rotate(-8 -14 38)" />
        <ellipse cx="14" cy="38" rx="20" ry="24" fill="url(#b2)" transform="rotate(8 14 38)" />
        <ellipse cx="-20" cy="0" rx="24" ry="30" fill="url(#b2)" transform="rotate(-10 -20 0)" />
        <ellipse cx="20" cy="0" rx="24" ry="30" fill="url(#b2)" transform="rotate(10 20 0)" />
        <ellipse cx="0" cy="10" rx="22" ry="28" fill="url(#b1)" />
        <ellipse cx="-12" cy="-20" rx="22" ry="26" fill="url(#b2)" transform="rotate(-12 -12 -20)" />
        <ellipse cx="12" cy="-20" rx="22" ry="26" fill="url(#b2)" transform="rotate(12 12 -20)" />
        <ellipse cx="0" cy="-12" rx="20" ry="26" fill="url(#b1)" />
        <ellipse cx="-6" cy="-40" rx="17" ry="22" fill="url(#b2)" transform="rotate(-8 -6 -40)" />
        <ellipse cx="6" cy="-40" rx="17" ry="22" fill="url(#b1)" transform="rotate(8 6 -40)" />
        <ellipse cx="0" cy="-44" rx="14" ry="20" fill="url(#b2)" />
        <g stroke="#e8943a" strokeWidth="1.5" fill="none" opacity="0.9">
          <path d="M-8 -48 Q-14 -58 -10 -63" />
          <path d="M6 -46 Q12 -56 8 -61" />
          <path d="M-16 -24 Q-25 -32 -22 -38" />
          <path d="M17 -22 Q26 -30 23 -36" />
          <path d="M-24 4 Q-34 -2 -31 -10" />
          <path d="M25 4 Q35 -2 32 -10" />
          <path d="M-12 28 Q-22 22 -20 14" />
          <path d="M14 28 Q24 22 22 14" />
          <path d="M0 -56 Q-4 -65 1 -68" />
        </g>
        <ellipse cx="0" cy="-15" rx="42" ry="55" fill="url(#fr)" />
        <g fill="#ffffff" opacity="0.5">
          <circle cx="-10" cy="-36" r="1.5" />
          <circle cx="12" cy="-30" r="1.3" />
          <circle cx="-22" cy="-10" r="1.4" />
          <circle cx="24" cy="-5" r="1.5" />
          <circle cx="-6" cy="8" r="1.3" />
          <circle cx="14" cy="16" r="1.4" />
          <circle cx="4" cy="-50" r="1.3" />
          <circle cx="0" cy="-24" r="1.6" />
          <circle cx="-16" cy="20" r="1.2" />
          <circle cx="18" cy="-42" r="1.1" />
        </g>
      </g>
    </svg>
  );
}

/** Wishlist / Tried / Fire pill — three-icon action row at the bottom of the
 *  front face. When not active, switches text/icon/border to dark tones on
 *  holo cards so they remain visible against the gold/silver background. */
function LibraryButton({
  active,
  isHolo,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  isHolo: boolean;
  icon: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  // Match the RatingBar label colour so the icons + labels share the
  // same muted grey as Appearance/Aroma/etc.
  const inactiveText = isHolo ? "rgba(0,0,0,0.75)" : C.textMuted;
  const inactiveBorder = isHolo ? "rgba(0,0,0,0.5)" : C.textMuted;
  const inactiveBorderWidth = isHolo ? 1.5 : 1;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 transition-opacity hover:opacity-80"
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-sm transition-all"
        style={{
          border: active
            ? `2px solid ${C.primary}`
            : `${inactiveBorderWidth}px solid ${inactiveBorder}`,
          backgroundColor: active ? C.primary : "transparent",
          color: active ? C.bgDeep : inactiveText,
          fontWeight: isHolo && !active ? 900 : undefined,
        }}
      >
        {icon}
      </span>
      <span
        className={clsx("text-[10px]", isHolo && !active ? "font-extrabold" : "font-semibold")}
        style={{ color: active ? C.primary : inactiveText }}
      >
        {label}
      </span>
    </button>
  );
}

function RatingBar({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: number | null;
  /** When true, render label/value text, track, and fill in dark tones \u2014 for
   *  legibility against bright holographic (gold/silver) card backgrounds. */
  dark?: boolean;
}) {
  const labelColor = dark ? "rgba(0,0,0,0.8)" : C.textMuted;
  const valueColor = dark ? "rgba(0,0,0,0.9)" : C.textMuted;
  const trackBg = dark ? "rgba(0,0,0,0.18)" : `${C.textMuted}22`;
  const fillBg = dark
    ? "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.6))"
    : `linear-gradient(90deg, ${C.primary}, ${C.secondary})`;

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs font-medium" style={{ color: labelColor }}>{label}</span>
      <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: trackBg }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: value ? `${value * 20}%` : "0%",
            background: fillBg,
          }}
        />
      </div>
      <span className="w-8 text-right text-xs font-bold" style={{ color: valueColor }}>
        {value ?? "\u2014"}
      </span>
    </div>
  );
}
