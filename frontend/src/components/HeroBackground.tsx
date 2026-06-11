"use client";

import { useEffect, useRef } from "react";

/**
 * Hero background — slow-drifting hexagon nodes connected by faint straight
 * lines when within range. Echoes the brand hex motif as a subtle network /
 * molecule lattice. No interactivity, no clicks; purely decorative.
 */

interface HexNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** outer radius of the hex outline */
  r: number;
  /** drift phase used to pulse opacity */
  pulse: number;
  pulseSpeed: number;
  baseAlpha: number;
  /** index into the brand colour palette */
  colorIdx: number;
}

/** Draw a flat-top regular hexagon outline at (cx, cy) with outer radius r. */
function strokeHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let nodes: HexNode[] = [];

    // Maximum distance at which two nodes will be connected. Lines fade with
    // distance so the network looks organic rather than rigid.
    const CONNECTION_DIST = 170;

    // Brand-aligned palette
    const PALETTE = [
      { r: 81, g: 237, b: 146 },  // primary green #51ed92
      { r: 10, g: 214, b: 218 },  // secondary cyan #0ad6da
      { r: 0, g: 238, b: 178 },   // accent teal #00eeb2
    ];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      // Subtle density — scale by area, cap so it stays calm on large screens.
      const area = w * h;
      const count = Math.min(Math.max(Math.floor(area / 32000), 10), 36);
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          r: 6 + Math.random() * 8,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.002 + Math.random() * 0.003,
          baseAlpha: 0.08 + Math.random() * 0.06,
          colorIdx: Math.floor(Math.random() * PALETTE.length),
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // ── Update positions + pulse ──────────────────────────────────────
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;

        // Soft wrap at edges so nodes drift in from the opposite side
        const m = 40;
        if (n.x < -m) n.x = w + m;
        if (n.x > w + m) n.x = -m;
        if (n.y < -m) n.y = h + m;
        if (n.y > h + m) n.y = -m;
      }

      // ── Connections ───────────────────────────────────────────────────
      // Straight lines between any two nodes within range, fading to zero at
      // the connection limit. Colour is blended between the two endpoints.
      ctx!.lineWidth = 0.7;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= CONNECTION_DIST) continue;

          const fade = 1 - dist / CONNECTION_DIST;
          // Soften further so the network reads as background texture, not pattern
          const alpha = fade * fade * 0.16;
          const ca = PALETTE[a.colorIdx];
          const cb = PALETTE[b.colorIdx];
          // Midpoint colour — cheap blend, keeps connections coherent
          const r = (ca.r + cb.r) >> 1;
          const g = (ca.g + cb.g) >> 1;
          const bl = (ca.b + cb.b) >> 1;

          ctx!.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // ── Hex nodes ─────────────────────────────────────────────────────
      for (const n of nodes) {
        const col = PALETTE[n.colorIdx];
        const alpha = n.baseAlpha + Math.sin(n.pulse) * 0.035;

        // Outline
        ctx!.strokeStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`;
        ctx!.lineWidth = 1.1;
        strokeHex(ctx!, n.x, n.y, n.r);

        // Tiny centre dot for a touch of life
        ctx!.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha * 1.4})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, 1.4, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    seed();
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  );
}
