"use client";

import { brand } from "@/lib/brand";
import { useState } from "react";

/** Resolve avatar URLs — backend-relative paths need the API host prefix */
function resolveAvatarUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";
    // Strip /api/v1 to get the host
    return apiBase.replace(/\/api\/v1$/, "") + url;
  }
  return url;
}

const C = brand;

export interface ProfileUser {
  id: number;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  community_status: string;
  kudos_points: number;
  follower_count: number;
  review_count: number;
  is_following?: boolean;
  slogan?: string | null;
}

interface ProfileHeaderProps {
  user: ProfileUser;
  /** True if viewing own profile */
  isOwn?: boolean;
  /** Called when follow/unfollow is toggled */
  onToggleFollow?: () => void;
  /** Called when user clicks Edit Profile */
  onEdit?: () => void;
}

export default function ProfileHeader({ user, isOwn, onToggleFollow, onEdit }: ProfileHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasAvatar = user.avatar_url && !imgError;

  return (
    <div
      className="flex h-full flex-col rounded-2xl px-6 pb-7 pt-5"
      style={{
        backgroundColor: C.bgCard,
        border: `1px solid ${C.textMuted}22`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.25)`,
      }}
    >
      {/* ── Section header ──────────────────────────────────────────── */}
      <h2 className="mb-5 flex items-center justify-center gap-2 text-lg font-bold text-white">
        <span aria-hidden>{"\u{1F464}"}</span> Profile
      </h2>

      {/* ── Avatar (centered) ───────────────────────────────────────── */}
      <div className="flex justify-center">
        <div
          className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl"
          style={{
            backgroundColor: C.bgDeep,
            border: `2px solid ${C.secondary}55`,
            boxShadow: `0 0 36px ${C.secondary}1f, 0 8px 24px rgba(0,0,0,0.35)`,
            cursor: hasAvatar ? "pointer" : "default",
          }}
          onClick={() => hasAvatar && setLightboxOpen(true)}
        >
          {hasAvatar ? (
            <img
              src={resolveAvatarUrl(user.avatar_url!)}
              alt={user.username}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <AvatarPlaceholder />
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && hasAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[80vh] max-w-[90vw]">
            <img
              src={resolveAvatarUrl(user.avatar_url!)}
              alt={user.username}
              className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain"
              style={{ boxShadow: `0 0 60px ${C.secondary}30` }}
            />
            <button
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-white transition hover:opacity-80"
              style={{ backgroundColor: C.bgCard, border: `1px solid ${C.textMuted}44` }}
              onClick={() => setLightboxOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* ── Action button (Edit / Follow) ───────────────────────────── */}
      <div className="mt-4 flex justify-center">
        {!isOwn && onToggleFollow && (
          <button
            onClick={onToggleFollow}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition hover:opacity-85"
            style={{
              backgroundColor: user.is_following ? "#f8717118" : `${C.primary}18`,
              border: `1px solid ${user.is_following ? "#f8717166" : `${C.primary}55`}`,
              color: user.is_following ? "#f87171" : C.primary,
            }}
          >
            <span className="text-sm">{user.is_following ? "❤️" : "\u{1F90D}"}</span>
            {user.is_following ? "Following" : "Favourite"}
          </button>
        )}
        {isOwn && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition hover:opacity-85"
            style={{
              backgroundColor: `${C.primary}18`,
              border: `1px solid ${C.primary}55`,
              color: C.primary,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Username ────────────────────────────────────────────────── */}
      <h1
        className="mt-4 text-center text-2xl font-extrabold tracking-tight"
        style={{ color: C.secondary }}
      >
        {user.username}
      </h1>

      {/* ── Slogan ──────────────────────────────────────────────────── */}
      {user.slogan && (
        <div className="mt-2 flex justify-center">
          <p
            className="relative mx-auto max-w-[280px] px-5 text-center text-sm italic"
            style={{ color: C.primary }}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 font-serif text-lg leading-none"
              style={{ color: `${C.primary}88` }}
            >
              &ldquo;
            </span>
            {user.slogan}
            <span
              aria-hidden
              className="absolute -bottom-1 right-0 font-serif text-lg leading-none"
              style={{ color: `${C.primary}88` }}
            >
              &rdquo;
            </span>
          </p>
        </div>
      )}

      {/* ── Bio ─────────────────────────────────────────────────────── */}
      {user.bio && (
        <p
          className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-relaxed"
          style={{ color: C.textMuted }}
        >
          {user.bio}
        </p>
      )}

      {/* ── Divider + stats — pinned to the bottom via mt-auto so the bio
              card matches the height of the favourite-strain card. ──────── */}
      <div className="mt-auto pt-5">
        <div
          className="mb-5 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${C.textMuted}44, transparent)`,
          }}
        />
        <div
          className="grid grid-cols-3 overflow-hidden rounded-xl"
          style={{
            backgroundColor: C.bgDeep,
            border: `1px solid ${C.textMuted}22`,
          }}
        >
          <Stat label="Reviews" value={user.review_count} accent={C.primary} />
          <Stat label="Followers" value={user.follower_count} accent={C.secondary} divider />
          <Stat label="Kudos" value={user.kudos_points} accent="#f9cf58" divider />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  divider,
}: {
  label: string;
  value: number;
  accent: string;
  divider?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center px-2 py-3 text-center"
      style={divider ? { borderLeft: `1px solid ${C.textMuted}22` } : undefined}
    >
      <span className="text-xl font-extrabold leading-none text-white">
        {value.toLocaleString()}
      </span>
      <span
        className="mt-1 text-[10px] font-bold uppercase tracking-wider"
        style={{ color: accent }}
      >
        {label}
      </span>
    </div>
  );
}

function AvatarPlaceholder() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="45" r="22" fill={C.textMuted} opacity="0.3" />
      <ellipse cx="60" cy="95" rx="32" ry="22" fill={C.textMuted} opacity="0.2" />
    </svg>
  );
}
