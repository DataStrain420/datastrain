"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export default function StarRating({ label, value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-white">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hover || value);
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
    </div>
  );
}
