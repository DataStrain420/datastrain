"use client";

import { useRef } from "react";
import { brand } from "@/lib/brand";

interface PhotoUploadProps {
  label: string;
  sublabel: string;
  file: File | null;
  onChange: (f: File) => void;
}

export default function PhotoUpload({ label, sublabel, file, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 transition hover:opacity-80"
      style={{
        borderColor: file ? brand.primary : `${brand.textMuted}44`,
        backgroundColor: file ? `${brand.primary}08` : "transparent",
        minHeight: 100,
      }}
    >
      {preview ? (
        <img
          src={preview}
          alt={label}
          className="mb-1 h-14 w-14 rounded-lg object-cover"
        />
      ) : (
        <span className="mb-1 text-2xl" style={{ color: brand.primary }}>
          📷
        </span>
      )}
      <span className="text-xs font-medium text-white">{label}</span>
      <span className="text-[10px]" style={{ color: brand.textMuted }}>
        {sublabel}
      </span>
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
