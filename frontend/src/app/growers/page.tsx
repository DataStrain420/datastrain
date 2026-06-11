"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import GrowerCard from "@/components/GrowerCard";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

/* ── Page title logic ──────────────────────────────────────────────────────── */

function buildTitle(params: URLSearchParams): string {
  const sort = params.get("sort");
  const country = params.get("country");
  const verified = params.get("verified");

  if (sort === "top-rated") return "Top Rated Growers";
  if (sort === "most-strains") return "Growers with Most Strains";
  if (verified === "true") return "Verified Growers";
  if (country) return `Growers — ${country}`;
  return "All Growers";
}

function buildApiUrl(params: URLSearchParams): string {
  const qp = new URLSearchParams();
  qp.set("limit", "50");

  const sort = params.get("sort");
  const country = params.get("country");
  const verified = params.get("verified");

  if (sort) qp.set("sort", sort);
  if (country) qp.set("country", country);
  if (verified) qp.set("verified", verified);

  return `/growers/?${qp.toString()}`;
}

/* ── Inner component ───────────────────────────────────────────────────────── */

interface GrowerData {
  id: number;
  name: string;
  country_of_origin: string;
  website: string | null;
  logo_url: string | null;
  verified: boolean;
}

function GrowersContent() {
  const searchParams = useSearchParams();
  const [growers, setGrowers] = useState<GrowerData[]>([]);
  const [loading, setLoading] = useState(true);

  const title = buildTitle(searchParams);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<GrowerData[]>(buildApiUrl(searchParams));
        setGrowers(data);
      } catch {
        setGrowers([]);
      }
      setLoading(false);
    }
    load();
  }, [searchParams]);

  return (
    <>
      <h1 className="mb-8 text-3xl font-extrabold text-white">{title}</h1>

      {loading ? (
        <div className="py-16 text-center">
          <p style={{ color: brand.textMuted }}>Loading growers...</p>
        </div>
      ) : growers.length === 0 ? (
        <div className="py-16 text-center">
          <p style={{ color: brand.textMuted }}>No growers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {growers.map((g, i) => (
            <GrowerCard
              key={g.id}
              id={g.id}
              name={g.name}
              rank={i + 1}
              totalGrowers={growers.length}
              rating={0}
              logoUrl={g.logo_url}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Page wrapper ──────────────────────────────────────────────────────────── */

export default function GrowersListingPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<p style={{ color: brand.textMuted }}>Loading...</p>}>
          <GrowersContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
