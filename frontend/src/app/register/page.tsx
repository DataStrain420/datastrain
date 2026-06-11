"use client";

import { useAuth } from "@/lib/auth-context";
import { brand } from "@/lib/brand";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isVerified) {
      setError("You must confirm you hold a valid UK medical cannabis prescription.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(username, email, password, isVerified);
      window.location.href = "/portal/dashboard";
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: brand.bgDeep,
    border: `1px solid ${brand.textMuted}33`,
  };

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
          <h1 className="text-2xl font-bold">Create Account</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm" style={{ color: brand.textMuted }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full rounded-lg px-4 py-2 text-white focus:outline-none"
              style={inputStyle}
            />
          </div>

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
              style={inputStyle}
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
              minLength={8}
              className="w-full rounded-lg px-4 py-2 text-white focus:outline-none"
              style={inputStyle}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="mt-1 h-4 w-4 rounded"
              style={{ accentColor: brand.primary }}
            />
            <span className="text-sm" style={{ color: brand.textMuted }}>
              I confirm that I hold a valid UK medical cannabis prescription and
              agree to the{" "}
              <span style={{ color: brand.primary }}>Terms of Service</span>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: brand.primary, color: brand.bgDeep }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: brand.textMuted }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: brand.primary }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
