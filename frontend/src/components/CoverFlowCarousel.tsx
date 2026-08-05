"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { brand } from "@/lib/brand";

const C = brand;

interface CoverFlowCarouselProps {
  children: ReactNode[];
}

export default function CoverFlowCarousel({ children }: CoverFlowCarouselProps) {
  const count = children.length;
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(() => setActive((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((i) => (i + 1) % count), [count]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!containerRef.current?.contains(document.activeElement) &&
          document.activeElement !== containerRef.current) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  if (count === 0) return null;

  // Card width + spacing constants. CARD_W matches the standard 330px strain
  // card used across the site so the centre card is the same size everywhere;
  // SPACING is scaled to keep the same relative overlap as before.
  const CARD_W = 300;
  const SPACING = 240;
  const MAX_VISIBLE = 3; // cards visible on each side

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-visible py-4"
      tabIndex={0}
      style={{ outline: "none" }}
    >
      {/* Reflection surface gradient */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 rounded-b-2xl"
        style={{
          background: `linear-gradient(to bottom, transparent, ${C.bgDeep}88)`,
        }}
      />

      {/* Stage */}
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{
          perspective: "1100px",
          height: 540,
          overflow: "visible",
        }}
      >
        {children.map((child, i) => {
          // Circular offset: shortest signed distance from active in either direction.
          // For count=N, offset is in range (-N/2, N/2]. This makes the carousel loop:
          // the card before `active` (wrapping past index 0) appears on the left.
          const rawOffset = ((i - active) % count + count) % count;
          const offset = rawOffset > count / 2 ? rawOffset - count : rawOffset;
          const absOffset = Math.abs(offset);

          // Hide cards too far away
          if (absOffset > MAX_VISIBLE) return null;

          // 3D transforms
          const translateX = offset * SPACING;
          const translateZ = -absOffset * 120;
          const rotateY = offset === 0 ? 0 : offset < 0 ? 45 : -45;
          // Center card stays at 1.0 — scaling up magnifies the raster image
          // (photo + text) which the browser can't re-sharpen, so it looks
          // blurred. Side cards scale DOWN, which the GPU handles cleanly.
          const scale = offset === 0 ? 1 : Math.max(0.7, 1 - absOffset * 0.12);
          const opacity = offset === 0 ? 1 : Math.max(0.3, 1 - absOffset * 0.25);
          const zIndex = 100 - absOffset;

          const isCenter = offset === 0;

          return (
            <div
              key={i}
              className="absolute transition-all duration-500 ease-out"
              style={{
                width: CARD_W,
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transformStyle: "preserve-3d",
                cursor: "pointer",
                filter: isCenter ? "none" : `brightness(${1 - absOffset * 0.15})`,
              }}
            >
              {isCenter ? (
                /* Center card — clicks pass through to MiniStrainCard */
                <div>{child}</div>
              ) : (
                /* Side card — click brings it to center */
                <div
                  style={{ pointerEvents: "auto" }}
                  onClick={(e) => { e.stopPropagation(); setActive(i); }}
                >
                  {child}
                </div>
              )}

              {/* Reflection */}
              {isCenter && (
                <div
                  className="pointer-events-none mt-1 overflow-hidden rounded-xl"
                  style={{
                    height: 40,
                    transform: "scaleY(-1)",
                    opacity: 0.15,
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
                  }}
                >
                  {child}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 z-[110] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition hover:brightness-125"
            style={{
              backgroundColor: `${C.bgCard}cc`,
              border: `1px solid ${C.textMuted}33`,
              color: "#fff",
            }}
            aria-label="Previous"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 z-[110] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition hover:brightness-125"
            style={{
              backgroundColor: `${C.bgCard}cc`,
              border: `1px solid ${C.textMuted}33`,
              color: "#fff",
            }}
            aria-label="Next"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === active ? 16 : 6,
                backgroundColor: i === active ? C.primary : `${C.textMuted}44`,
              }}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
