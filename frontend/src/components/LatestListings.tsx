"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

interface BatchRow {
  id: number;
  strain_id: number;
  strain_name: string | null;
  grower_id: number;
  grower_name: string | null;
  batch_number: string;
  thc_percentage: number;
  cbd_percentage: number;
  tested_date: string; // YYYY-MM-DD from date field
  irradiated: boolean | null;
  created_at: string;
}

function relativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const days = Math.floor((now - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Homepage "Latest Batches Added" — a compact live-updating table of the
 * newest approved batches on the platform. Mirrors the "Latest New Listings"
 * ticker on MedBud that signals "this database is alive". Uses the existing
 * /batches endpoint (already sorted by created_at DESC) with a small limit.
 */
export default function LatestListings() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<BatchRow[]>("/batches/?approved=true&limit=8")
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ backgroundColor: brand.bgCard, border: `1px solid ${brand.textMuted}15` }}
    >
      <div
        className="flex items-baseline justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${brand.textMuted}15` }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: brand.primary }} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Latest Batches Added
          </h3>
        </div>
        <Link
          href="/strains?sort=newest"
          className="text-xs font-semibold transition hover:opacity-80"
          style={{ color: brand.primary }}
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="p-6 text-center text-sm" style={{ color: brand.textMuted }}>
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-sm" style={{ color: brand.textMuted }}>
          No batches yet.
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: `${brand.textMuted}10` }}>
          {rows.map((r) => (
            <Link
              key={r.id}
              href={`/batch/${r.id}`}
              className="grid grid-cols-12 items-center gap-3 px-5 py-3 text-sm transition hover:bg-white/5"
              style={{ borderColor: `${brand.textMuted}10` }}
            >
              <div className="col-span-5 min-w-0 md:col-span-5">
                <div className="truncate font-semibold text-white">
                  {r.strain_name || "Unknown strain"}
                </div>
                <div className="mt-0.5 truncate text-xs" style={{ color: brand.textMuted }}>
                  {r.grower_name || "Unknown grower"} · {r.batch_number}
                </div>
              </div>
              <div className="col-span-3 flex items-center gap-2 md:col-span-2">
                {r.irradiated === true && (
                  <span title="Irradiated" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs" style={{ backgroundColor: "#f59e0b22", color: "#f59e0b" }}>
                    ☢
                  </span>
                )}
                {r.irradiated === false && (
                  <span title="Non-irradiated" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs" style={{ backgroundColor: `${brand.primary}22`, color: brand.primary }}>
                    {"\u{1F33F}"}
                  </span>
                )}
              </div>
              <div className="col-span-4 flex items-center justify-end gap-3 md:col-span-3 md:justify-start">
                <span className="text-right md:text-left">
                  <span className="text-white">THC </span>
                  <span style={{ color: brand.secondary }}>{r.thc_percentage}%</span>
                </span>
                <span className="hidden text-right md:inline md:text-left">
                  <span className="text-white">CBD </span>
                  <span style={{ color: brand.secondary }}>{r.cbd_percentage}%</span>
                </span>
              </div>
              <div
                className="col-span-12 text-right text-xs md:col-span-2"
                style={{ color: brand.textMuted }}
              >
                {relativeDate(r.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
