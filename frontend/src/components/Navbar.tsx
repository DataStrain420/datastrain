"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { brand } from "@/lib/brand";
import SearchBar from "@/components/SearchBar";

const C = brand;

/* ── Mega menu data ────────────────────────────────────────────────────────── */

const strainsMega = {
  featured: [
    { label: "Newest Strains", href: "/strains?sort=newest", icon: "\u{2728}" },
    { label: "Top Rated Strains", href: "/strains?sort=top-rated", icon: "\u{1F3C6}" },
    { label: "Most Reviewed", href: "/strains?sort=most-reviewed", icon: "\u{1F4DD}" },
    { label: "View All Strains", href: "/strains", icon: "\u{1F33F}" },
  ],
  byType: [
    { label: "Indica", href: "/strains?type=indica", icon: "\u{25D0}" },
    { label: "Sativa", href: "/strains?type=sativa", icon: "\u{25D1}" },
    { label: "Hybrid", href: "/strains?type=hybrid", icon: "\u{25CF}" },
  ],
  byEffect: [
    { label: "Relaxed", href: "/strains?effect=Relaxed", icon: "\u{1F60C}" },
    { label: "Euphoric", href: "/strains?effect=Euphoric", icon: "\u{1F929}" },
    { label: "Sleepy", href: "/strains?effect=Sleepy", icon: "\u{1F4A4}" },
    { label: "Creative", href: "/strains?effect=Creative", icon: "\u{1F3A8}" },
    { label: "Focused", href: "/strains?effect=Focused", icon: "\u{1F3AF}" },
    { label: "Calm", href: "/strains?effect=Calm", icon: "\u{1F9D8}" },
  ],
  byCondition: [
    { label: "Anxiety", href: "/strains?condition=Anxiety", icon: "\u{1F630}" },
    { label: "Insomnia", href: "/strains?condition=Insomnia", icon: "\u{1F634}" },
    { label: "Chronic Pain", href: "/strains?condition=Chronic+Pain", icon: "\u{1FA79}" },
    { label: "Depression", href: "/strains?condition=Depression", icon: "\u{1F614}" },
    { label: "Migraines", href: "/strains?condition=Migraines", icon: "\u{1F915}" },
    { label: "PTSD", href: "/strains?condition=PTSD", icon: "\u{1F9E0}" },
  ],
};

const growersMega = {
  featured: [
    { label: "Top Rated Growers", href: "/growers?sort=top-rated", icon: "\u{1F3C6}" },
    { label: "Most Strains", href: "/growers?sort=most-strains", icon: "\u{1F33F}" },
    { label: "Verified Growers", href: "/growers?verified=true", icon: "\u{2705}" },
    { label: "View All Growers", href: "/growers", icon: "\u{1F3ED}" },
  ],
  byRegion: [
    { label: "United Kingdom", href: "/growers?country=United+Kingdom", icon: "\u{1F1EC}\u{1F1E7}" },
    { label: "Canada", href: "/growers?country=Canada", icon: "\u{1F1E8}\u{1F1E6}" },
    { label: "Netherlands", href: "/growers?country=Netherlands", icon: "\u{1F1F3}\u{1F1F1}" },
    { label: "Germany", href: "/growers?country=Germany", icon: "\u{1F1E9}\u{1F1EA}" },
    { label: "Australia", href: "/growers?country=Australia", icon: "\u{1F1E6}\u{1F1FA}" },
    { label: "Israel", href: "/growers?country=Israel", icon: "\u{1F1EE}\u{1F1F1}" },
  ],
};

const pharmaciesMega = {
  featured: [
    { label: "Verified Pharmacies", href: "/pharmacies?verified=true", icon: "\u{2705}" },
    { label: "All Pharmacies", href: "/pharmacies", icon: "\u{1F3E5}" },
  ],
  byLocation: [
    { label: "London", href: "/pharmacies?location=London", icon: "\u{1F4CD}" },
    { label: "Essex", href: "/pharmacies?location=Essex", icon: "\u{1F4CD}" },
    { label: "Cambridge", href: "/pharmacies?location=Cambridge", icon: "\u{1F4CD}" },
    { label: "West Sussex", href: "/pharmacies?location=Sussex", icon: "\u{1F4CD}" },
    { label: "Yorkshire", href: "/pharmacies?location=Yorkshire", icon: "\u{1F4CD}" },
  ],
};

