/**
 * Community-rank ladder — frontend mirror of `backend/app/services/ranks.py`.
 *
 * IMPORTANT: Keep `minKudos` values in sync with `RANK_TIERS` on the backend.
 * The progression numbers shown live (current/next thresholds) come from the
 * `/users/me` response, but the full ladder displayed in the "View all ranks"
 * modal is rendered from this static list.
 */

import { brand } from "@/lib/brand";

const C = brand;

export interface RankTier {
  /** Stored value in `users.community_status` */
  value: string;
  label: string;
  icon: string;
  /** Inclusive lower-bound kudos to be in this tier */
  minKudos: number;
  /** Tailwind-incompatible colors — pass into inline styles */
  color: string;
  bg: string;
}

export const RANK_TIERS: RankTier[] = [
  { value: "seedling", label: "Seedling", icon: "\u{1F331}", minKudos: 0,
    color: C.textMuted, bg: `${C.textMuted}20` },
  { value: "sprout", label: "Sprout", icon: "\u{1F33F}", minKudos: 100,
    color: "#6ecf8a", bg: "#6ecf8a20" },
  { value: "grower", label: "Grower", icon: "\u{1F33E}", minKudos: 300,
    color: C.primary, bg: `${C.primary}20` },
  { value: "cultivator", label: "Cultivator", icon: "\u{2B50}", minKudos: 750,
    color: C.secondary, bg: `${C.secondary}20` },
  { value: "master_cultivator", label: "Master Cultivator", icon: "\u{1F451}", minKudos: 1750,
    color: "#f9cf58", bg: "#f9cf5820" },
  { value: "legend", label: "Legend", icon: "\u{1F48E}", minKudos: 4000,
    color: C.tertiary, bg: `${C.tertiary}20` },
];

export function getTier(value: string | null | undefined): RankTier {
  return RANK_TIERS.find((t) => t.value === value) || RANK_TIERS[0];
}

export function getTierIndex(value: string | null | undefined): number {
  const idx = RANK_TIERS.findIndex((t) => t.value === value);
  return idx === -1 ? 0 : idx;
}
