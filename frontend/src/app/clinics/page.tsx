"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import ClinicCard from "@/components/ClinicCard";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

function buildTitle(params: URLSearchParams): string {
  const verified = params.get("verified");
  const location = params.get("location");
  const sort = params.get("sort");
  if (sort === "cheapest") return "Most Affordable Clinics";
  if (verified === "true") return "Verified Clinics";
  if (location) return `Clinics — ${location}`;
  return "UK Medical Cannabis Clinics";
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
  return `/clinics/?${qp.toString()}`;
}

interface ClinicData {
  id: number;
  name: string;
  location: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  specialties: string | null;
  consultation_fee_gbp: number | null;
  verified: boolean;
}

function ClinicsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);

  const title = buildTitle(searchParams);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<ClinicData[]>(buildApiUrl(searchParams));
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
        Specialist clinics issuing UK private prescriptions for medical cannabis.
      </p>

      {loading ? (
        <div className="py-16 text-center">
          <p style={{ color: brand.textMuted }}>Loading clinics...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p style={{ color: brand.textMuted }}>No clinics found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((c) => (
            <ClinicCard
              key={c.id}
              id={c.id}
              name={c.name}
              location={c.location}
              verified={c.verified}
              consultationFee={c.consultation_fee_gbp}
              logoUrl={c.logo_url}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function ClinicsListingPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<p style={{ color: brand.textMuted }}>Loading...</p>}>
          <ClinicsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
