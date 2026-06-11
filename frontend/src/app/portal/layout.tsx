"use client";

import AuthGuard from "@/components/AuthGuard";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <Navbar rightSlot={<PublicNavActions />} showSearch />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
