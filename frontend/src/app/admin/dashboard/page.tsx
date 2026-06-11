"use client";

import { adminFetch } from "@/lib/admin-api";
import { useEffect, useState } from "react";

interface Analytics {
  total_users: number;
  total_reviews: number;
  pending_reviews: number;
  total_strains: number;
  total_batches: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    adminFetch<Analytics>("/admin/analytics").then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <p className="text-gray-400">Loading analytics...</p>;
  }

  const stats = [
    { label: "Total Users", value: data.total_users },
    { label: "Total Reviews", value: data.total_reviews },
    { label: "Pending Reviews", value: data.pending_reviews, highlight: true },
    { label: "Total Strains", value: data.total_strains },
    { label: "Total Batches", value: data.total_batches },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-800 bg-gray-900 p-4"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p
              className={`mt-1 text-3xl font-bold ${stat.highlight && stat.value > 0 ? "text-yellow-400" : "text-white"}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
