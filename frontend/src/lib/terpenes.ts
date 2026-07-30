/**
 * Terpene metadata — short human-readable summaries used for tooltips
 * across the app (strain card back face, strain detail page, and any
 * future /terpenes/ landing pages).
 *
 * Keep each `summary` under ~120 chars so it fits comfortably in a
 * native title tooltip. Longer explanatory content should live on a
 * dedicated terpene page.
 */
export interface TerpeneInfo {
  aroma: string;
  effects: string;
  summary: string;
}

export const TERPENES: Record<string, TerpeneInfo> = {
  Myrcene: {
    aroma: "Earthy, musky, herbal",
    effects: "Relaxing, sedating — associated with the couch-lock effect.",
    summary: "Earthy, musky. Relaxing and sedating — the classic 'couch-lock' terpene.",
  },
  Limonene: {
    aroma: "Citrus, lemon, orange peel",
    effects: "Mood-lift and stress relief; often reported as uplifting.",
    summary: "Citrus and lemon. Mood-lifting and stress-relieving; commonly reported as uplifting.",
  },
  Caryophyllene: {
    aroma: "Spicy, peppery, woody",
    effects: "Anti-inflammatory; the only known terpene that binds CB2 receptors.",
    summary: "Peppery and spicy. Anti-inflammatory — the only terpene that binds CB2 receptors directly.",
  },
  Linalool: {
    aroma: "Floral, lavender, sweet",
    effects: "Calming, anti-anxiety, sleep-supporting.",
    summary: "Floral and lavender. Calming and sleep-supporting; helpful with anxiety.",
  },
  Pinene: {
    aroma: "Pine, rosemary, fresh",
    effects: "Alertness, memory retention, may counter THC's short-term memory dip.",
    summary: "Pine and fresh. Alertness and memory retention; often offsets THC's short-term memory effects.",
  },
  Humulene: {
    aroma: "Earthy, woody, hoppy",
    effects: "Anti-inflammatory and appetite-suppressing (rare among cannabis terpenes).",
    summary: "Earthy, hop-like. Anti-inflammatory and appetite-suppressing — rare in cannabis.",
  },
  Terpinolene: {
    aroma: "Herbal, floral, piney",
    effects: "Uplifting, sometimes described as psychedelic-adjacent.",
    summary: "Herbal and piney. Uplifting and energetic; common in sativa-leaning cultivars.",
  },
  Ocimene: {
    aroma: "Sweet, herbal, minty",
    effects: "Uplifting and decongestant; often paired with limonene.",
    summary: "Sweet and minty. Uplifting with mild decongestant effects.",
  },
  Bisabolol: {
    aroma: "Floral, sweet, chamomile",
    effects: "Gentle anti-inflammatory; skin-soothing (also found in chamomile).",
    summary: "Floral and chamomile-like. Gentle anti-inflammatory; also found in skincare.",
  },
  Valencene: {
    aroma: "Citrus, sweet, grapefruit",
    effects: "Uplifting and anti-inflammatory; named for the Valencia orange.",
    summary: "Sweet citrus, like Valencia oranges. Uplifting and anti-inflammatory.",
  },
};

/** Get the one-line summary for a terpene, or a generic fallback. */
export function terpeneSummary(name: string): string {
  return TERPENES[name]?.summary ?? `${name} — cannabis terpene`;
}
