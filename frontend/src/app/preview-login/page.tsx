"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { brand } from "@/lib/brand";

const C = brand;

// Next 15 requires useSearchParams() to live under a Suspense boundary so
// pages that use it can be statically prerendered. Wrap the inner form
// component in <Suspense> at the page root.
export default function PreviewLoginPage() {
  return (
    <Suspense fallback={null}>
      <PreviewLoginInner />
    </Suspense>
  );
}

function PreviewLoginInner() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/preview-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: C.bgDeep }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ backgroundColor: C.bgCard }}
      >
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Image
            src="/brand/logomark.svg"
            alt="DataStrain"
            width={32}
            height={34}
            className="h-8 w-auto"
          />
          <span className="text-xl font-extrabold tracking-tight">
            <span style={{ color: C.secondary }}>Data</span>
            <span style={{ color: C.primary }}>Strain</span>
          </span>
        </div>

        <h1 className="mb-2 text-lg font-bold text-white">Preview Access</h1>
        <p className="mb-6 text-sm" style={{ color: C.textMuted }}>
          This site is currently in preview mode. Enter the access password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter access password"
            className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none"
            style={{
              backgroundColor: C.bgDeep,
              border: `1px solid ${error ? "#f87171" : `${C.textMuted}33`}`,
            }}
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-400">Incorrect password. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: C.primary, color: C.bgDeep }}
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>

        <p className="mt-6 text-xs" style={{ color: `${C.textMuted}66` }}>
          Contact hello@datastrain.co.uk for access.
        </p>
      </div>
    </div>
  );
}
