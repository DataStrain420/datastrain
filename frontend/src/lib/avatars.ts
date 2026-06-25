/**
 * Preset profile-icon library.
 *
 * We don't ship custom illustrations or accept arbitrary file uploads — users
 * pick from this curated set. Each preset uses DiceBear's `avataaars` style
 * with a hand-picked seed, so the URLs are deterministic, free, and need no
 * local asset bundling.
 *
 * The user model's `avatar_url` column holds whichever URL the user picked.
 * Existing display code (`<img src={avatar_url}>`) keeps working unchanged.
 */

/** Avataaars style + matching radius so portraits fill a circular tile cleanly. */
function dicebear(seed: string): string {
  const encoded = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encoded}&radius=50`;
}

export interface AvatarPreset {
  /** Stable identifier — the seed string. Persisted in avatar_url as part of the URL. */
  id: string;
  url: string;
}

/**
 * 24 curated seeds. Each one renders a visibly distinct cartoon portrait so
 * the picker grid feels varied rather than samey. Names span gender,
 * accessories, expressions — change the strings to change the grid.
 */
const SEEDS = [
  "Astra", "Bramble", "Citrus", "Dune",
  "Ember", "Fox", "Glacier", "Halo",
  "Iris", "Jet", "Koa", "Lumen",
  "Marigold", "Nimbus", "Onyx", "Pip",
  "Quill", "Rune", "Sage", "Tide",
  "Umber", "Vega", "Willow", "Zen",
];

export const AVATAR_PRESETS: AvatarPreset[] = SEEDS.map((seed) => ({
  id: seed,
  url: dicebear(seed),
}));

/** Look up a preset by its persisted URL (or seed id). Returns null if the
 *  URL is custom-uploaded or otherwise outside the preset set. */
export function findPreset(value: string | null | undefined): AvatarPreset | null {
  if (!value) return null;
  return AVATAR_PRESETS.find((p) => p.url === value || p.id === value) ?? null;
}