const clinicsMega = {
  featured: [
    { label: "Verified Clinics", href: "/clinics?verified=true", icon: "\u{2705}" },
    { label: "Most Affordable", href: "/clinics?sort=cheapest", icon: "\u{1F4B7}" },
    { label: "All Clinics", href: "/clinics", icon: "\u{1F469}\u{200D}\u{2695}\u{FE0F}" },
  ],
  byLocation: [
    { label: "London", href: "/clinics?location=London", icon: "\u{1F4CD}" },
    { label: "Online UK-wide", href: "/clinics?location=Online", icon: "\u{1F4BB}" },
    { label: "Birmingham", href: "/clinics?location=Birmingham", icon: "\u{1F4CD}" },
    { label: "Cambridge", href: "/clinics?location=Cambridge", icon: "\u{1F4CD}" },
    { label: "Reading", href: "/clinics?location=Reading", icon: "\u{1F4CD}" },
  ],
};

const conditionsMega = [
  { label: "Insomnia", href: "/strains?condition=Insomnia", icon: "\u{1F634}" },
  { label: "Anxiety", href: "/strains?condition=Anxiety", icon: "\u{1F630}" },
  { label: "Chronic Pain", href: "/strains?condition=Chronic+Pain", icon: "\u{1FA79}" },
  { label: "Depression", href: "/strains?condition=Depression", icon: "\u{1F614}" },
  { label: "PTSD", href: "/strains?condition=PTSD", icon: "\u{1F9E0}" },
  { label: "Migraines", href: "/strains?condition=Migraines", icon: "\u{1F915}" },
  { label: "Nausea", href: "/strains?condition=Nausea", icon: "\u{1F922}" },
  { label: "Appetite Loss", href: "/strains?condition=Appetite+Loss", icon: "\u{1F37D}\u{FE0F}" },
  { label: "Muscle Spasms", href: "/strains?condition=Muscle+Spasms", icon: "\u{1F4AA}" },
  { label: "ADHD", href: "/strains?condition=ADHD", icon: "\u{26A1}" },
  { label: "Arthritis", href: "/strains?condition=Arthritis", icon: "\u{1F9B4}" },
  { label: "Fibromyalgia", href: "/strains?condition=Fibromyalgia", icon: "\u{1FA7A}" },
];

/* ── Mega menu column helper ───────────────────────────────────────────────── */

