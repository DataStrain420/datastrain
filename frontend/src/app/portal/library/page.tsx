"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

interface LibraryEntry {
  id: number;
  strain_name: string | null;
  batch_number: string | null;
  list_type: string;
  date_tried: string | null;
  notes: string | null;
  created_at: string;
}

type Tab = "tried" | "wishlist" | "favourite";

export default function LibraryPage() {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [tab, setTab] = useState<Tab>("tried");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiFetch<LibraryEntry[]>("/library/");
      setEntries(data);
    } catch (err: any) {
      console.error("[Library] Load error:", err.message);
      setError(err.message || "Failed to load library");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function removeEntry(id: number) {
    await apiFetch(`/library/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = entries.filter((e) => e.list_type === tab);

  const tabs: { key: Tab; label: string }[] = [
    { key: "tried", label: "Tried" },
    { key: "wishlist", label: "Wishlist" },
    { key: "favourite", label: "Favourites" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Library</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 p-4 text-sm text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === t.key
                ? "bg-green-900/40 text-green-400"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-gray-500">
              ({entries.filter((e) => e.list_type === t.key).length})
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && !error && (
          <p className="py-8 text-center text-gray-500">
            No entries in this list yet.
          </p>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-3"
          >
            <div>
              <span className="font-medium">
                {entry.strain_name || "Unknown strain"}
              </span>
              {entry.batch_number && (
                <span className="ml-2 font-mono text-xs text-gray-500">
                  {entry.batch_number}
                </span>
              )}
              {entry.date_tried && (
                <span className="ml-2 text-xs text-gray-500">
                  Tried: {new Date(entry.date_tried).toLocaleDateString()}
                </span>
              )}
              {entry.notes && (
                <p className="mt-1 text-sm text-gray-400">{entry.notes}</p>
              )}
            </div>
            <button
              onClick={() => removeEntry(entry.id)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
