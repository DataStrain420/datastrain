"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";

const C = brand;

interface Analytics {
  total_users: number;
  total_reviews: number;
  pending_reviews: number;
  total_strains: number;
  total_batches: number;
}

interface StatTileProps {
  label: string;
  value: number;
  accent: string;
  href?: string;
  highlight?: boolean;
}

function StatTile({ label, value, accent, href, highlight }: StatTileProps) {
  const body = (
    <div
      className="group relative overflow-hidden rounded-2xl p-5 transition hover:brightness-110"
      style={{
        backgroundColor: C.bgCard,
        border: `1px solid ${highlight && value > 0 ? `${accent}66` : `${C.textMuted}15`}`,
        boxShadow: highlight && value > 0 ? `0 0 24px ${accent}22` : undefined,
      }}
    >
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
        {label}
      </p>
      <p
        className="mt-2 text-3xl font-extrabold"
        style={{ color: highlight && value > 0 ? accent : "white" }}
      >
        {value.toLocaleString()}
      </p>
      {href && (
        <p className="mt-2 text-xs font-semibold" style={{ color: accent }}>
          Open →
        </p>
      )}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    adminFetch<Analytics>("/admin/analytics").then(setData).catch(console.error);
  }, []);

  if (!data) {
    return (
      <p className="text-sm" style={{ color: C.textMuted }}>
        Loading analytics...
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile
            label="Pending Reviews"
            value={data.pending_reviews}
            accent={C.secondary}
            href="/admin/queue"
            highlight
          />
          <StatTile label="Total Users" value={data.total_users} accent={C.primary} />
          <StatTile label="Total Reviews" value={data.total_reviews} accent={C.primary} />
          <StatTile label="Total Strains" value={data.total_strains} accent={C.tertiary} href="/admin/strains" />
          <StatTile label="Total Batches" value={data.total_batches} accent="#3b82f6" href="/admin/batches" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
          Jump to
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/admin/queue"
            className="flex items-center justify-between gap-4 rounded-2xl p-5 transition hover:brightness-110"
            style={{
              backgroundColor: `${C.secondary}12`,
              border: `1px solid ${C.secondary}44`,
            }}
          >
            <div>
              <p className="text-base font-bold text-white">Moderation Queue</p>
              <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
                Approve or reject pending reviews, strains and batches.
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold"
              style={{ backgroundColor: C.secondary, color: C.bgDeep }}
            >
              Open →
            </span>
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center justify-between gap-4 rounded-2xl p-5 transition hover:brightness-110"
            style={{
              backgroundColor: C.bgCard,
              border: `1px solid ${C.textMuted}22`,
            }}
          >
            <div>
              <p className="text-base font-bold text-white">Reports</p>
              <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
                Community reports on reviews, comments and profiles.
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold"
              style={{ backgroundColor: `${C.textMuted}22`, color: C.textMuted }}
            >
              Open →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