function MegaColumn({ title, items, onNavigate }: { title: string; items: { label: string; href: string; icon: string }[]; onNavigate: (href: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-white/5 hover:text-white"
            style={{ color: C.textMuted }}
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Mobile accordion section ──────────────────────────────────────────────── */

function MobileNavSection({
  title,
  expanded,
  onToggle,
  items,
  onNavigate,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  items: { label: string; href: string; icon: string }[];
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="border-b" style={{ borderColor: `${C.textMuted}12` }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-base font-semibold transition hover:text-white"
        style={{ color: expanded ? "white" : C.textMuted }}
      >
        {title}
        <svg
          className="h-4 w-4 transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="grid grid-cols-2 gap-0.5 pb-3">
          {items.map((item) => (
            <button
              key={item.href + item.label}
              onClick={() => onNavigate(item.href)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-white/5 hover:text-white"
              style={{ color: C.textMuted }}
            >
              <span className="w-5 shrink-0 text-center">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────────────────── */

interface NavbarProps {
  navItems?: { label: string; href: string; hasDropdown?: boolean }[];
  rightSlot?: React.ReactNode;
  leftSlot?: React.ReactNode;
  showSearch?: boolean;
}

export default function Navbar({ rightSlot, leftSlot, showSearch = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  function navigateTo(href: string) {
    setOpenMenu(null);
    setMobileOpen(false);
    router.push(href);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  function toggleMenu(menu: string) {
    setOpenMenu(openMenu === menu ? null : menu);
  }

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{
        backgroundColor: `${C.bgCard}ee`,
        borderColor: `${C.secondary}18`,
      }}
    >
      {/* Top row: logo, central search, right actions */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Left — Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpenMenu(null)}>
          <Image
            src="/brand/logomark.svg"
            alt="DataStrain"
            width={28}
            height={30}
            className="h-7 w-auto"
            priority
          />
          <span className="text-lg font-extrabold tracking-tight">
            <span style={{ color: C.secondary }}>Data</span>
            <span style={{ color: C.accent }}>Strain</span>
          </span>
        </Link>

        {leftSlot}

        {/* Center — Search bar */}
        {showSearch && (
          <div className="mx-auto hidden w-full max-w-lg md:block">
            <SearchBar size="sm" />
          </div>
        )}

        {/* Nav links (inline beside search on large screens) */}
        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          {/* Strains */}
          <button
            onClick={() => toggleMenu("strains")}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:text-white"
            style={{ color: openMenu === "strains" ? "white" : C.textMuted }}
          >
            Strains
            <svg
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: openMenu === "strains" ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Growers */}
          <button
            onClick={() => toggleMenu("growers")}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:text-white"
            style={{ color: openMenu === "growers" ? "white" : C.textMuted }}
          >
            Growers
            <svg
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: openMenu === "growers" ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Pharmacies */}
          <button
            onClick={() => toggleMenu("pharmacies")}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:text-white"
            style={{ color: openMenu === "pharmacies" ? "white" : C.textMuted }}
          >
            Pharmacies
            <svg
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: openMenu === "pharmacies" ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Clinics */}
          <button
            onClick={() => toggleMenu("clinics")}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:text-white"
            style={{ color: openMenu === "clinics" ? "white" : C.textMuted }}
          >
            Clinics
            <svg
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: openMenu === "clinics" ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Conditions */}
          <button
            onClick={() => toggleMenu("conditions")}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:text-white"
            style={{ color: openMenu === "conditions" ? "white" : C.textMuted }}
          >
            Conditions
            <svg
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: openMenu === "conditions" ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </nav>

        {/* Right */}
        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0">
          {rightSlot}

          {/* Burger — mobile/tablet only (nav links hidden below lg) */}
          <button
            onClick={() => { setMobileOpen(!mobileOpen); setOpenMenu(null); }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition hover:brightness-125 lg:hidden"
            style={{ borderColor: `${C.secondary}33`, backgroundColor: `${C.secondary}10` }}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: C.textMuted }}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile drawer (search + nav) ──────────────────────────────── */}
      {mobileOpen && (
        <div
          className="border-t lg:hidden"
          style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}15` }}
        >
          <div className="space-y-1 px-4 py-4">
            {/* Search — available here when the page uses it (top-bar search is hidden below md) */}
            {showSearch && (
              <div className="mb-3">
                <SearchBar size="sm" />
              </div>
            )}

            <MobileNavSection
              title="Strains"
              expanded={openMenu === "strains"}
              onToggle={() => toggleMenu("strains")}
              items={[...strainsMega.featured, ...strainsMega.byType, ...strainsMega.byEffect, ...strainsMega.byCondition]}
              onNavigate={navigateTo}
            />
            <MobileNavSection
              title="Growers"
              expanded={openMenu === "growers"}
              onToggle={() => toggleMenu("growers")}
              items={[...growersMega.featured, ...growersMega.byRegion]}
              onNavigate={navigateTo}
            />
            <MobileNavSection
              title="Pharmacies"
              expanded={openMenu === "pharmacies"}
              onToggle={() => toggleMenu("pharmacies")}
              items={[...pharmaciesMega.featured, ...pharmaciesMega.byLocation]}
              onNavigate={navigateTo}
            />
            <MobileNavSection
              title="Clinics"
              expanded={openMenu === "clinics"}
              onToggle={() => toggleMenu("clinics")}
              items={[...clinicsMega.featured, ...clinicsMega.byLocation]}
              onNavigate={navigateTo}
            />
            <MobileNavSection
              title="Conditions"
              expanded={openMenu === "conditions"}
              onToggle={() => toggleMenu("conditions")}
              items={conditionsMega}
              onNavigate={navigateTo}
            />
          </div>
        </div>
      )}

      {/* ── Mega menu panels ─────────────────────────────────────────── */}

      {/* Strains mega menu */}
      {openMenu === "strains" && (
        <div
          className="absolute left-0 right-0 z-40 hidden border-b shadow-2xl lg:block"
          style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}15` }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-8 py-6">
            <MegaColumn title="Featured" items={strainsMega.featured} onNavigate={navigateTo} />
            <MegaColumn title="By Type" items={strainsMega.byType} onNavigate={navigateTo} />
            <MegaColumn title="By Effect" items={strainsMega.byEffect} onNavigate={navigateTo} />
            <MegaColumn title="By Condition" items={strainsMega.byCondition} onNavigate={navigateTo} />
          </div>
        </div>
      )}

      {/* Growers mega menu */}
      {openMenu === "growers" && (
        <div
          className="absolute left-0 right-0 z-40 hidden border-b shadow-2xl lg:block"
          style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}15` }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-8 py-6">
            <MegaColumn title="Featured" items={growersMega.featured} onNavigate={navigateTo} />
            <MegaColumn title="By Region" items={growersMega.byRegion} onNavigate={navigateTo} />
          </div>
        </div>
      )}

      {/* Pharmacies mega menu */}
      {openMenu === "pharmacies" && (
        <div
          className="absolute left-0 right-0 z-40 hidden border-b shadow-2xl lg:block"
          style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}15` }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-8 py-6">
            <MegaColumn title="Featured" items={pharmaciesMega.featured} onNavigate={navigateTo} />
            <MegaColumn title="By Location" items={pharmaciesMega.byLocation} onNavigate={navigateTo} />
          </div>
        </div>
      )}

      {/* Clinics mega menu */}
      {openMenu === "clinics" && (
        <div
          className="absolute left-0 right-0 z-40 hidden border-b shadow-2xl lg:block"
          style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}15` }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-8 py-6">
            <MegaColumn title="Featured" items={clinicsMega.featured} onNavigate={navigateTo} />
            <MegaColumn title="By Location" items={clinicsMega.byLocation} onNavigate={navigateTo} />
          </div>
        </div>
      )}

      {/* Conditions mega menu */}
      {openMenu === "conditions" && (
        <div
          className="absolute left-0 right-0 z-40 hidden border-b shadow-2xl lg:block"
          style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}15` }}
        >
          <div className="mx-auto max-w-7xl px-8 py-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Browse by Condition
            </p>
            <div className="grid grid-cols-4 gap-1">
              {conditionsMega.map((item) => (
                <button
                  key={item.href}
                  onClick={() => navigateTo(item.href)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/5 hover:text-white"
                  style={{ color: C.textMuted }}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  // Relative path like /uploads/... — prepend API base
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
}

/** Pre-built right slot for public pages */
export function PublicNavActions() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Refresh user data (including avatar) on mount
  useEffect(() => {
    if (user) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) return null;

  if (user) {
    return (
      <>
        <Link
          href="/write-review"
          className="rounded-lg px-4 py-1.5 text-sm font-semibold transition hover:opacity-90"
          style={{ backgroundColor: C.primary, color: C.bgDeep }}
        >
          Write Review
        </Link>

        {/* Profile icon + dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:brightness-125"
            style={{ borderColor: `${C.primary}66`, backgroundColor: `${C.primary}15` }}
            aria-label="Profile menu"
          >
            {resolveAvatarUrl(user.avatar_url) ? (
              <img
                src={resolveAvatarUrl(user.avatar_url)!}
                alt={user.username}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: C.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border shadow-2xl"
              style={{ backgroundColor: C.bgCard, borderColor: `${C.textMuted}20` }}
            >
              {/* User info header */}
              <div className="border-b px-4 py-3" style={{ borderColor: `${C.textMuted}15` }}>
                <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                <p className="truncate text-xs" style={{ color: C.textMuted }}>{user.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {user.is_admin && (
                  <button
                    onClick={() => { setProfileOpen(false); router.push("/admin/dashboard"); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-white/5"
                    style={{ color: C.secondary }}
                  >
                    <span className="text-base" aria-hidden>{"\u{1F6E1}\u{FE0F}"}</span>
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => { setProfileOpen(false); router.push("/portal/dashboard"); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 hover:text-white"
                  style={{ color: C.textMuted }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </button>
                <button
                  onClick={() => { setProfileOpen(false); router.push("/portal/library"); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 hover:text-white"
                  style={{ color: C.textMuted }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  My Library
                </button>
              </div>

              {/* Sign out */}
              <div className="border-t py-1" style={{ borderColor: `${C.textMuted}15` }}>
                <button
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-white/5 hover:text-red-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Signed-out visitors still see the Write Review CTA — it points to the
  // /write-review gateway which asks them to sign in first. Removing the
  // button entirely for anonymous users hides one of the primary reasons
  // to make an account, so keep it visible always.
  return (
    <>
      <Link
        href="/write-review"
        className="rounded-lg px-4 py-1.5 text-sm font-semibold transition hover:opacity-90"
        style={{ backgroundColor: C.primary, color: C.bgDeep }}
      >
        Write Review
      </Link>
      <Link
        href="/login"
        aria-label="Login or register"
        className="flex h-9 w-9 items-center justify-center gap-2 rounded-full border text-sm font-semibold text-white transition hover:opacity-90 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
        style={{ borderColor: C.primary, backgroundColor: `${C.primary}15` }}
      >
        <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden sm:inline">Login/Register</span>
      </Link>
    </>
  );
}

/** Pre-built right slot for patient portal */
export function PortalNavActions() {
  const { user, logout } = useAuth();

  return (
    <>
      <span className="text-sm" style={{ color: C.textMuted }}>
        {user?.username}
      </span>
      <button
        onClick={logout}
        className="text-sm transition hover:text-white"
        style={{ color: `${C.textMuted}99` }}
      >
        Sign out
      </button>
    </>
  );
}
