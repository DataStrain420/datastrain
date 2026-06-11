"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Batches</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTerpeneForm(!showTerpeneForm)}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
          >
            + Terpene
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm hover:bg-green-700"
          >
            + Batch
          </button>
        </div>
      </div>

      {showTerpeneForm && (
        <form
          onSubmit={handleCreateTerpene}
          className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <h3 className="mb-3 font-semibold">New Terpene</h3>
          <div className="flex gap-3">
            <input
              placeholder="Name (e.g. Myrcene)"
              value={newTerpene.name}
              onChange={(e) =>
                setNewTerpene({ ...newTerpene, name: e.target.value })
              }
              required
              className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <input
              placeholder="Aroma notes"
              value={newTerpene.aroma_notes}
              onChange={(e) =>
                setNewTerpene({ ...newTerpene, aroma_notes: e.target.value })
              }
              className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm hover:bg-green-700"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <h3 className="mb-3 font-semibold">New Batch</h3>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.strain_id}
              onChange={(e) =>
                setForm({ ...form, strain_id: e.target.value })
              }
              required
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
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
              onChange={(e) =>
                setForm({ ...form, grower_id: e.target.value })
              }
              required
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
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
              onChange={(e) =>
                setForm({ ...form, batch_number: e.target.value })
              }
              required
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.tested_date}
              onChange={(e) =>
                setForm({ ...form, tested_date: e.target.value })
              }
              required
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="THC %"
              step="0.1"
              value={form.thc_percentage}
              onChange={(e) =>
                setForm({ ...form, thc_percentage: e.target.value })
              }
              required
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="CBD %"
              step="0.1"
              value={form.cbd_percentage}
              onChange={(e) =>
                setForm({ ...form, cbd_percentage: e.target.value })
              }
              required
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3">
            <p className="mb-2 text-sm text-gray-400">Terpene Profile</p>
            {terpeneProfiles.map((tp, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <select
                  value={tp.terpene_id}
                  onChange={(e) => {
                    const updated = [...terpeneProfiles];
                    updated[i].terpene_id = e.target.value;
                    setTerpeneProfiles(updated);
                  }}
                  className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
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
                  className="w-24 rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTerpeneProfiles(terpeneProfiles.filter((_, j) => j !== i))
                  }
                  className="text-red-400 hover:text-red-300"
                >
                  x
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setTerpeneProfiles([
                  ...terpeneProfiles,
                  { terpene_id: "", percentage: "" },
                ])
              }
              className="text-sm text-green-400 hover:underline"
            >
              + Add terpene
            </button>
          </div>

          <button
            type="submit"
            className="mt-3 rounded bg-green-600 px-4 py-2 text-sm hover:bg-green-700"
          >
            Create Batch
          </button>
        </form>
      )}

      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-800 text-gray-400">
          <tr>
            <th className="px-3 py-2">Batch #</th>
            <th className="px-3 py-2">Strain</th>
            <th className="px-3 py-2">Grower</th>
            <th className="px-3 py-2">THC%</th>
            <th className="px-3 py-2">CBD%</th>
            <th className="px-3 py-2">Terpenes</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <tr key={b.id} className="border-b border-gray-800/50">
              <td className="px-3 py-2 font-mono text-xs">{b.batch_number}</td>
              <td className="px-3 py-2">{b.strain_name}</td>
              <td className="px-3 py-2">{b.grower_name}</td>
              <td className="px-3 py-2">{b.thc_percentage}%</td>
              <td className="px-3 py-2">{b.cbd_percentage}%</td>
              <td className="px-3 py-2 text-xs text-gray-400">
                {b.terpene_profiles
                  .map((t) => `${t.terpene_name} ${t.percentage}%`)
                  .join(", ") || "-"}
              </td>
              <td className="px-3 py-2">
                {b.approved ? (
                  <span className="text-green-400">Approved</span>
                ) : (
                  <span className="text-yellow-400">Pending</span>
                )}
              </td>
              <td className="px-3 py-2">
                {!b.approved && (
                  <button
                    onClick={() => handleApprove(b.id)}
                    className="rounded bg-green-700 px-3 py-1 text-xs hover:bg-green-600"
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
  );
}
