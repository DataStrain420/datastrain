"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";

const C = brand;

interface Grower {
  id: number;
  name: string;
  country_of_origin: string;
}

interface Strain {
  id: number;
  name: string;
  strain_type: string;
  description: string | null;
  grower_id: number | null;
  grower_name: string | null;
  approved: boolean;
  created_at: string;
}

const inputStyle = {
  backgroundColor: C.bgDeep,
  border: `1px solid ${C.textMuted}33`,
} as const;

export default function AdminStrainsPage() {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [growers, setGrowers] = useState<Grower[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showGrowerForm, setShowGrowerForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    strain_type: "hybrid",
    description: "",
    grower_id: "",
  });
  const [growerForm, setGrowerForm] = useState({
    name: "",
    country_of_origin: "",
  });

  async function load() {
    const [s, g] = await Promise.all([
      adminFetch<Strain[]>("/strains/?approved="),
      adminFetch<Grower[]>("/admin/growers"),
    ]);
    setStrains(s);
    setGrowers(g);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateStrain(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/strains/", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        grower_id: form.grower_id ? parseInt(form.grower_id) : null,
      }),
    });
    setForm({ name: "", strain_type: "hybrid", description: "", grower_id: "" });
    setShowForm(false);
    load();
  }

  async function handleCreateGrower(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/admin/growers", {
      method: "POST",
      body: JSON.stringify({ ...growerForm, verified: true }),
    });
    setGrowerForm({ name: "", country_of_origin: "" });
    setShowGrowerForm(false);
    load();
  }

  async function handleApprove(id: number) {
    await adminFetch(`/strains/${id}/approve`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Strains</h2>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
            Full strain catalogue. Toggle the buttons on the right to add a new grower or strain.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGrowerForm(!showGrowerForm)}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:brightness-110"
            style={{
              borderColor: `${C.textMuted}33`,
              color: C.textMuted,
              backgroundColor: C.bgCard,
            }}
          >
            + Grower
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: C.primary, color: C.bgDeep }}
          >
            + Strain
          </button>
        </div>
      </header>

      {showGrowerForm && (
        <form
          onSubmit={handleCreateGrower}
          className="rounded-2xl p-5"
          style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}22` }}
        >
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
            New grower
          </h3>
          <div className="flex flex-wrap gap-3">
            <input
              placeholder="Grower name"
              value={growerForm.name}
              onChange={(e) => setGrowerForm({ ...growerForm, name: e.target.value })}
              required
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            <input
              placeholder="Country"
              value={growerForm.country_of_origin}
              onChange={(e) => setGrowerForm({ ...growerForm, country_of_origin: e.target.value })}
              required
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
          onSubmit={handleCreateStrain}
          className="rounded-2xl p-5"
          style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}22` }}
        >
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
            New strain
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Strain name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            <select
              value={form.strain_type}
              onChange={(e) => setForm({ ...form, strain_type: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            >
              <option value="indica">Indica</option>
              <option value="sativa">Sativa</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select
              value={form.grower_id}
              onChange={(e) => setForm({ ...form, grower_id: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            >
              <option value="">No grower</option>
              {growers.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: C.primary, color: C.bgDeep }}
          >
            Create strain
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["Name", "Type", "Grower", "Status", ""].map((h) => (
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
              {strains.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${C.textMuted}15` }}>
                  <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: C.textMuted }}>{s.strain_type}</td>
                  <td className="px-4 py-3" style={{ color: C.textMuted }}>{s.grower_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: s.approved ? `${C.primary}22` : `${C.secondary}22`,
                        color: s.approved ? C.primary : C.secondary,
                      }}
                    >
                      {s.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!s.approved && (
                      <button
                        onClick={() => handleApprove(s.id)}
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
