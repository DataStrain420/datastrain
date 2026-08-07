"use client";

import AdminAuthGuard from "@/components/AdminAuthGuard";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";
import clsx from "clsx";

const C = brand;

const tabs = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "\u{1F4CA}" },
  { label: "Moderation Queue", href: "/admin/queue", icon: "\u{2705}" },
  { label: "Reports", href: "/admin/reports", icon: "\u{1F6A9}" },
  { label: "Strains", href: "/admin/strains", icon: "\u{1F33F}" },
  { label: "Batches", href: "/admin/batches", icon: "\u{1F9EA}" },
  { label: "Pharmacies", href: "/admin/pharmacies", icon: "\u{1F3E5}" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // /admin/login is a compatibility redirect — render it bare so the
  // guard and header don't fight the redirect it fires on mount.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen flex-col">
        <Navbar rightSlot={<PublicNavActions />} showSearch />

        {/* Admin hero — signals "you're in the admin area" without ripping
            you out of the main site's design system. */}
        <div
          className="border-b"
          style={{
            borderColor: `${C.secondary}22`,
            background: `linear-gradient(180deg, ${C.secondary}10 0%, transparent 100%)`,
          }}
        >
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                style={{
                  backgroundColor: `${C.secondary}20`,
                  color: C.secondary,
                  border: `1px solid ${C.secondary}55`,
                }}
                aria-hidden
              >
                {"\u{1F6E1}\u{FE0F}"}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: C.secondary }}
                >
                  Admin
                </p>
                <h1 className="text-xl font-extrabold text-white">DataStrain control panel</h1>
              </div>
              <Link
                href="/portal/dashboard"
                className="shrink-0 text-xs font-semibold underline"
                style={{ color: C.textMuted }}
              >
                ← Back to your dashboard
              </Link>
            </div>

            {/* Tabs — horizontal, scrollable on narrow screens. */}
            <nav className="mt-5 -mb-4 flex gap-1 overflow-x-auto pb-4">
              {tabs.map((t) => {
                const active = pathname.startsWith(t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={clsx(
                      "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    )}
                    style={{
                      backgroundColor: active ? `${C.secondary}22` : "transparent",
                      color: active ? C.secondary : C.textMuted,
                      border: `1px solid ${active ? `${C.secondary}66` : `${C.textMuted}22`}`,
                    }}
                  >
                    <span aria-hidden>{t.icon}</span>
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
          {children}
        </main>

        <Footer />
      </div>
    </AdminAuthGuard>
  );
}
