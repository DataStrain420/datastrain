"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { brand } from "@/lib/brand";

const C = brand;
const REVIEW_PATH = "/portal/review/new";

// Gateway to the review flow. Signed-in patients bounce straight through
// to the real form; signed-out visitors get a friendly explainer with two
// prominent CTAs that carry a ?redirect back to this same route so once
// they finish auth they land where they intended to go.
export default function WriteReviewGatewayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(REVIEW_PATH);
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: C.bgDeep }}>
        <p style={{ color: C.textMuted }}>Loading...</p>
      </div>
    );
  }

  const redirectQuery = `?redirect=${encodeURIComponent(REVIEW_PATH)}`;

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
        <div
          className="w-full rounded-2xl p-8 sm:p-10"
          style={{
            background: `linear-gradient(135deg, ${C.bgCard} 0%, ${C.bgDeep} 100%)`,
            border: `1px solid ${C.primary}33`,
          }}
        >
          <span
            className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{
              backgroundColor: `${C.primary}18`,
              border: `1px solid ${C.primary}55`,
              color: C.primary,
            }}
            aria-hidden
          >
            {"\u{270D}\u{FE0F}"}
          </span>
          <p
            className="mb-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: C.primary }}
          >
            Contribute a review
          </p>
          <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            Sign in to share your experience
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm sm:text-base" style={{ color: C.textMuted }}>
            Reviews are tied to a verified patient account so other patients can trust
            what they read. It only takes a minute to create one — and you can come
            straight back here to write your review.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href={`/register${redirectQuery}`}
              className="rounded-lg px-6 py-3 text-sm font-bold transition hover:opacity-90"
              style={{ backgroundColor: C.primary, color: C.bgDeep }}
            >
              Create an account
            </Link>
            <Link
              href={`/login${redirectQuery}`}
              className="rounded-lg border px-6 py-3 text-sm font-semibold transition hover:brightness-110"
              style={{
                borderColor: `${C.secondary}66`,
                color: C.secondary,
                backgroundColor: `${C.secondary}12`,
              }}
            >
              I already have an account
            </Link>
          </div>

          <p className="mt-6 text-xs" style={{ color: C.textMuted }}>
            You&apos;ll need a valid UK medical cannabis prescription to sign up.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            { icon: "\u{1F9EA}", title: "Batch-Linked", desc: "Every review ties to a specific tested batch." },
            { icon: "\u{1F4F8}", title: "Photos Required", desc: "Product, close-up and packaging keep it real." },
            { icon: "\u{2696}\u{FE0F}", title: "Moderated", desc: "Wrong or bad-faith reviews get removed." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl p-4"
              style={{
                backgroundColor: C.bgCard,
                border: `1px solid ${C.textMuted}15`,
              }}
            >
              <div className="mb-2 text-xl" aria-hidden>{item.icon}</div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="mt-1 text-xs" style={{ color: C.textMuted }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
