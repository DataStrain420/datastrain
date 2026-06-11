"use client";

import { brand } from "@/lib/brand";

interface StrainTypeIconProps {
  type: string;
  size?: number;
  className?: string;
}

/**
 * Consistent strain type icons across the app:
 * - Sativa: left half of circle filled
 * - Indica: right half of circle filled
 * - Hybrid: full circle filled
 */
export default function StrainTypeIcon({ type, size = 16, className }: StrainTypeIconProps) {
  const color = typeColor(type);

  if (type === "sativa") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
        <path d="M12 2a10 10 0 0 0 0 20z" fill={color} />
      </svg>
    );
  }

  if (type === "indica") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
        <path d="M12 2a10 10 0 0 1 0 20z" fill={color} />
      </svg>
    );
  }

  // Hybrid — full circle
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="10" fill={color} stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function typeColor(type: string): string {
  switch (type) {
    case "sativa": return "#f59e0b";
    case "indica": return brand.tertiary;
    case "hybrid": return "#ec4899";
    default: return brand.textMuted;
  }
}

export function typeLabel(type: string): string {
  switch (type) {
    case "sativa": return "Sativa";
    case "indica": return "Indica";
    case "hybrid": return "Hybrid";
    default: return type;
  }
}
