"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import ProfileHeader from "@/components/ProfileHeader";
import EmblemGrid, { type Emblem } from "@/components/EmblemGrid";
import ReviewCard from "@/components/ReviewCard";
import StrainCard, { CardData } from "@/components/StrainCard";
import StrainTypeIcon from "@/components/StrainTypeIcon";
import MiniStrainCard from "@/components/MiniStrainCard";
import CoverFlowCarousel from "@/components/CoverFlowCarousel";
import RankProgress from "@/components/RankProgress";
import AvatarPicker from "@/components/AvatarPicker";

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
  // Rank progression
  current_status_threshold?: number;
  next_status?: string | null;
  next_status_label?: string | null;
  next_status_threshold?: number | null;
}

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
  status: string;
  created_at: string;
}

interface LibraryEntry {
  id: number;
  batch_id: number | null;
  strain_name: string | null;
  batch_number: string | null;
  list_type: string;
  created_at: string;
}

interface StrainOption {
  id: number;
  name: string;
  strain_type: string;
}


function SectionBox({ title, icon, privacyKey, isPublic, onToggle, children }: {
  title: string;
  icon: string;
  privacyKey?: string;
  isPublic?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <span>{icon}</span> {title}
        </h2>
        {privacyKey && onToggle && (
          <button
            onClick={onToggle}
            className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{
              backgroundColor: isPublic ? `${C.primary}22` : `${C.textMuted}22`,
              border: `1.5px solid ${isPublic ? C.primary : C.textMuted}44`,
              color: isPublic ? C.primary : C.textMuted,
            }}
          >
            {isPublic ? "\u{1F513}" : "\u{1F512}"} {isPublic ? "Public" : "Private"}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function PortalDashboard() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [pinnedCard, setPinnedCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [pinnedStrainId, setPinnedStrainId] = useState<number | null>(null);
  const [allStrains, setAllStrains] = useState<StrainOption[]>([]);
  const [strainSearch, setStrainSearch] = useState("");
  const [slogan, setSlogan] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [p, r, lib] = await Promise.all([
          apiFetch<MeProfile>("/users/me"),
          apiFetch<ReviewData[]>(`/reviews/?user_id=${authUser?.id}&status=`).catch(() => []),
          apiFetch<LibraryEntry[]>("/library/").catch(() => []),
        ]);
        setProfile(p);
        setBio(p.bio || "");
        setSlogan(p.slogan || "");
        setAvatarUrl(p.avatar_url || "");
        setPinnedStrainId(p.pinned_strain_id);
        setReviews(r);
        setLibrary(lib);

        // Load pinned strain
        if (p.pinned_strain_id) {
          const batches = await apiFetch<{ id: number }[]>(
            `/batches/?strain_id=${p.pinned_strain_id}&approved=true&limit=1`
          ).catch(() => []);
          if (batches.length > 0) {
            const card = await apiFetch<CardData>(`/batches/${batches[0].id}/card`).catch(() => null);
            if (card) setPinnedCard(card);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    if (authUser) load();
  }, [authUser]);

  async function openEditModal() {
    setEditing(true);
    // Fetch strains for the picker
    if (allStrains.length === 0) {
      apiFetch<StrainOption[]>("/strains/?limit=100")
        .then(setAllStrains)
        .catch(() => {});
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch<MeProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          bio: bio || null,
          slogan: slogan || null,
          avatar_url: avatarUrl || null,
          pinned_strain_id: pinnedStrainId,
        }),
      });
      setProfile(updated);
      setEditing(false);

      // Reload pinned card if changed
      if (pinnedStrainId && pinnedStrainId !== profile?.pinned_strain_id) {
        const batches = await apiFetch<{ id: number }[]>(
          `/batches/?strain_id=${pinnedStrainId}&approved=true&limit=1`
        ).catch(() => []);
        if (batches.length > 0) {
          const card = await apiFetch<CardData>(`/batches/${batches[0].id}/card`).catch(() => null);
          setPinnedCard(card);
        } else {
          setPinnedCard(null);
        }
      } else if (!pinnedStrainId) {
        setPinnedCard(null);
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function togglePrivacy(key: string) {
    if (!profile) return;
    // Cast via unknown so TS allows narrowing MeProfile to an index signature.
    const current = (profile as unknown as Record<string, unknown>)[key] as boolean;
    try {
      const updated = await apiFetch<MeProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ [key]: !current }),
      });
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  }

  if (!authUser) {
    return <p className="py-12 text-center" style={{ color: C.textMuted }}>Please sign in to view your dashboard.</p>;
  }

  if (loading || !profile) {
    return <p className="py-12 text-center" style={{ color: C.textMuted }}>Loading dashboard...</p>;
  }

  const fireList = library.filter((e) => e.list_type === "favourite");
  const wishlist = library.filter((e) => e.list_type === "wishlist");
  const triedList = library.filter((e) => e.list_type === "tried");
  const approvedReviews = reviews.filter((r) => r.status === "approved");

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Top section: Profile left, Strain Card right ─────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left — Profile info */}
        <div>
          <ProfileHeader
            user={profile}
            isOwn
            onEdit={openEditModal}
          />
        </div>

        {/* Right — Showcase pedestal for the user's pinned favourite strain.
            Same outer dimensions as the bio card (so the heights align) but
            with a darker, vignetted backdrop, a soft brand glow behind the
            card, and a faint pedestal line beneath it so the card feels
            "displayed" rather than just "contained". */}
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-2xl px-6 pb-7 pt-5"
          style={{
            background: `radial-gradient(ellipse at 50% 45%, ${C.bgCard} 0%, ${C.bgDeep} 75%)`,
            border: `1px solid ${C.textMuted}22`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 0 80px rgba(0,0,0,0.35)`,
          }}
        >
          {/* Soft brand-tinted spotlight behind the card */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 420,
              height: 420,
              background: `radial-gradient(circle, ${C.primary}22 0%, ${C.secondary}10 35%, transparent 70%)`,
              filter: "blur(4px)",
            }}
          />

          <div
            className="relative z-10 flex flex-1 items-center justify-center"
            style={{ perspective: "1100px" }}
          >
            {pinnedCard ? (
              // Clear-plastic protective sleeve — top-loader / graded-card feel.
              // A thin glassy frame around the strain card with subtle highlights
              // on the top/left edges, a soft shadow on the bottom/right, and a
              // faint diagonal "glare" overlay for the behind-plastic look.
              // Sleeve sits stationary on the pedestal; only the card slides
              // into it. Once the drop completes, the WHOLE sleeve (this div)
              // peeks to the side to reveal that the card can be flipped.
              <div
                className="sleeve-peek relative mx-auto w-fit max-w-full rounded-[20px] p-2.5"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.01) 30%, rgba(255,255,255,0.03) 70%, rgba(255,255,255,0.08) 100%)`,
                  border: `1px solid rgba(255,255,255,0.18)`,
                  boxShadow: `
                    0 20px 48px rgba(0,0,0,0.55),
                    0 0 0 1px rgba(255,255,255,0.04),
                    inset 0 1px 0 rgba(255,255,255,0.22),
                    inset 0 -1px 0 rgba(0,0,0,0.22)
                  `,
                }}
              >
                <div className="drop-into-sleeve">
                  <StrainCard card={pinnedCard} />
                </div>

                {/* Diagonal glare — faint specular highlight across the top-left
                    of the sleeve to sell the "light on plastic" effect. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]"
                  style={{
                    background: `linear-gradient(118deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 14%, transparent 28%, transparent 70%, rgba(255,255,255,0.04) 88%, rgba(255,255,255,0.09) 100%)`,
                    mixBlendMode: "screen",
                  }}
                />
              </div>
            ) : (
              <div
                className="flex h-[460px] w-full max-w-[340px] flex-col items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${C.bgDeep}cc`,
                  border: `2px dashed ${C.textMuted}33`,
                }}
              >
                <span className="text-4xl">{"\u{2B50}"}</span>
                <p className="mt-3 text-sm font-medium" style={{ color: C.textMuted }}>No favourite strain set</p>
                <button
                  onClick={openEditModal}
                  className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: C.primary, color: C.bgDeep }}
                >
                  Set Favourite Strain
                </button>
              </div>
            )}
          </div>

          {/* Pedestal line — faint reflective gradient beneath the card */}
          <div
            aria-hidden
            className="pointer-events-none relative z-10 mx-auto mt-4 h-px w-3/4"
            style={{
              background: `linear-gradient(90deg, transparent, ${C.primary}55, transparent)`,
            }}
          />

          {/* Label sits beneath the pedestal — reads as a museum-style placard */}
          <h2 className="relative z-10 mt-4 flex items-center justify-center gap-2 text-lg font-bold text-white">
            <span aria-hidden>{"\u{1F525}"}</span> Favourite Strain
          </h2>
        </div>
      </div>

      {/* ── Rank progression — full width, below the bio + strain grid ─ */}
      <RankProgress
        communityStatus={profile.community_status}
        kudosPoints={profile.kudos_points}
        currentStatusThreshold={profile.current_status_threshold ?? 0}
        nextStatus={profile.next_status ?? null}
        nextStatusLabel={profile.next_status_label ?? null}
        nextStatusThreshold={profile.next_status_threshold ?? null}
      />

      {/* ── Edit Form (modal overlay) ──────────────────────────────── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => { setEditing(false); setBio(profile.bio || ""); setSlogan(profile.slogan || ""); setAvatarUrl(profile.avatar_url || ""); setPinnedStrainId(profile.pinned_strain_id); setStrainSearch(""); }}
        >
          <div
            className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
            style={{ backgroundColor: C.bgCard, border: `1px solid ${C.secondary}33`, boxShadow: `0 0 60px ${C.secondary}15` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-white transition hover:opacity-80"
              style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}44` }}
              onClick={() => { setEditing(false); setBio(profile.bio || ""); setSlogan(profile.slogan || ""); setAvatarUrl(profile.avatar_url || ""); setPinnedStrainId(profile.pinned_strain_id); setStrainSearch(""); }}
            >
              &times;
            </button>
            <h3 className="mb-5 text-lg font-bold text-white">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: C.textMuted }}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={250}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                  placeholder="Tell others about yourself..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: C.textMuted }}>Slogan / Phrase</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  maxLength={150}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                  placeholder="Your personal motto..."
                />
              </div>
              <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} />

              {/* Favourite strain picker */}
              <div>
                <label className="mb-2 block text-xs font-medium" style={{ color: C.textMuted }}>Favourite Strain</label>
                <input
                  type="text"
                  value={strainSearch}
                  onChange={(e) => setStrainSearch(e.target.value)}
                  className="mb-2 w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                  placeholder="Search strains..."
                />
                <div
                  className="max-h-40 overflow-y-auto rounded-lg p-2"
                  style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}22` }}
                >
                  {(strainSearch
                    ? allStrains.filter((s) => s.name.toLowerCase().includes(strainSearch.toLowerCase()))
                    : allStrains
                  ).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setPinnedStrainId(s.id); setStrainSearch(""); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:brightness-125"
                      style={{
                        backgroundColor: pinnedStrainId === s.id ? `${C.primary}22` : "transparent",
                        border: pinnedStrainId === s.id ? `1px solid ${C.primary}55` : "1px solid transparent",
                        color: pinnedStrainId === s.id ? C.primary : "white",
                      }}
                    >
                      <StrainTypeIcon type={s.strain_type} size={14} />
                      <span className="font-medium">{s.name}</span>
                      {pinnedStrainId === s.id && (
                        <span className="ml-auto text-xs" style={{ color: C.primary }}>{"\u2713"}</span>
                      )}
                    </button>
                  ))}
                  {allStrains.length === 0 && (
                    <p className="py-2 text-center text-xs" style={{ color: C.textMuted }}>Loading strains...</p>
                  )}
                </div>
                {pinnedStrainId && (
                  <button
                    onClick={() => setPinnedStrainId(null)}
                    className="mt-2 text-xs transition hover:opacity-80"
                    style={{ color: C.textMuted }}
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="rounded-lg px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: C.primary, color: C.bgDeep }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => { setEditing(false); setBio(profile.bio || ""); setSlogan(profile.slogan || ""); setAvatarUrl(profile.avatar_url || ""); setPinnedStrainId(profile.pinned_strain_id); setStrainSearch(""); }} className="rounded-lg px-5 py-2.5 text-sm font-medium transition hover:opacity-80" style={{ color: C.textMuted }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Privacy Settings ──────────────────────────────────────── */}
      <SectionBox title="Privacy Settings" icon={"\u{1F512}"}>
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}15` }}
        >
          <p className="mb-4 text-xs" style={{ color: C.textMuted }}>
            Control what others can see on your public profile.
          </p>
          <div className="space-y-3">
            {([
              { key: "show_bio", label: "Show bio on public profile", description: "Your bio text will be visible to other users" },
              { key: "show_reviews", label: "Show my reviews publicly", description: "Your strain reviews will appear on your public profile" },
              { key: "show_conditions", label: "Show conditions I review for", description: "Medical conditions you mention in reviews will be visible" },
              { key: "show_effects", label: "Show effect preferences", description: "Effects you report in reviews will be visible" },
              { key: "show_library", label: "Show my library", description: "Your tried, wishlist, and favourites will be visible" },
              { key: "show_followers", label: "Show follower count", description: "Your follower and following counts will be visible" },
              { key: "show_kudos", label: "Show kudos & rank", description: "Your kudos points and community rank will be visible" },
            ] as const).map((opt) => {
              const isOn = (profile as unknown as Record<string, unknown>)[opt.key] as boolean;
              return (
                <div key={opt.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>{opt.description}</p>
                  </div>
                  <button
                    onClick={() => togglePrivacy(opt.key)}
                    className="relative shrink-0 rounded-full transition"
                    style={{ backgroundColor: isOn ? C.primary : `${C.textMuted}33`, width: 40, height: 22 }}
                  >
                    <span
                      className="absolute rounded-full bg-white shadow transition-transform"
                      style={{ width: 16, height: 16, top: 3, left: 3, transform: isOn ? "translateX(18px)" : "translateX(0)" }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </SectionBox>

      {/* ── Emblems ───────────────────────────────────────────────── */}
      {profile.emblems.length > 0 && (
        <SectionBox title="Emblems" icon={"\u{1F3C5}"}>
          <div
            className="rounded-2xl px-6 py-6"
            style={{ backgroundColor: C.bgCard }}
          >
            <EmblemGrid emblems={profile.emblems} />
          </div>
        </SectionBox>
      )}

      {/* ── My Reviews ──────────────────────────────────────────────── */}
      <SectionBox
        title={`My Reviews (${approvedReviews.length})`}
        icon={"\u{1F4DD}"}
        privacyKey="show_reviews"
        isPublic={profile.show_reviews}
        onToggle={() => togglePrivacy("show_reviews")}
      >
        {approvedReviews.length === 0 ? (
          <div className="rounded-xl p-6 text-center" style={{ backgroundColor: C.bgCard }}>
            <p className="text-sm" style={{ color: C.textMuted }}>No reviews yet.</p>
            <Link
              href="/portal/review/new"
              className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              style={{ backgroundColor: C.primary, color: C.bgDeep }}
            >
              Write Your First Review
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approvedReviews.map((r) => (
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
              />
            ))}
          </div>
        )}
      </SectionBox>

      {/* ── Fire List ───────────────────────────────────────────────── */}
      <SectionBox
        title={`Fire \u{1F525} (${fireList.length})`}
        icon={"\u{1F525}"}
        privacyKey="show_library"
        isPublic={profile.show_library}
        onToggle={() => togglePrivacy("show_library")}
      >
        {fireList.length === 0 ? (
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: C.bgCard }}>
            <p className="text-sm" style={{ color: C.textMuted }}>No fire strains yet. Hit the fire button on strain cards!</p>
          </div>
        ) : (
          <CoverFlowCarousel>
            {fireList.map((e) => (
              <MiniStrainCard key={e.id} batchId={e.batch_id} strainName={e.strain_name || "Unknown"} batchNumber={e.batch_number} />
            ))}
          </CoverFlowCarousel>
        )}
      </SectionBox>

      {/* ── Wishlist ────────────────────────────────────────────────── */}
      <SectionBox
        title={`Wishlist (${wishlist.length})`}
        icon={"\u{1F4CB}"}
        privacyKey="show_library"
        isPublic={profile.show_library}
        onToggle={() => togglePrivacy("show_library")}
      >
        {wishlist.length === 0 ? (
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: C.bgCard }}>
            <p className="text-sm" style={{ color: C.textMuted }}>Your wishlist is empty. Add strains from strain cards!</p>
          </div>
        ) : (
          <CoverFlowCarousel>
            {wishlist.map((e) => (
              <MiniStrainCard key={e.id} batchId={e.batch_id} strainName={e.strain_name || "Unknown"} batchNumber={e.batch_number} />
            ))}
          </CoverFlowCarousel>
        )}
      </SectionBox>

      {/* ── Tried ───────────────────────────────────────────────────── */}
      <SectionBox
        title={`Tried (${triedList.length})`}
        icon={"\u{2705}"}
        privacyKey="show_library"
        isPublic={profile.show_library}
        onToggle={() => togglePrivacy("show_library")}
      >
        {triedList.length === 0 ? (
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: C.bgCard }}>
            <p className="text-sm" style={{ color: C.textMuted }}>No tried strains yet. Mark strains as tried from strain cards!</p>
          </div>
        ) : (
          <CoverFlowCarousel>
            {triedList.map((e) => (
              <MiniStrainCard key={e.id} batchId={e.batch_id} strainName={e.strain_name || "Unknown"} batchNumber={e.batch_number} />
            ))}
          </CoverFlowCarousel>
        )}
      </SectionBox>
    </div>
  );
}
