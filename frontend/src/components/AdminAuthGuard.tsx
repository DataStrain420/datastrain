"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { brand } from "@/lib/brand";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/admin/dashboard")}`);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: brand.bgDeep }}>
        <p style={{ color: brand.textMuted }}>Loading...</p>
      </div>
    );
  }

  // Signed out — the effect above is redirecting; render nothing meanwhile.
  if (!user) return null;

  // Signed in but not on the allow-list — show a clear denial rather than a
  // silent redirect, so mis-configured accounts see what went wrong.
  if (!user.is_admin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center" style={{ backgroundColor: brand.bgDeep }}>
        <h1 className="text-xl font-bold text-white">Admin access denied</h1>
        <p className="max-w-md text-sm" style={{ color: brand.textMuted }}>
          Your account ({user.email}) isn&apos;t authorised for the admin panel. Ask
          an operator to add your email to <code>ADMIN_EMAILS</code>.
        </p>
        <button
          onClick={() => router.push("/portal/dashboard")}
          className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: brand.primary, color: brand.bgDeep }}
        >
          Back to your dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
