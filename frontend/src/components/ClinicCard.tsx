"use client";

import Link from "next/link";
import { brand } from "@/lib/brand";

interface ClinicCardProps {
  id: number;
  name: string;
  location: string;
  verified: boolean;
  consultationFee: number | null;
  logoUrl?: string | null;
}

function demoLogoUrl(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=0ad6da,51ed92,00eeb2&backgroundType=gradientLinear&backgroundRotation=0,45,90,135,180,225,270,315&shape1Color=0d2638&shape2Color=14202b&shape3Color=ffffff`;
}

export default function ClinicCard({ id, name, location, verified, consultationFee, logoUrl }: ClinicCardProps) {
  const displayLogo = logoUrl || demoLogoUrl(name);
  return (
    <Link
      href={`/clinic/${id}`}
      className="flex flex-col items-center rounded-xl p-4 text-center transition hover:brightness-110"
      style={{ backgroundColor: brand.bgCard }}
    >
      <div
        className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: brand.bgDeep }}
      >
        <img src={displayLogo} alt={name} className="h-full w-full object-cover" />
      </div>
      <p className="mb-1 text-sm font-semibold text-white">{name}</p>
      <p className="text-xs" style={{ color: brand.textMuted }}>{location}</p>
      {consultationFee !== null && (
        <p className="mt-1 text-xs font-semibold" style={{ color: brand.secondary }}>
          £{consultationFee} initial consult
        </p>
      )}
      {verified && (
        <span
          className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${brand.primary}20`, color: brand.primary }}
        >
          Verified
        </span>
      )}
    </Link>
  );
}
