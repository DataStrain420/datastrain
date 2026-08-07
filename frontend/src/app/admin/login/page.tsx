"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Admin now shares patient auth. Anyone landing here from an old bookmark
// gets bounced to /login with a redirect back into the admin dashboard —
// the AdminAuthGuard then decides based on user.is_admin whether to let
// them in or show the "not authorised" screen.
export default function AdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/login?redirect=${encodeURIComponent("/admin/dashboard")}`);
  }, [router]);
  return null;
}
