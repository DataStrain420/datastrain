"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";

const C = brand;

interface Pharmacy {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
}

const inputStyle = {
  backgroundColor: C.bgDeep,
  border: `1px solid ${C.textMuted}33`,
} as const;

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "" });

  async function load() {
    const data = await adminFetch<Pharmacy[]>("/pharmacies/");
    setPharmacies(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/pharmacies/", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ name: "", location: "" });
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Pharmacies</h2>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
            UK pharmacies that dispense medical cannabis under private prescription.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg px-4 py-2 text-sm font-bold transition hover:opacity-90"
          style={{ backgroundColor: C.primary, color: C.bgDeep }}
        >
          + Pharmacy
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl p-5"
          style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}22` }}
        >
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
            New pharmacy
          </h3>
          <div className="flex flex-wrap gap-3">
            <input
              placeholder="Pharmacy name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
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

      <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["Name", "Location", "Status"].map((h) => (
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
              {pharmacies.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.textMuted}15` }}>
                  <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                  <td className="px-4 py-3" style={{ color: C.textMuted }}>{p.location}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: p.is_active ? `${C.primary}22` : `${C.textMuted}22`,
                        color: p.is_active ? C.primary : C.textMuted,
                      }}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
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
