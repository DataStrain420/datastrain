"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import ProfileHeader, { ProfileUser } from "@/components/ProfileHeader";
import RankProgress from "@/components/RankProgress";
import EmblemGrid, { type Emblem } from "@/components/EmblemGrid";
import ReviewCard from "@/components/ReviewCard";
import StrainCard, { CardData } from "@/components/StrainCard";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const C = brand;

interface ReviewData {
  id: number;
  batch_id: number;
  strain_id: number | null;
  strain_name: string | null;
  batch_number: string | null;
  grower_id: number | null;
  grower_name: string | null;
  appearance_rating: number;
  aroma_rating: number;
  moisture_rating: number;
  flavour_rating: number;
  effect_rating: number;
  written_narrative: string | null;
  photo_product_url: string | null;
  photo_closeup_url: string | null;
  photo_packaging_url: string | null;
  effects: string[] | null;
  flavours: string[] | null;
  condition_ratings: { condition_name: string; efficacy_rating: number }[];
  helpful_votes: number;
  is_verified?: boolean;
  created_at: string;
}

interface PublicProfile extends ProfileUser {
  created_at: string;
  pinned_strain_id: number | null;
  reviews: ReviewData[] | null;
  emblems: Emblem[];
}

function SectionBox({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function PrivateMessage({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl p-5 text-center"
      style={{ backgroundColor: C.bgCard }}
    >
      <p className="text-sm" style={{ color: C.textMuted }}>
        {label}
      </p>
    </div>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pinnedCard, setPinnedCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isOwn = authUser?.username === username;

  useEffect(() => {
    async function load() {
      try {
        const p = await apiFetch<PublicProfile>(`/users/${username}`);
        setProfile(p);

        // Load pinned strain card
        if (p.pinned_strain_id) {
          const batches = await apiFetch<{ id: number }[]>(
            `/batches/?strain_id=${p.pinned_strain_id}&approved=true&limit=1`
          ).catch(() => []);
          if (batches.length > 0) {
            const card = await apiFetch<CardData>(`/batches/${batches[0].id}/card`).catch(() => null);
            if (card) setPinnedCard(card);
          }
        }
      } catch {
        setError(true);
      }
      setLoading(false);
    }
    load();
  }, [username]);

  async function toggleFollow() {
    if (!profile || !authUser) return;
    try {
      if (profile.is_following) {
        await apiFetch(`/users/${profile.id}/follow`, { method: "DELETE" });
        setProfile({ ...profile, is_following: false, follower_count: (profile.follower_count ?? 1) - 1 });
      } else {
        await apiFetch(`/users/${profile.id}/follow`, { method: "POST" });
        setProfile({ ...profile, is_following: true, follower_count: (profile.follower_count ?? 0) + 1 });
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: C.textMuted }}>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <Navbar rightSlot={<PublicNavActions />} showSearch />
        <div className="flex items-center justify-center py-24">
          <p style={{ color: C.textMuted }}>User not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Top section: Profile left, Emblems right ─────────────── */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left — Profile info */}
          <div>
            <ProfileHeader
              user={profile}
              isOwn={isOwn}
              onToggleFollow={!isOwn && authUser ? toggleFollow : undefined}
            />
            <p className="text-center text-xs" style={{ color: C.textMuted }}>
              Member since {new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Right — Emblems */}
          {profile.emblems && profile.emblems.length > 0 && (
            <div
              className="flex items-center rounded-2xl px-6 py-6"
              style={{ backgroundColor: C.bgCard }}
            >
              <EmblemGrid emblems={profile.emblems} />
            </div>
          )}
        </div>

        {/* ── Rank progression ──────────────────────────────────────── */}
        <RankProgress
          communityStatus={profile.community_status}
          kudosPoints={profile.kudos_points ?? null}
          subjectLabel={isOwn ? "You" : "Their rank"}
        />

        {/* ── Pinned Strain ────────────────────────────────────────────── */}
        {pinnedCard && (
          <SectionBox title="My Favourite Strain" icon={"\u{2B50}"}>
            <div className="mx-auto w-fit">
              <StrainCard card={pinnedCard} />
            </div>
          </SectionBox>
        )}

        {/* ── Reviews ──────────────────────────────────────────────────── */}
        <SectionBox title="Reviews" icon={"\u{1F4DD}"}>
          {profile.reviews === null ? (
            <PrivateMessage label="This user has chosen to keep their reviews private." />
          ) : profile.reviews.length === 0 ? (
            <PrivateMessage label="No reviews yet." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  id={r.id}
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  communityStatus={profile.community_status}
                  strainName={r.strain_name || "Unknown Strain"}
                  strainId={r.strain_id ?? undefined}
                  batchNumber={r.batch_number || ""}
                  batchId={r.batch_id}
                  growerName={r.grower_name || ""}
                  growerId={r.grower_id ?? undefined}
                  ratings={{
                    appearance: r.appearance_rating,
                    aroma: r.aroma_rating,
                    moisture: r.moisture_rating,
                    flavour: r.flavour_rating,
                    effect: r.effect_rating,
                  }}
                  narrative={r.written_narrative}
                  photos={[r.photo_product_url, r.photo_closeup_url, r.photo_packaging_url].filter((u): u is string => !!u)}
                  effects={r.effects || []}
                  flavours={r.flavours || []}
                  conditions={r.condition_ratings.map((c) => c.condition_name)}
                  helpfulVotes={r.helpful_votes}
                  createdAt={r.created_at}
                  verified={r.is_verified ?? true}
                />
              ))}
            </div>
          )}
        </SectionBox>
      </main>

      <Footer />
    </div>
  );
}
