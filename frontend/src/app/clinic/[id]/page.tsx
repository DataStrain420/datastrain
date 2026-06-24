"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

interface Clinic {
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

function parseSpecialties(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export default function ClinicProfilePage() {
  const { id } = useParams();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await apiFetch<Clinic>(`/clinics/${id}`);
        setClinic(c);
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

  if (!clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: brand.textMuted }}>Clinic not found.</p>
      </div>
    );
  }

  const specialties = parseSpecialties(clinic.specialties);

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
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: brand.textMuted }}>
                {clinic.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">{clinic.name}</h1>
              {clinic.verified && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${brand.primary}20`, color: brand.primary }}
                >
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: brand.textMuted }}>
              {clinic.location}
            </p>
            {clinic.website && (
              <a
                href={clinic.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm transition hover:underline"
                style={{ color: brand.secondary }}
              >
                {clinic.website}
              </a>
            )}
          </div>
        </div>

        {(clinic.consultation_fee_gbp !== null || specialties.length > 0) && (
          <div
            className="mb-6 grid gap-4 rounded-2xl p-6 sm:grid-cols-2"
            style={{ backgroundColor: brand.bgCard }}
          >
            {clinic.consultation_fee_gbp !== null && (
              <div>
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
                  Initial Consultation
                </h3>
                <p className="text-lg font-bold" style={{ color: brand.secondary }}>
                  £{clinic.consultation_fee_gbp}
                </p>
              </div>
            )}
            {specialties.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-md px-2 py-0.5 text-xs"
                      style={{ backgroundColor: brand.bgDeep, color: brand.textMuted }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {clinic.description && (
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: brand.bgCard }}
          >
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
              About
            </h2>
            <p className="text-sm leading-relaxed text-white">{clinic.description}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
