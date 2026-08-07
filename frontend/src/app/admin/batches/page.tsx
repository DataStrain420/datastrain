"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";

const C = brand;

interface Terpene {
  id: number;
  name: string;
}

interface Strain {
  id: number;
  name: string;
  approved: boolean;
}

interface Grower {
  id: number;
  name: string;
}

interface BatchTerpene {
  terpene_id: number;
  terpene_name: string;
  percentage: number;
}

interface Batch {
  id: number;
  strain_name: string | null;
  grower_name: string | null;
  batch_number: string;
  thc_percentage: number;
  cbd_percentage: number;
  tested_date: string;
  approved: boolean;
  terpene_profiles: BatchTerpene[];
}

const inputStyle = {
  backgroundColor: C.bgDeep,
  border: `1px solid ${C.textMuted}33`,
} as const;

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [growers, setGrowers] = useState<Grower[]>([]);
  const [terpenes, setTerpenes] = useState<Terpene[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showTerpeneForm, setShowTerpeneForm] = useState(false);
  const [form, setForm] = useState({
    strain_id: "",
    grower_id: "",
    batch_number: "",
    thc_percentage: "",
    cbd_percentage: "",
    tested_date: "",
    lab_report_url: "",
  });
  const [terpeneProfiles, setTerpeneProfiles] = useState<
    { terpene_id: string; percentage: string }[]
  >([]);
  const [newTerpene, setNewTerpene] = useState({ name: "", aroma_notes: "" });

  async function load() {
    const [b, s, g, t] = await Promise.all([
      adminFetch<Batch[]>("/batches/?approved="),
      adminFetch<Strain[]>("/strains/?approved=true"),
      adminFetch<Grower[]>("/admin/growers"),
      adminFetch<Terpene[]>("/admin/terpenes"),
    ]);
    setBatches(b);
    setStrains(s);
    setGrowers(g);
    setTerpenes(t);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/batches/", {
      method: "POST",
      body: JSON.stringify({
        strain_id: parseInt(form.strain_id),
        grower_id: parseInt(form.grower_id),
        batch_number: form.batch_number,
        thc_percentage: parseFloat(form.thc_percentage),
        cbd_percentage: parseFloat(form.cbd_percentage),
        tested_date: form.tested_date,
        lab_report_url: form.lab_report_url || null,
        terpene_profiles: terpeneProfiles
          .filter((tp) => tp.terpene_id && tp.percentage)
          .map((tp) => ({
            terpene_id: parseInt(tp.terpene_id),
            percentage: parseFloat(tp.percentage),
          })),
      }),
    });
    setForm({
      strain_id: "",
      grower_id: "",
      batch_number: "",
      thc_percentage: "",
      cbd_percentage: "",
      tested_date: "",
      lab_report_url: "",
    });
    setTerpeneProfiles([]);
    setShowForm(false);
    load();
  }

  async function handleCreateTerpene(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/admin/terpenes", {
      method: "POST",
      body: JSON.stringify(newTerpene),
    });
    setNewTerpene({ name: "", aroma_notes: "" });
    setShowTerpeneForm(false);
    load();
  }

  async function handleApprove(id: number) {
    await adminFetch(`/batches/${id}/approve`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Batches</h2>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
            Every tested batch on file, with grower, cannabinoid split and terpene profile.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTerpeneForm(!showTerpeneForm)}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:brightness-110"
            style={{
              borderColor: `${C.textMuted}33`,
              color: C.textMuted,
              backgroundColor: C.bgCard,
            }}
          >
            + Terpene
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: C.primary, color: C.bgDeep }}
          >
            + Batch
          </button>
        </div>
      </header>

      {showTerpeneForm && (
        <form
          onSubmit={handleCreateTerpene}
          className="rounded-2xl p-5"
          style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}22` }}
        >
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
            New terpene
          </h3>
          <div className="flex flex-wrap gap-3">
            <input
              placeholder="Name (e.g. Myrcene)"
              value={newTerpene.name}
              onChange={(e) => setNewTerpene({ ...newTerpene, name: e.target.value })}
              required
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            <input
              placeholder="Aroma notes"
              value={newTerpene.aroma_notes}
              onChange={(e) => setNewTerpene({ ...newTerpene, aroma_notes: e.target.value })}
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90"
              style={{ backgroundColor: C.primary, color: C.bgDeep }}
            >
              Create
            </button>
          </div>
        </form>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl p-5"
          style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}22` }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
            New batch
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={form.strain_id}
              onChange={(e) => setForm({ ...form, strain_id: e.target.value })}
              required
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            >
              <option value="">Select strain</option>
              {strains.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={form.grower_id}
              onChange={(e) => setForm({ ...form, grower_id: e.target.value })}
              required
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            >
              <option value="">Select grower</option>
              {growers.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Batch number (e.g. BLK-2026-003)"
              value={form.batch_number}
              onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
              required
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            <input
              type="date"
              value={form.tested_date}
              onChange={(e) => setForm({ ...form, tested_date: e.target.value })}
              required
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary, colorScheme: "dark" }}
            />
            <input
              type="number"
              placeholder="THC %"
              step="0.1"
              value={form.thc_percentage}
              onChange={(e) => setForm({ ...form, thc_percentage: e.target.value })}
              required
              className="rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            <input
              type="number"
              placeholder="CBD %"
              step="0.1"
              value={form.cbd_percentage}
              onChange={(e) => setForm({ ...form, cbd_percentage: e.target.value })}
              required
              className="rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Terpene profile
            </p>
            <div className="space-y-2">
              {terpeneProfiles.map((tp, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <select
                    value={tp.terpene_id}
                    onChange={(e) => {
                      const updated = [...terpeneProfiles];
                      updated[i].terpene_id = e.target.value;
                      setTerpeneProfiles(updated);
                    }}
                    className="min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2"
                    style={{ ...inputStyle, outlineColor: C.primary }}
                  >
                    <option value="">Select terpene</option>
                    {terpenes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="%"
                    step="0.01"
                    value={tp.percentage}
                    onChange={(e) => {
                      const updated = [...terpeneProfiles];
                      updated[i].percentage = e.target.value;
                      setTerpeneProfiles(updated);
                    }}
                    className="w-24 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
                    style={{ ...inputStyle, outlineColor: C.primary }}
                  />
                  <button
                    type="button"
                    onClick={() => setTerpeneProfiles(terpeneProfiles.filter((_, j) => j !== i))}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:brightness-110"
                    style={{ color: "#f87171", backgroundColor: "#f8717118" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setTerpeneProfiles([...terpeneProfiles, { terpene_id: "", percentage: "" }])
              }
              className="mt-2 text-xs font-semibold underline"
              style={{ color: C.secondary }}
            >
              + Add terpene
            </button>
          </div>

          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: C.primary, color: C.bgDeep }}
          >
            Create batch
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["Batch #", "Strain", "Grower", "THC%", "CBD%", "Terpenes", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
                    style={{ color: C.textMuted, backgroundColor: `${C.bgDeep}88` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} style={{ borderTop: `1px solid ${C.textMuted}15` }}>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-xs"
                      style={{
                        backgroundColor: C.bgDeep,
                        color: C.textMuted,
                        border: `1px solid ${C.textMuted}22`,
                      }}
                    >
                      {b.batch_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{b.strain_name || "—"}</td>
                  <td className="px-4 py-3" style={{ color: C.textMuted }}>{b.grower_name || "—"}</td>
                  <td className="px-4 py-3 text-white">{b.thc_percentage}%</td>
                  <td className="px-4 py-3 text-white">{b.cbd_percentage}%</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textMuted }}>
                    {b.terpene_profiles.map((t) => `${t.terpene_name} ${t.percentage}%`).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: b.approved ? `${C.primary}22` : `${C.secondary}22`,
                        color: b.approved ? C.primary : C.secondary,
                      }}
                    >
                      {b.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!b.approved && (
                      <button
                        onClick={() => handleApprove(b.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold transition hover:opacity-90"
                        style={{ backgroundColor: C.primary, color: C.bgDeep }}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
