"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { brand } from "@/lib/brand";
import clsx from "clsx";

interface Report {
  id: number;
  user_id: number | null;
  username: string | null;
  report_type: "bug" | "feature" | "feedback" | "other";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string | null;
  page_path: string | null;
  screenshot_urls: string[];
  user_agent: string | null;
  status: "open" | "in_progress" | "closed";
  created_at: string;
}

const STATUS_FILTERS: { value: "" | Report["status"]; label: string }[] = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "closed", label: "Closed" },
];

const TYPE_COLOR: Record<Report["report_type"], string> = {
  bug: "#f87171",
  feature: brand.secondary,
  feedback: brand.primary,
  other: brand.textMuted,
};

const SEVERITY_COLOR: Record<Report["severity"], string> = {
  low: brand.textMuted,
  medium: "#fbbf24",
  high: "#fb923c",
  critical: "#dc2626",
};

const STATUS_COLOR: Record<Report["status"], string> = {
  open: brand.primary,
  in_progress: brand.secondary,
  closed: brand.textMuted,
};

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveImageUrl(url: string): string {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace(/\/api\/v1\/?$/, "");
  return url.startsWith("http") ? url : `${apiBase}${url}`;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | Report["status"]>("");
  const [expanded, setExpanded] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const qp = new URLSearchParams({ limit: "100" });
      if (statusFilter) qp.set("status", statusFilter);
      const data = await adminFetch<Report[]>(`/reports/?${qp.toString()}`);
      setReports(data);
    } catch {
      setReports([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function updateStatus(id: number, status: Report["status"]) {
    try {
      const updated = await adminFetch<Report>(`/reports/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      // silently fail — admin will see the row didn't change
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Reports</h2>
          <p className="mt-1 text-sm" style={{ color: brand.textMuted }}>
            Community bug reports, feedback and feature requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              onClick={() => setStatusFilter(f.value)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                statusFilter === f.value ? "text-white" : "hover:text-white",
              )}
              style={{
                backgroundColor: statusFilter === f.value ? `${brand.primary}33` : brand.bgCard,
                border: `1px solid ${statusFilter === f.value ? brand.primary : `${brand.textMuted}33`}`,
                color: statusFilter === f.value ? brand.primary : brand.textMuted,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p style={{ color: brand.textMuted }}>Loading reports...</p>
      ) : reports.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: brand.bgCard, border: `1px solid ${brand.textMuted}15` }}
        >
          <p className="text-sm" style={{ color: brand.textMuted }}>
            No reports {statusFilter ? `with status "${statusFilter}"` : "yet"}.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: brand.bgCard, border: `1px solid ${brand.textMuted}15` }}>
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: brand.bgCard }}>
              <tr className="text-left">
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Type</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Severity</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Title</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Page</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Reporter</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Date</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <FragmentRow
                  key={r.id}
                  report={r}
                  expanded={expanded === r.id}
                  onToggle={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
                  onStatusChange={(s) => updateStatus(r.id, s)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  report,
  expanded,
  onToggle,
  onStatusChange,
}: {
  report: Report;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: Report["status"]) => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition"
        style={{
          backgroundColor: brand.bgDeep,
          borderTop: `1px solid ${brand.textMuted}15`,
        }}
      >
        <td className="px-3 py-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${TYPE_COLOR[report.report_type]}22`, color: TYPE_COLOR[report.report_type] }}
          >
            {report.report_type}
          </span>
        </td>
        <td className="px-3 py-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${SEVERITY_COLOR[report.severity]}22`, color: SEVERITY_COLOR[report.severity] }}
          >
            {report.severity}
          </span>
        </td>
        <td className="px-3 py-2 font-semibold text-white">{report.title}</td>
        <td className="px-3 py-2 font-mono text-xs" style={{ color: brand.textMuted }}>
          {report.page_path || "—"}
        </td>
        <td className="px-3 py-2 text-xs" style={{ color: brand.textMuted }}>
          {report.username ? (
            <a
              href={`/user/${report.username}`}
              onClick={(e) => e.stopPropagation()}
              className="transition hover:underline"
              style={{ color: brand.primary }}
            >
              {report.username}
            </a>
          ) : (
            <span style={{ color: brand.textMuted }}>anonymous</span>
          )}
        </td>
        <td className="px-3 py-2 text-xs" style={{ color: brand.textMuted }}>
          {formatDate(report.created_at)}
        </td>
        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
          <select
            value={report.status}
            onChange={(e) => onStatusChange(e.target.value as Report["status"])}
            className="rounded-md px-2 py-1 text-xs font-semibold focus:outline-none"
            style={{
              backgroundColor: `${STATUS_COLOR[report.status]}22`,
              color: STATUS_COLOR[report.status],
              border: `1px solid ${STATUS_COLOR[report.status]}55`,
            }}
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </td>
      </tr>
      {expanded && (
        <tr style={{ backgroundColor: brand.bgCard, borderTop: `1px solid ${brand.textMuted}15` }}>
          <td colSpan={7} className="px-5 py-4">
            {report.description && (
              <>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
                  Description
                </p>
                <p className="mb-3 whitespace-pre-wrap text-sm text-white">{report.description}</p>
              </>
            )}
            {report.screenshot_urls.length > 0 && (
              <>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
                  Attachments
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {report.screenshot_urls.map((u, i) => {
                    const src = resolveImageUrl(u);
                    return (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                        <img
                          src={src}
                          alt={`Screenshot ${i + 1}`}
                          className="h-24 w-24 rounded-md object-cover transition hover:brightness-110"
                          style={{ border: `1px solid ${brand.textMuted}33` }}
                        />
                      </a>
                    );
                  })}
                </div>
              </>
            )}
            {report.user_agent && (
              <>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
                  User agent
                </p>
                <p className="font-mono text-[11px]" style={{ color: brand.textMuted }}>
                  {report.user_agent}
                </p>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
