"use client";

import AdminAuthGuard from "@/components/AdminAuthGuard";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";
import clsx from "clsx";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Queue", href: "/admin/queue" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Strains", href: "/admin/strains" },
  { label: "Batches", href: "/admin/batches" },
  { label: "Pharmacies", href: "/admin/pharmacies" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't wrap login page with auth guard
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen">
        <aside
          className="w-56 border-r p-4"
          style={{
            backgroundColor: brand.bgCard,
            borderColor: `${brand.secondary}18`,
          }}
        >
          <Link href="/admin/dashboard" className="mb-6 flex items-center gap-2">
            <Image
              src="/brand/logomark.svg"
              alt="DataStrain"
              width={22}
              height={24}
              className="h-6 w-auto"
            />
            <span className="text-sm font-extrabold tracking-tight">
              <span style={{ color: brand.secondary }}>DS</span>{" "}
              <span style={{ color: brand.textMuted }}>Admin</span>
            </span>
          </Link>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition",
                    !active && "hover:text-white"
                  )}
                  style={{
                    backgroundColor: active ? `${brand.primary}18` : undefined,
                    color: active ? brand.primary : brand.textMuted,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}
