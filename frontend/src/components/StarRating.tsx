"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  words?: [string, string, string, string, string];
}

const DEFAULT_WORDS: [string, string, string, string, string] = [
  "Poor",
  "Fair",
  "Good",
  "Great",
  "Excellent",
];

export default function StarRating({ label, value, onChange, words = DEFAULT_WORDS }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const wordLabel = active > 0 ? words[active - 1] : "—";

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-white">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= active;
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="text-2xl transition-transform hover:scale-110"
                style={{ color: filled ? brand.primary : `${brand.textMuted}55` }}
              >
                ★
              </button>
            );
          })}
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: active > 0 ? brand.primary : brand.textMuted }}
        >
          {wordLabel}
        </span>
      </div>
    </div>
  );
}
