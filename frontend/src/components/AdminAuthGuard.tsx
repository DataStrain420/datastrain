"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In dev mode, auto-authenticate
    const devMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (devMode) {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    // Check Firebase auth
    import("firebase/auth").then(({ getAuth, onAuthStateChanged }) => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setAuthenticated(true);
        } else {
          router.push("/admin/login");
        }
        setLoading(false);
      });
      return () => unsubscribe();
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
