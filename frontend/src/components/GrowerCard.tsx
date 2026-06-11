"use client";

import Link from "next/link";
import { brand } from "@/lib/brand";

interface GrowerCardProps {
  id: number;
  name: string;
  rank: number;
  totalGrowers: number;
  rating: number;
  logoUrl?: string | null;
}

function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="text-base"
          style={{ color: star <= Math.round(rating) ? brand.primary : `${brand.textMuted}44` }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/**
 * Demo placeholder logos — generates a deterministic abstract SVG logo from
 * the grower's name via DiceBear's `shapes` style, themed with the brand
 * palette. Used when the backend hasn't supplied a real `logoUrl` yet, so
 * the Top Rated Growers section reads as visually populated. Swap for real
 * uploaded logos once the admin tooling for that lands.
 */
function demoLogoUrl(name: string): string {
  const seed = encodeURIComponent(name);
  // Brand-aligned gradient background + a couple of darker accents for shapes.
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=0ad6da,51ed92,00eeb2&backgroundType=gradientLinear&backgroundRotation=0,45,90,135,180,225,270,315&shape1Color=0d2638&shape2Color=14202b&shape3Color=ffffff`;
}

export default function GrowerCard({ id, name, rank, totalGrowers, rating, logoUrl }: GrowerCardProps) {
  const displayLogo = logoUrl || demoLogoUrl(name);
  return (
    <Link
      href={`/grower/${id}`}
      className="flex flex-col items-center rounded-xl p-4 transition hover:brightness-110"
      style={{ backgroundColor: brand.bgCard }}
    >
      {/* Logo area */}
      <div
        className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: `${brand.bgDeep}` }}
      >
        <img
          src={displayLogo}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Last-resort fallback if the demo service hiccups: hide the
            // broken image and show initials in its place.
            const img = e.currentTarget;
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent && !parent.querySelector("[data-initials]")) {
              const span = document.createElement("span");
              span.setAttribute("data-initials", "");
              span.className = "text-xl font-bold";
              span.style.color = brand.textMuted;
              span.textContent = name.slice(0, 2).toUpperCase();
              parent.appendChild(span);
            }
          }}
        />
      </div>

      {/* Name */}
      <p className="mb-2 text-center text-sm font-semibold text-white">{name}</p>

      {/* Rank — brand hexagon with the rank number inside */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="relative flex h-7 w-7 items-center justify-center">
          <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full" aria-hidden>
            <path
              d="M219.9,66.7l-84,-47.4c-4.888,-2.799-10.912,-2.799-15.8,0l-84,47.4c-4.997,2.885-8.089,8.23-8.1,14l0,94.6c0.011,5.77,3.103,11.115,8.1,14l84,47.4c4.888,2.799,10.912,2.799,15.8,0l84,-47.4c4.997,-2.885,8.089,-8.23,8.1,-14l0,-94.6c-0.011,-5.77-3.103,-11.115-8.1,-14Z"
              fill={brand.primary}
            />
          </svg>
          <span
            className="relative z-10 text-xs font-black"
            style={{ color: brand.bgDeep }}
          >
            {rank}
          </span>
        </div>
        <span className="text-xs" style={{ color: brand.textMuted }}>
          of {totalGrowers} Growers
        </span>
      </div>

      {/* Stars */}
      <ReadOnlyStars rating={rating} />
    </Link>
  );
}
