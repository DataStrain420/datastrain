"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { brand } from "@/lib/brand";

const C = brand;

export interface Emblem {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

interface EmblemGridProps {
  emblems: Emblem[];
}

/** Brand hexagon path (viewBox 0 0 256 256) */
const HEX_PATH =
  "M219.9,66.7l-84,-47.4c-4.888,-2.799-10.912,-2.799-15.8,0l-84,47.4c-4.997,2.885-8.089,8.23-8.1,14l0,94.6c0.011,5.77,3.103,11.115,8.1,14l84,47.4c4.888,2.799,10.912,2.799,15.8,0l84,-47.4c4.997,-2.885,8.089,-8.23,8.1,-14l0,-94.6c-0.011,-5.77-3.103,-11.115-8.1,-14Z";

interface SelectedAnchor {
  emblem: Emblem;
  rect: DOMRect;
}

export default function EmblemGrid({ emblems }: EmblemGridProps) {
  const [selected, setSelected] = useState<SelectedAnchor | null>(null);

  if (emblems.length === 0) return null;

  return (
    <div className="w-full">
      <h2
        className="mb-5 text-center text-lg font-bold"
        style={{ color: "white" }}
      >
        Emblems
      </h2>
      <div
        className="mx-auto grid w-full gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}
      >
        {emblems.map((emblem) => (
          <EmblemBadge
            key={emblem.id}
            emblem={emblem}
            isActive={selected?.emblem.id === emblem.id}
            onSelect={(rect) =>
              setSelected((prev) =>
                prev?.emblem.id === emblem.id ? null : { emblem, rect }
              )
            }
          />
        ))}
      </div>

      {selected && (
        <EmblemPopover
          emblem={selected.emblem}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function EmblemBadge({
  emblem,
  isActive,
  onSelect,
}: {
  emblem: Emblem;
  isActive: boolean;
  onSelect: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const color = emblem.unlocked ? C.secondary : C.textMuted;
  const opacity = emblem.unlocked ? 1 : 0.35;

  return (
    <button
      ref={ref}
      type="button"
      data-emblem-anchor
      onClick={() => {
        if (ref.current) onSelect(ref.current.getBoundingClientRect());
      }}
      className="flex flex-col items-center gap-1.5 rounded-lg p-1 text-center transition hover:opacity-80 focus:outline-none"
      style={{
        opacity,
        outline: isActive ? `1.5px solid ${C.secondary}88` : "none",
      }}
      aria-label={`${emblem.name} — ${emblem.unlocked ? "earned" : "locked"}`}
      aria-expanded={isActive}
    >
      {/* Hexagonal badge */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
          <path
            d={HEX_PATH}
            fill={color}
            fillOpacity={emblem.unlocked ? 0.15 : 0.08}
            stroke={color}
            strokeWidth={emblem.unlocked ? 5 : 3}
          />
        </svg>
        <span className="relative z-10 text-xl">{emblem.icon}</span>
      </div>
      <span
        className="text-[11px] font-semibold leading-tight"
        style={{ color: emblem.unlocked ? "white" : C.textMuted }}
      >
        {emblem.name}
      </span>
    </button>
  );
}

/* ── Popover positioned near the clicked badge ─────────────────────────────── */

interface Position {
  top: number;
  left: number;
  placement: "below" | "above";
}

function EmblemPopover({
  emblem,
  anchorRect,
  onClose,
}: {
  emblem: Emblem;
  anchorRect: DOMRect;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position | null>(null);

  // Position the popover relative to the anchor badge. Place below by default;
  // flip above if it would overflow the viewport. Clamp horizontally so it
  // never falls off-screen on narrow viewports.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const popoverRect = el.getBoundingClientRect();
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const gap = 8;
    const margin = 8;

    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    let left = anchorCenterX - popoverRect.width / 2;
    let top = anchorRect.bottom + gap;
    let placement: "below" | "above" = "below";

    if (top + popoverRect.height > vpH - margin) {
      top = anchorRect.top - popoverRect.height - gap;
      placement = "above";
    }
    if (left < margin) left = margin;
    if (left + popoverRect.width > vpW - margin) {
      left = vpW - margin - popoverRect.width;
    }

    setPos({ top, left, placement });
  }, [anchorRect]);

  // Dismissal: click outside, Escape, or scroll/resize (since fixed-position
  // popover would visually disconnect from its anchor on scroll).
  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!ref.current) return;
      const target = e.target as HTMLElement;
      if (ref.current.contains(target)) return;
      // Don't close on clicks to another emblem anchor — that anchor's own
      // onClick handler will switch selection (or toggle this one off).
      if (target.closest("[data-emblem-anchor]")) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onScrollOrResize() {
      onClose();
    }
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [onClose]);

  const color = emblem.unlocked ? C.secondary : C.textMuted;
  const ready = pos !== null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${emblem.name} details`}
      className="fixed z-50 w-64 rounded-2xl p-4"
      style={{
        backgroundColor: C.bgCard,
        border: `1px solid ${color}55`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${color}25`,
        top: ready ? pos!.top : -9999,
        left: ready ? pos!.left : -9999,
        visibility: ready ? "visible" : "hidden",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
            <path
              d={HEX_PATH}
              fill={color}
              fillOpacity={emblem.unlocked ? 0.18 : 0.08}
              stroke={color}
              strokeWidth={emblem.unlocked ? 6 : 4}
            />
          </svg>
          <span className="relative z-10 text-2xl">{emblem.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-bold leading-tight"
            style={{ color: emblem.unlocked ? "#fff" : C.textMuted }}
          >
            {emblem.name}
          </p>
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
            style={{
              backgroundColor: emblem.unlocked ? `${C.secondary}22` : `${C.textMuted}22`,
              color: emblem.unlocked ? C.secondary : C.textMuted,
            }}
          >
            {emblem.unlocked ? "Earned" : "Locked"}
          </span>
        </div>
      </div>

      <p
        className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-wider"
        style={{ color: C.textMuted }}
      >
        How to earn
      </p>
      <p className="text-xs leading-relaxed" style={{ color: "#fff" }}>
        {emblem.description}
      </p>
    </div>
  );
}
