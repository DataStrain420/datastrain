"use client";

import { brand } from "@/lib/brand";
import { AVATAR_PRESETS } from "@/lib/avatars";

const C = brand;

interface AvatarPickerProps {
  /** Currently selected URL (saved in user.avatar_url). Used to highlight the active tile. */
  value: string | null;
  onChange: (url: string) => void;
}

/**
 * Grid of preset profile icons. Replaces the old custom-upload UI — users
 * pick one tile, the URL is bubbled up to the parent form, and the parent
 * PATCHes /users/me with the new avatar_url.
 */
export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: C.textMuted }}>
        Profile icon
      </p>
      <div
        className="grid gap-2 rounded-lg p-3"
        style={{
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          backgroundColor: C.bgDeep,
          border: `1px solid ${C.textMuted}33`,
        }}
      >
        {AVATAR_PRESETS.map((p) => {
          const selected = value === p.url || value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.url)}
              aria-label={`Pick avatar ${p.id}`}
              aria-pressed={selected}
              className="relative aspect-square overflow-hidden rounded-full transition hover:scale-105"
              style={{
                backgroundColor: C.bgCard,
                border: selected
                  ? `2.5px solid ${C.primary}`
                  : `1.5px solid ${C.textMuted}33`,
                boxShadow: selected ? `0 0 0 3px ${C.primary}33` : undefined,
              }}
            >
              {/* DiceBear SVGs scale crisply; <img> is fine here */}
              <img
                src={p.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {selected && (
                <span
                  className="absolute inset-x-0 bottom-0 flex h-4 items-center justify-center text-[9px] font-black"
                  style={{
                    backgroundColor: `${C.primary}cc`,
                    color: C.bgDeep,
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
