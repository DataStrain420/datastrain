"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import PharmacyCard from "@/components/PharmacyCard";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

function buildTitle(params: URLSearchParams): string {
  const verified = params.get("verified");
  const location = params.get("location");
  if (verified === "true") return "Verified Pharmacies";
  if (location) return `Pharmacies — ${location}`;
  return "UK Medical Cannabis Pharmacies";
}

function buildApiUrl(params: URLSearchParams): string {
  const qp = new URLSearchParams();
  qp.set("limit", "50");
  const verified = params.get("verified");
  const location = params.get("location");
  const sort = params.get("sort");
  if (verified) qp.set("verified", verified);
  if (location) qp.set("location", location);
  if (sort) qp.set("sort", sort);
  return `/pharmacies/?${qp.toString()}`;
}

interface PharmacyData {
  id: number;
  name: string;
  location: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  verified: boolean;
}

function PharmaciesContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<PharmacyData[]>([]);
  const [loading, setLoading] = useState(true);

  const title = buildTitle(searchParams);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<PharmacyData[]>(buildApiUrl(searchParams));
        setItems(data);
      } catch {
        setItems([]);
      }
      setLoading(false);
    }
    load();
  }, [searchParams]);

  return (
    <>
      <h1 className="mb-2 text-3xl font-extrabold text-white">{title}</h1>
      <p className="mb-8 text-sm" style={{ color: brand.textMuted }}>
        Specialist pharmacies dispensing medical cannabis to UK patients via private prescription.
      </p>

      {loading ? (
        <div className="py-16 text-center">
          <p style={{ color: brand.textMuted }}>Loading pharmacies...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p style={{ color: brand.textMuted }}>No pharmacies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((p) => (
            <PharmacyCard
              key={p.id}
              id={p.id}
              name={p.name}
              location={p.location}
              verified={p.verified}
              logoUrl={p.logo_url}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function PharmaciesListingPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<p style={{ color: brand.textMuted }}>Loading...</p>}>
          <PharmaciesContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
