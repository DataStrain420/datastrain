"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

interface Pharmacy {
  id: number;
  name: string;
  location: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  verified: boolean;
}

export default function PharmacyProfilePage() {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await apiFetch<Pharmacy>(`/pharmacies/${id}`);
        setPharmacy(p);
      } catch {
        // not found
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: brand.textMuted }}>Loading...</p>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: brand.textMuted }}>Pharmacy not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div
          className="mb-6 flex items-center gap-6 rounded-2xl p-6"
          style={{ backgroundColor: brand.bgCard }}
        >
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: brand.bgDeep }}
          >
            {pharmacy.logo_url ? (
              <img src={pharmacy.logo_url} alt={pharmacy.name} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: brand.textMuted }}>
                {pharmacy.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">{pharmacy.name}</h1>
              {pharmacy.verified && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${brand.primary}20`, color: brand.primary }}
                >
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: brand.textMuted }}>
              {pharmacy.location}
            </p>
            {pharmacy.website && (
              <a
                href={pharmacy.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm transition hover:underline"
                style={{ color: brand.secondary }}
              >
                {pharmacy.website}
              </a>
            )}
          </div>
        </div>

        {pharmacy.description && (
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: brand.bgCard }}
          >
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
              About
            </h2>
            <p className="text-sm leading-relaxed text-white">{pharmacy.description}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
