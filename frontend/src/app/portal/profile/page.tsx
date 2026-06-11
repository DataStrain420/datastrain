"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { brand } from "@/lib/brand";
import ProfileHeader from "@/components/ProfileHeader";
import EmblemGrid, { type Emblem } from "@/components/EmblemGrid";

const C = brand;

interface MeProfile {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  slogan: string | null;
  avatar_url: string | null;
  pinned_strain_id: number | null;
  community_status: string;
  kudos_points: number;
  follower_count: number;
  following_count: number;
  review_count: number;
  is_verified: boolean;
  created_at: string;
  emblems: Emblem[];
  show_bio: boolean;
  show_conditions: boolean;
  show_reviews: boolean;
  show_library: boolean;
  show_followers: boolean;
  show_kudos: boolean;
  show_effects: boolean;
}

const privacyOptions = [
  { key: "show_bio", label: "Show bio on public profile", description: "Your bio text will be visible to other users" },
  { key: "show_reviews", label: "Show my reviews publicly", description: "Your strain reviews will appear on your public profile" },
  { key: "show_conditions", label: "Show conditions I review for", description: "Medical conditions you mention in reviews will be visible" },
  { key: "show_effects", label: "Show effect preferences", description: "Effects you report in reviews will be visible" },
  { key: "show_library", label: "Show my library", description: "Your tried, wishlist, and favourites will be visible" },
  { key: "show_followers", label: "Show follower count", description: "Your follower and following counts will be visible" },
  { key: "show_kudos", label: "Show kudos & rank", description: "Your kudos points and community rank will be visible" },
] as const;

export default function PortalProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [slogan, setSlogan] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    apiFetch<MeProfile>("/users/me")
      .then((data) => {
        setProfile(data);
        setBio(data.bio || "");
        setSlogan(data.slogan || "");
        setAvatarUrl(data.avatar_url || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch<MeProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          bio: bio || null,
          slogan: slogan || null,
          avatar_url: avatarUrl || null,
        }),
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function togglePrivacy(key: string) {
    if (!profile) return;
    setSavingPrivacy(true);
    const current = (profile as Record<string, unknown>)[key] as boolean;
    try {
      const updated = await apiFetch<MeProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ [key]: !current }),
      });
      setProfile(updated);
    } catch (err) {
      console.error("Privacy update failed:", err);
    } finally {
      setSavingPrivacy(false);
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center" style={{ color: C.textMuted }}>
        Loading profile...
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="py-12 text-center text-red-400">Failed to load profile</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <ProfileHeader
        user={profile}
        isOwn
        onEdit={() => setEditing(!editing)}
      />

      {/* Edit form */}
      {editing && (
        <div
          className="mx-4 mb-6 rounded-2xl p-5"
          style={{
            backgroundColor: C.bgCard,
            border: `1px solid ${C.secondary}22`,
          }}
        >
          <h3 className="mb-4 text-sm font-bold" style={{ color: C.textMuted }}>
            Edit Profile
          </h3>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs" style={{ color: C.textMuted }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={250}
                className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                style={{
                  backgroundColor: C.bgDeep,
                  border: `1px solid ${C.textMuted}33`,
                }}
                placeholder="Tell others about yourself..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: C.textMuted }}>
                Slogan / Phrase
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                maxLength={150}
                className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                style={{
                  backgroundColor: C.bgDeep,
                  border: `1px solid ${C.textMuted}33`,
                }}
                placeholder="Your personal motto or phrase..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: C.textMuted }}>
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                style={{
                  backgroundColor: C.bgDeep,
                  border: `1px solid ${C.textMuted}33`,
                }}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: C.primary, color: C.bgDeep }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setBio(profile.bio || "");
                  setSlogan(profile.slogan || "");
                  setAvatarUrl(profile.avatar_url || "");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-80"
                style={{ color: C.textMuted }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <div
        className="mx-4 mb-6 rounded-2xl p-5"
        style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
      >
        <h3 className="mb-1 text-sm font-bold text-white">Privacy Settings</h3>
        <p className="mb-4 text-xs" style={{ color: C.textMuted }}>
          Control what others can see on your public profile.
        </p>

        <div className="space-y-3">
          {privacyOptions.map((opt) => {
            const isOn = (profile as Record<string, unknown>)[opt.key] as boolean;
            return (
              <div key={opt.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>{opt.description}</p>
                </div>
                <button
                  onClick={() => togglePrivacy(opt.key)}
                  disabled={savingPrivacy}
                  className="relative h-6 w-11 shrink-0 rounded-full transition"
                  style={{ backgroundColor: isOn ? C.primary : `${C.textMuted}33` }}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: isOn ? "translateX(22px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emblems */}
      <div
        className="mx-4 rounded-2xl px-6 py-6"
        style={{ backgroundColor: C.bgCard }}
      >
        <EmblemGrid emblems={profile.emblems} />
      </div>
    </div>
  );
}
