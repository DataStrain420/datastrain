"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);

    const devMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (devMode) {
      // In dev mode, skip Firebase and go straight to admin
      router.push("/admin/dashboard");
      return;
    }

    try {
      const { signInWithPopup } = await import("firebase/auth");
      const { auth, googleProvider } = await import("@/lib/firebase");
      await signInWithPopup(auth, googleProvider);
      router.push("/admin/dashboard");
    } catch (err: any) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm rounded-xl bg-gray-900 p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
        <p className="mb-6 text-sm text-gray-400">DataStrain Management</p>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-2 font-semibold text-gray-900 transition hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </main>
  );
}
