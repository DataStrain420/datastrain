"use client";

import { useAuth } from "@/lib/auth-context";
import { brand } from "@/lib/brand";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/portal/dashboard");
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // Use window.location for full reload so auth context reads localStorage fresh
      window.location.href = "/portal/dashboard";
    } catch (err: any) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: brand.bgCard,
          border: `1px solid ${brand.secondary}18`,
          boxShadow: `0 0 40px ${brand.secondary}08`,
        }}
      >
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image
            src="/brand/logomark.svg"
            alt="DataStrain"
            width={44}
            height={48}
            className="h-12 w-auto"
          />
          <h1 className="text-2xl font-bold">Sign In</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm" style={{ color: brand.textMuted }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-2 text-white focus:outline-none"
              style={{
                backgroundColor: brand.bgDeep,
                border: `1px solid ${brand.textMuted}33`,
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: brand.textMuted }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-2 text-white focus:outline-none"
              style={{
                backgroundColor: brand.bgDeep,
                border: `1px solid ${brand.textMuted}33`,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: brand.primary, color: brand.bgDeep }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: brand.textMuted }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium hover:underline" style={{ color: brand.primary }}>
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
