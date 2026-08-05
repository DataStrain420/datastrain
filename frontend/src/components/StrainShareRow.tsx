"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";

interface StrainShareRowProps {
  name: string;
  /** Absolute URL to share. When omitted, uses window.location.href at click time. */
  url?: string;
}

/**
 * Compact share/copy pill row. Uses the native share sheet on mobile
 * (navigator.share) and falls back to individual prefilled links on
 * desktop. MedBud does a big six-button row here — we keep it tighter.
 */
export default function StrainShareRow({ name, url }: StrainShareRowProps) {
  const [copied, setCopied] = useState(false);

  function currentUrl(): string {
    if (url) return url;
    if (typeof window === "undefined") return "";
    return window.location.href;
  }

  const shareUrl = () => currentUrl();
  const shareText = () => `${name} on DataStrain`;

  async function handleCopy() {
    const link = shareUrl();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (older browsers, insecure context) — silent no-op.
    }
  }

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !("share" in navigator)) return;
    try {
      await navigator.share({ title: shareText(), url: shareUrl() });
    } catch {
      // User cancelled or share failed — no-op.
    }
  }

  const links = [
    {
      key: "x",
      label: "Share on X",
      href: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(shareUrl())}`,
      icon: "\u{1D54F}",
    },
    {
      key: "reddit",
      label: "Share on Reddit",
      href: () => `https://reddit.com/submit?url=${encodeURIComponent(shareUrl())}&title=${encodeURIComponent(shareText())}`,
      icon: "\u{1F47D}",
    },
    {
      key: "whatsapp",
      label: "Share on WhatsApp",
      href: () => `https://wa.me/?text=${encodeURIComponent(`${shareText()} ${shareUrl()}`)}`,
      icon: "\u{1F4AC}",
    },
    {
      key: "email",
      label: "Share by email",
      href: () => `mailto:?subject=${encodeURIComponent(shareText())}&body=${encodeURIComponent(`Thought you might find this interesting:\n\n${shareUrl()}`)}`,
      icon: "\u{2709}\u{FE0F}",
    },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="mr-1" style={{ color: brand.textMuted }}>
        Share:
      </span>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:brightness-125"
          style={{ backgroundColor: brand.bgDeep, color: brand.textMuted, border: `1px solid ${brand.textMuted}22` }}
          aria-label={l.label}
          title={l.label}
        >
          <span aria-hidden>{l.icon}</span>
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 transition hover:brightness-125"
        style={{ backgroundColor: brand.bgDeep, color: brand.textMuted, border: `1px solid ${brand.textMuted}22` }}
        title="Copy link"
        aria-label="Copy link"
      >
        <span aria-hidden>{"\u{1F517}"}</span>
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </button>
      {/* Native share sheet — only rendered when the browser supports it.
          On mobile Safari/Chrome this opens iOS/Android share tray. */}
      {typeof navigator !== "undefined" && typeof (navigator as Navigator & { share?: unknown }).share === "function" && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 transition hover:brightness-125"
          style={{ backgroundColor: `${brand.primary}18`, color: brand.primary, border: `1px solid ${brand.primary}55` }}
          title="Share via device"
        >
          <span aria-hidden>{"\u{1F4E4}"}</span>
          <span>More…</span>
        </button>
      )}
    </div>
  );
}
