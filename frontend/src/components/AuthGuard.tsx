"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login");
    }
  }, [user, mounted, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
