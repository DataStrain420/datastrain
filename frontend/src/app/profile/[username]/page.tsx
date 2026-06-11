"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import ProfileHeader, { type ProfileUser } from "@/components/ProfileHeader";
import EmblemGrid, { type Emblem } from "@/components/EmblemGrid";

const C = brand;

interface PublicProfile extends ProfileUser {
  emblems: Emblem[];
  is_following: boolean;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    apiFetch<PublicProfile>(`/users/${username}`)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  async function toggleFollow() {
    if (!profile) return;
    try {
      if (profile.is_following) {
        await apiFetch(`/users/${profile.id}/follow`, { method: "DELETE" });
        setProfile({
          ...profile,
          is_following: false,
          follower_count: Math.max(0, profile.follower_count - 1),
        });
      } else {
        await apiFetch(`/users/${profile.id}/follow`, { method: "POST" });
        setProfile({
          ...profile,
          is_following: true,
          follower_count: profile.follower_count + 1,
        });
      }
    } catch (err: any) {
      console.error("Follow toggle failed:", err);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} />

      <main className="mx-auto max-w-lg px-4 py-6">
        {loading && (
          <p className="py-12 text-center" style={{ color: C.textMuted }}>
            Loading profile...
          </p>
        )}

        {error && (
          <p className="py-12 text-center text-red-400">{error}</p>
        )}

        {profile && (
          <>
            <ProfileHeader
              user={profile}
              onToggleFollow={toggleFollow}
            />

            <div
              className="mt-2 rounded-2xl px-6 py-6"
              style={{ backgroundColor: C.bgCard }}
            >
              <EmblemGrid emblems={profile.emblems} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
