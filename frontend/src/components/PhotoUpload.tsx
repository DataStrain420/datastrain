"use client";

import { useRef } from "react";
import { brand } from "@/lib/brand";

interface PhotoUploadProps {
  label: string;
  sublabel: string;
  file: File | null;
  onChange: (f: File) => void;
  icon?: string;
  hint?: string;
}

export default function PhotoUpload({ label, sublabel, file, onChange, icon = "📷", hint }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition hover:opacity-90"
      style={{
        borderColor: file ? brand.primary : `${brand.textMuted}44`,
        backgroundColor: file ? `${brand.primary}0f` : `${brand.bgCard}66`,
      }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt={label}
            className="absolute inset-1 rounded-lg object-cover"
            style={{ width: "calc(100% - 8px)", height: "calc(100% - 8px)" }}
          />
          <span
            className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: brand.primary, color: brand.bgDeep }}
          >
            ✓
          </span>
        </>
      ) : (
        <>
          <span className="mb-1 text-3xl" aria-hidden>
            {icon}
          </span>
          <span className="text-xs font-semibold text-white">{sublabel}</span>
          {hint && (
            <span className="mt-0.5 text-[10px] leading-tight" style={{ color: brand.textMuted }}>
              {hint}
            </span>
          )}
          <span
            className="mt-1 text-[10px] font-medium uppercase tracking-wide"
            style={{ color: brand.primary }}
          >
            + {label}
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
    </button>
  );
}
