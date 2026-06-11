"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Strains</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGrowerForm(!showGrowerForm)}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
          >
            + Grower
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm hover:bg-green-700"
          >
            + Strain
          </button>
        </div>
      </div>

      {showGrowerForm && (
        <form
          onSubmit={handleCreateGrower}
          className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <h3 className="mb-3 font-semibold">New Grower</h3>
          <div className="flex gap-3">
            <input
              placeholder="Grower name"
              value={growerForm.name}
              onChange={(e) =>
                setGrowerForm({ ...growerForm, name: e.target.value })
              }
              required
              className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <input
              placeholder="Country"
              value={growerForm.country_of_origin}
              onChange={(e) =>
                setGrowerForm({
                  ...growerForm,
                  country_of_origin: e.target.value,
                })
              }
              required
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
          onSubmit={handleCreateStrain}
          className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <h3 className="mb-3 font-semibold">New Strain</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Strain name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <select
              value={form.strain_type}
              onChange={(e) =>
                setForm({ ...form, strain_type: e.target.value })
              }
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="indica">Indica</option>
              <option value="sativa">Sativa</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select
              value={form.grower_id}
              onChange={(e) =>
                setForm({ ...form, grower_id: e.target.value })
              }
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
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
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded bg-green-600 px-4 py-2 text-sm hover:bg-green-700"
          >
            Create Strain
          </button>
        </form>
      )}

      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-800 text-gray-400">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Grower</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {strains.map((s) => (
            <tr key={s.id} className="border-b border-gray-800/50">
              <td className="px-3 py-2 font-medium">{s.name}</td>
              <td className="px-3 py-2 capitalize">{s.strain_type}</td>
              <td className="px-3 py-2">{s.grower_name || "-"}</td>
              <td className="px-3 py-2">
                {s.approved ? (
                  <span className="text-green-400">Approved</span>
                ) : (
                  <span className="text-yellow-400">Pending</span>
                )}
              </td>
              <td className="px-3 py-2">
                {!s.approved && (
                  <button
                    onClick={() => handleApprove(s.id)}
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
