"use client";

import Link from "next/link";
import { brand } from "@/lib/brand";

interface DiscoveryItem {
  label: string;
  href: string;
  icon?: string;
}

interface DiscoveryGridProps {
  title: string;
  subtitle: string;
  accent: string;
  items: DiscoveryItem[];
  viewAllHref?: string;
}

/**
 * Homepage discovery block — a titled block of pill links for one browse
 * taxonomy (Conditions, Effects, Flavours, Terpenes). Used four-up on the
 * homepage so patients don't have to open the mega-menu to see the
 * available browse dimensions.
 */
export default function DiscoveryGrid({ title, subtitle, accent, items, viewAllHref }: DiscoveryGridProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: brand.bgCard, border: `1px solid ${brand.textMuted}15` }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
          <p className="mt-0.5 text-xs" style={{ color: brand.textMuted }}>
            {subtitle}
          </p>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-xs font-semibold transition hover:opacity-80"
            style={{ color: accent }}
          >
            View all
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:brightness-125"
            style={{
              backgroundColor: `${accent}15`,
              color: accent,
              border: `1px solid ${accent}44`,
            }}
          >
            {item.icon && <span aria-hidden>{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
