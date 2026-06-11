"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";

interface Pharmacy {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
}

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pharmacies</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm hover:bg-green-700"
        >
          + Pharmacy
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <div className="flex gap-3">
            <input
              placeholder="Pharmacy name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
            />
            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
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

      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-800 text-gray-400">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Location</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {pharmacies.map((p) => (
            <tr key={p.id} className="border-b border-gray-800/50">
              <td className="px-3 py-2">{p.name}</td>
              <td className="px-3 py-2">{p.location}</td>
              <td className="px-3 py-2">
                {p.is_active ? (
                  <span className="text-green-400">Active</span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
