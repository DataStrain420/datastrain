"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import StrainCard, { CardData } from "@/components/StrainCard";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

interface Grower {
  id: number;
  name: string;
  country_of_origin: string;
  website: string | null;
  logo_url: string | null;
  phone_number: string | null;
  address_street: string | null;
  address_city: string | null;
  address_postcode: string | null;
  address_country: string | null;
  verified: boolean;
}

interface StrainBasic {
  id: number;
  name: string;
  strain_type: string;
  aliases: string | null;
}

export default function GrowerProfilePage() {
  const { id } = useParams();
  const [grower, setGrower] = useState<Grower | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const g = await apiFetch<Grower>(`/growers/${id}`);
        setGrower(g);

        // Get batches from this grower
        const batches = await apiFetch<{ id: number }[]>(
          `/batches/?grower_id=${id}&approved=true`
        );
        const cardData = await Promise.all(
          batches.slice(0, 12).map((b) =>
            apiFetch<CardData>(`/batches/${b.id}/card`).catch(() => null)
          )
        );
        setCards(cardData.filter((c): c is CardData => c !== null));
      } catch {
        // grower not found
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

  if (!grower) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: brand.textMuted }}>Grower not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Grower header */}
        <div
          className="mb-8 rounded-2xl p-6"
          style={{ backgroundColor: brand.bgCard }}
        >
          <div className="flex items-start gap-6">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ backgroundColor: brand.bgDeep }}
            >
              {grower.logo_url ? (
                <img src={grower.logo_url} alt={grower.name} className="h-full w-full object-contain p-2" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: brand.textMuted }}>
                  {grower.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white">{grower.name}</h1>
                {grower.verified && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: `${brand.primary}20`, color: brand.primary }}
                  >
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm" style={{ color: brand.textMuted }}>
                {grower.country_of_origin}
              </p>
              {grower.website && (
                <a
                  href={grower.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm transition hover:underline"
                  style={{ color: brand.secondary }}
                >
                  {grower.website}
                </a>
              )}
            </div>
          </div>

          {/* Contact + address — only renders the rows that have data so a
              partially-filled grower doesn't show empty placeholders. */}
          {(grower.phone_number || grower.address_street || grower.address_city
            || grower.address_postcode || grower.address_country) && (
            <div
              className="mt-5 grid gap-4 rounded-xl p-4 sm:grid-cols-2"
              style={{ backgroundColor: brand.bgDeep, border: `1px solid ${brand.textMuted}22` }}
            >
              {grower.phone_number && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
                    Contact
                  </p>
                  <a
                    href={`tel:${grower.phone_number.replace(/\s+/g, "")}`}
                    className="mt-1 block text-sm font-semibold transition hover:underline"
                    style={{ color: brand.secondary }}
                  >
                    {grower.phone_number}
                  </a>
                </div>
              )}
              {(grower.address_street || grower.address_city
                || grower.address_postcode || grower.address_country) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>
                    Address
                  </p>
                  <address className="mt-1 not-italic text-sm leading-snug text-white">
                    {grower.address_street && <>{grower.address_street}<br /></>}
                    {grower.address_city && <>{grower.address_city}<br /></>}
                    {grower.address_postcode && <>{grower.address_postcode}<br /></>}
                    {grower.address_country}
                  </address>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Strains by this grower */}
        <h2 className="mb-6 text-xl font-bold text-white">
          Strains by {grower.name} ({cards.length})
        </h2>

        {cards.length === 0 ? (
          <p className="py-8 text-center" style={{ color: brand.textMuted }}>
            No approved strains yet.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {cards.map((card) => (
              <StrainCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
