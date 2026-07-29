/**
 * Hero background — a cannabis-leaf photograph that fades into the site's
 * dark base tone via a radial gradient centred on the search box. The
 * gradient keeps the middle of the hero legible for the headline and
 * search bar, while the leaf texture reads at the edges.
 *
 * Drop the source image at `frontend/public/hero-cannabis-bg.jpg`. Any
 * ~1920×1080 dark-green leaf photo works; the overlay does the heavy
 * lifting so the exact tone isn't critical.
 */
export default function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Photo layer */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-cannabis-bg.jpg')" }}
      />

      {/* Radial fade — dark at centre so text/search stay legible, image
          visible around the edges. Two stacked gradients: an ellipse for
          the middle wash, then a vertical fade at the very top/bottom so
          the hero blends into the sections above and below. */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 55% at 50% 55%,
              #14181b 0%,
              rgba(20, 24, 27, 0.85) 35%,
              rgba(20, 24, 27, 0.55) 65%,
              rgba(20, 24, 27, 0.35) 100%
            ),
            linear-gradient(to bottom,
              #14181b 0%,
              rgba(20, 24, 27, 0.5) 20%,
              rgba(20, 24, 27, 0.5) 80%,
              #14181b 100%
            )
          `,
        }}
      />
    </div>
  );
}
