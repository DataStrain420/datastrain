"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { brand } from "@/lib/brand";

const C = brand;

/**
 * Mobile-first card row. Below `sm` it's a horizontal snap-scroll carousel
 * with dot indicators and prev/next arrows; from `sm` up it falls back to the
 * centered flex-wrap grid used elsewhere on the site. Each child keeps its own
 * fixed width (e.g. a 300px StrainCard) — this only handles layout + controls.
 */
export default function CardCarousel({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const SCROLL_PAD = 16; // matches scroll-pl-4 / px-4

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    if (!kids.length) return;
    const sRect = el.getBoundingClientRect();
    const center = sRect.left + sRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    kids.forEach((k, i) => {
      const r = k.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, items.length]);

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    const idx = Math.max(0, Math.min(i, kids.length - 1));
    const k = kids[idx];
    if (!k) return;
    const sRect = el.getBoundingClientRect();
    const kRect = k.getBoundingClientRect();
    const target = Math.max(0, el.scrollLeft + (kRect.left - sRect.left) - SCROLL_PAD);
    // Smooth scroll on tap (falls back to an instant jump where smooth scroll
    // isn't supported). Update indicators optimistically so the active dot
    // responds immediately; the scroll handler keeps them in sync on swipe.
    el.scrollTo({ left: target, behavior: "smooth" });
    setActive(idx);
    setAtStart(idx === 0);
    setAtEnd(idx === kids.length - 1);
  }, []);

  const showControls = items.length > 1;

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={update}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-6 sm:overflow-x-visible sm:px-0 sm:pb-0"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((child, i) => (
          <div key={i} className="shrink-0 snap-start">
            {child}
          </div>
        ))}
      </div>

      {/* Controls — mobile only (the sm+ grid wraps, so they're not needed) */}
      {showControls && (
        <div className="mt-4 flex items-center justify-center gap-4 sm:hidden">
          <CarouselArrow
            direction="prev"
            disabled={atStart}
            onClick={() => scrollToIndex(active - 1)}
          />
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to card ${i + 1}`}
                aria-current={i === active}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === active ? 18 : 6,
                  backgroundColor: i === active ? C.secondary : `${C.textMuted}55`,
                }}
              />
            ))}
          </div>
          <CarouselArrow
            direction="next"
            disabled={atEnd}
            onClick={() => scrollToIndex(active + 1)}
          />
        </div>
      )}
    </div>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous card" : "Next card"}
      className="flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-30"
      style={{ borderColor: `${C.secondary}55`, backgroundColor: `${C.secondary}12`, color: C.secondary }}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={direction === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}
