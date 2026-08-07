"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getTier } from "@/lib/ranks";

interface CommentData {
  id: number;
  review_id: number;
  user_id: number;
  username: string | null;
  avatar_url: string | null;
  text: string;
  created_at: string;
}

interface ReviewCardProps {
  id: number;
  username: string;
  avatarUrl?: string | null;
  /** Reviewer's community rank tier (e.g. "seedling", "sprout"...). Used to
   *  render a small rank-icon badge overlapping the avatar. */
  communityStatus?: string | null;
  strainName: string;
  strainId?: number;
  batchNumber: string;
  batchId?: number;
  growerName: string;
  growerId?: number;
  ratings: {
    appearance: number;
    aroma: number;
    moisture: number;
    flavour: number;
    effect: number;
  };
  narrative: string | null;
  photos: string[];
  effects: string[];
  flavours: string[];
  conditions: string[];
  helpfulVotes: number;
  createdAt: string;
  /** True when an admin has verified the review. Unverified reviews still
   *  render but pick up a badge and are excluded from aggregate stats
   *  server-side. */
  verified?: boolean;
}

/** Reviewer avatar — small circular image (36px) next to the username in the
 *  review-card header. Falls back to a coloured circle with the reviewer's
 *  first initial when they haven't uploaded a photo. The community rank is
 *  rendered separately by `RankPill`. */
function ReviewerAvatar({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl?: string | null;
}) {
  const [errored, setErrored] = useState(false);
  const resolved = avatarUrl && !errored ? (
    avatarUrl.startsWith("/uploads/")
      ? `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace(/\/api\/v1\/?$/, "")}${avatarUrl}`
      : avatarUrl
  ) : null;

  if (resolved) {
    return (
      <img
        src={resolved}
        alt={username}
        onError={() => setErrored(true)}
        className="h-12 w-12 rounded-full object-cover transition hover:brightness-110"
        style={{ border: `1.5px solid ${brand.primary}55` }}
      />
    );
  }
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold transition hover:brightness-110"
      style={{
        backgroundColor: `${brand.primary}22`,
        color: brand.primary,
        border: `1.5px solid ${brand.primary}55`,
      }}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

/** Small rank pill — icon + tier label, coloured to the tier. Lives next to
 *  the username in the review-card header in place of the review date (which
 *  has moved to the card footer). */
function RankPill({ communityStatus }: { communityStatus: string }) {
  const tier = getTier(communityStatus);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight"
      style={{
        backgroundColor: `${tier.color}22`,
        color: tier.color,
        border: `1px solid ${tier.color}55`,
      }}
      title={tier.label}
    >
      <span aria-hidden>{tier.icon}</span>
      {tier.label}
    </span>
  );
}

/** Map a 0–5 rating to an RGB colour. Red at 0, yellow in the middle (2.5),
 *  brand-primary green at 5. Piece-wise linear interpolation between the
 *  three stops so the gradient feels even from end to end. */
function ratingRGB(score: number): { r: number; g: number; b: number } {
  const clamped = Math.max(0, Math.min(5, score));
  const RED = { r: 239, g: 68, b: 68 };     // #ef4444
  const YELLOW = { r: 250, g: 204, b: 21 }; // #facc15
  const GREEN = { r: 81, g: 237, b: 146 };  // brand.primary (#51ed92)

  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  if (clamped <= 2.5) {
    const t = clamped / 2.5;
    return { r: lerp(RED.r, YELLOW.r, t), g: lerp(RED.g, YELLOW.g, t), b: lerp(RED.b, YELLOW.b, t) };
  }
  const t = (clamped - 2.5) / 2.5;
  return { r: lerp(YELLOW.r, GREEN.r, t), g: lerp(YELLOW.g, GREEN.g, t), b: lerp(YELLOW.b, GREEN.b, t) };
}

function avgRating(r: ReviewCardProps["ratings"]): number {
  return (r.appearance + r.aroma + r.moisture + r.flavour + r.effect) / 5;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

const ratingLabels = [
  { key: "appearance" as const, label: "Look" },
  { key: "aroma" as const, label: "Aroma" },
  { key: "moisture" as const, label: "Moisture" },
  { key: "flavour" as const, label: "Flavour" },
  { key: "effect" as const, label: "Effect" },
];

/** Hexagon shape with score inside */
/** Opacity scales with score: 1=20%, 2=40%, 3=60%, 4=80%, 5=100% */
function hexOpacity(score: number): string {
  const hex = Math.round((score / 5) * 255).toString(16).padStart(2, "0");
  return hex;
}

function HexRating({ score, label }: { score: number; label: string }) {
  const fillOpacity = score / 5;
  const strokeColor = `${brand.primary}${hexOpacity(score)}`;
  const textColor = `${brand.primary}${hexOpacity(Math.max(score, 2))}`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-11 w-11">
        {/* Hexagon background */}
        <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
          <path
            d="M219.9,66.7l-84,-47.4c-4.888,-2.799 -10.912,-2.799 -15.8,0l-84,47.4c-4.997,2.885 -8.089,8.23 -8.1,14l0,94.6c0.011,5.77 3.103,11.115 8.1,14l84,47.4c4.888,2.799 10.912,2.799 15.8,0l84,-47.4c4.997,-2.885 8.089,-8.23 8.1,-14l0,-94.6c-0.011,-5.77 -3.103,-11.115 -8.1,-14Z"
            fill={brand.primary}
            fillOpacity={fillOpacity * 0.25}
            stroke={strokeColor}
            strokeWidth="8"
          />
        </svg>
        {/* Score text */}
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          style={{ color: textColor }}
        >
          {score}
        </span>
      </div>
      <span className="text-[10px]" style={{ color: brand.textMuted }}>
        {label}
      </span>
    </div>
  );
}

export default function ReviewCard({
  id,
  username,
  avatarUrl,
  communityStatus,
  strainName,
  strainId,
  batchNumber,
  batchId,
  growerName,
  growerId,
  ratings,
  narrative,
  photos,
  effects,
  flavours,
  conditions,
  helpfulVotes,
  createdAt,
  verified = true,
}: ReviewCardProps) {
  const { user: authUser } = useAuth();
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(helpfulVotes);
  const [reported, setReported] = useState(false);
  const avg = avgRating(ratings);

  // Fetch the batch's strain image for the small thumbnail next to the
  // strain name. The reviews endpoint doesn't include strain_image_url, so
  // we hit the cards endpoint per review. Small (one-time) extra request.
  // Default to the bundled placeholder so the thumbnail slot always renders;
  // overwrites with the real strain image once the per-batch card fetch
  // resolves (if the batch has one).
  const STRAIN_PLACEHOLDER = "/images/strain-placeholder.png";
  const [strainImage, setStrainImage] = useState<string>(STRAIN_PLACEHOLDER);
  useEffect(() => {
    if (!batchId) return;
    apiFetch<{ strain_image_url?: string | null }>(`/batches/${batchId}/card`)
      .then((c) => {
        if (!c.strain_image_url) return;
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace(/\/api\/v1\/?$/, "");
        const url = c.strain_image_url.startsWith("http") || c.strain_image_url.startsWith("/images/")
          ? c.strain_image_url
          : `${apiBase}${c.strain_image_url}`;
        setStrainImage(url);
      })
      .catch(() => {});
  }, [batchId]);

  // Comments state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const data = await apiFetch<CommentData[]>(`/reviews/${id}/comments`);
      setComments(data);
    } catch {
      // silently fail
    }
    setLoadingComments(false);
  }

  function toggleComments() {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments.length === 0) loadComments();
  }

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await apiFetch<CommentData>(`/reviews/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch {
      // not logged in
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await apiFetch(`/reviews/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // not own comment or not logged in
    }
  }

  async function handleLike() {
    try {
      if (liked) {
        await apiFetch(`/reviews/${id}/helpful`, { method: "DELETE" });
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await apiFetch(`/reviews/${id}/helpful`, { method: "POST" });
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch {
      // User not logged in or already voted — silently fail
    }
  }

  function handleReport() {
    setReported(!reported);
    // TODO: wire to backend report endpoint when built
  }

  return (
    <>
      <div
        className="flex flex-col rounded-2xl p-5"
        style={{
          backgroundColor: brand.bgCard,
          border: verified ? "none" : `1px solid ${brand.secondary}44`,
        }}
      >
        {/* Unverified banner — post-moderation model: reviews go live
            immediately but wear this badge until an admin approves them.
            Aggregate stats server-side already exclude unverified reviews,
            so the batch's rating can't be skewed. */}
        {!verified && (
          <div
            className="mb-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
            style={{
              backgroundColor: `${brand.secondary}18`,
              color: brand.secondary,
              border: `1px solid ${brand.secondary}44`,
            }}
          >
            <span aria-hidden>{"\u{23F3}"}</span>
            Unverified — awaiting admin review. Won&apos;t count toward this batch&apos;s rating until approved.
          </div>
        )}
        {/* ── Overall rating box + username/date ───────────────────────── */}
        <div className="mb-4 flex items-start justify-between">
          {/* Prominent rating — hexagon coloured by score (red→yellow→green) */}
          {(() => {
            const { r, g, b } = ratingRGB(avg);
            const colour = `rgb(${r}, ${g}, ${b})`;
            const fill = `rgba(${r}, ${g}, ${b}, 0.13)`;
            return (
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full" aria-hidden>
                  <path
                    d="M219.9,66.7l-84,-47.4c-4.888,-2.799-10.912,-2.799-15.8,0l-84,47.4c-4.997,2.885-8.089,8.23-8.1,14l0,94.6c0.011,5.77,3.103,11.115,8.1,14l84,47.4c4.888,2.799,10.912,2.799,15.8,0l84,-47.4c4.997,-2.885,8.089,-8.23,8.1,-14l0,-94.6c-0.011,-5.77-3.103,-11.115-8.1,-14Z"
                    fill={fill}
                    stroke={colour}
                    strokeWidth="8"
                  />
                </svg>
                <span className="relative z-10 text-xl font-extrabold" style={{ color: colour }}>
                  {avg.toFixed(1)}
                </span>
              </div>
            );
          })()}
          {/* Reviewer identity — username + rank pill, with avatar to the right */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end gap-1">
              <Link
                href={`/user/${username}`}
                className="text-sm font-semibold transition hover:underline"
                style={{ color: brand.primary }}
              >
                {username}
              </Link>
              {communityStatus && <RankPill communityStatus={communityStatus} />}
            </div>
            <Link
              href={`/user/${username}`}
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${username}'s profile`}
            >
              <ReviewerAvatar
                username={username}
                avatarUrl={avatarUrl}
              />
            </Link>
          </div>
        </div>

        {/* ── Strain info box ──────────────────────────────────────────── */}
        <div
          className="mb-4 flex items-center gap-3 rounded-xl p-4"
          style={{ backgroundColor: brand.bgDeep, border: `1px solid ${brand.textMuted}15` }}
        >
          {/* Strain thumbnail — always rendered (placeholder if no image yet)
              and clickable through to the strain page when we have an id. */}
          {strainId ? (
            <Link
              href={`/strain/${strainId}`}
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={strainImage}
                alt={strainName}
                className="h-14 w-14 rounded-lg object-cover transition hover:brightness-110"
                style={{ border: `1px solid ${brand.textMuted}22` }}
              />
            </Link>
          ) : (
            <img
              src={strainImage}
              alt={strainName}
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
              style={{ border: `1px solid ${brand.textMuted}22` }}
            />
          )}

          <div className="min-w-0 flex-1">
            {/* Strain name */}
            {strainId ? (
              <Link
                href={`/strain/${strainId}`}
                className="block truncate text-base font-bold text-white transition hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {strainName}
              </Link>
            ) : (
              <h3 className="truncate text-base font-bold text-white">{strainName}</h3>
            )}

            {/* Batch number — smaller small-print */}
            {batchId ? (
              <Link
                href={`/batch/${batchId}`}
                className="mt-0.5 block truncate text-[9px] uppercase tracking-wider transition hover:underline"
                style={{ color: `${brand.textMuted}cc` }}
                onClick={(e) => e.stopPropagation()}
              >
                Batch #{batchNumber}
              </Link>
            ) : (
              <span
                className="mt-0.5 block truncate text-[9px] uppercase tracking-wider"
                style={{ color: `${brand.textMuted}cc` }}
              >
                Batch #{batchNumber}
              </span>
            )}

            {/* Grower — "by Company Name" */}
            <div className="mt-1 truncate text-xs" style={{ color: brand.textMuted }}>
              <span>by </span>
              {growerId ? (
                <Link
                  href={`/grower/${growerId}`}
                  className="font-semibold transition hover:underline"
                  style={{ color: brand.textMuted }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {growerName}
                </Link>
              ) : (
                <span className="font-semibold">{growerName}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── 5 hexagon ratings ────────────────────────────────────────── */}
        <div className="mb-5 flex justify-center gap-3">
          {ratingLabels.map(({ key, label }) => (
            <HexRating key={key} score={ratings[key]} label={label} />
          ))}
        </div>

        {/* ── Narrative ────────────────────────────────────────────────── */}
        {narrative && (
          <p className="mb-4 text-sm leading-relaxed" style={{ color: brand.textMuted }}>
            {narrative}
          </p>
        )}

        {/* ── Photo thumbnails ─────────────────────────────────────────── */}
        {photos.length > 0 && (
          <div className="mb-4 flex gap-2">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightboxUrl(url)}
                className="h-16 w-16 overflow-hidden rounded-lg border transition hover:opacity-80"
                style={{ borderColor: `${brand.textMuted}22` }}
              >
                <img
                  src={url}
                  alt={`Review photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* ── More Info toggle ─────────────────────────────────────────── */}
        <button
          onClick={() => setMoreInfoOpen(!moreInfoOpen)}
          className="mb-4 flex w-full items-center justify-between border-t border-b py-2.5 text-sm font-medium text-white"
          style={{ borderColor: `${brand.textMuted}18` }}
        >
          More Info
          <span
            className="text-lg transition-transform"
            style={{
              color: brand.primary,
              transform: moreInfoOpen ? "rotate(45deg)" : "rotate(0deg)",
            }}
          >
            +
          </span>
        </button>
        {moreInfoOpen && (
          <div className="mb-4 space-y-4">
            {/* Effects */}
            {effects.length > 0 && (
              <div>
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-white">
                  Effects
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {effects.map((e) => (
                    <span
                      key={e}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: brand.textMuted }}
                    >
                      <span style={{ color: brand.primary }}>&#x26A1;</span> {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Taken For (conditions) */}
            {conditions.length > 0 && (
              <div className="border-t pt-3" style={{ borderColor: `${brand.textMuted}18` }}>
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-white">
                  Taken For
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {conditions.map((c) => (
                    <span
                      key={c}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: brand.textMuted }}
                    >
                      <span>&#x1F600;</span> {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Flavour */}
            {flavours.length > 0 && (
              <div className="border-t pt-3" style={{ borderColor: `${brand.textMuted}18` }}>
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-white">
                  Flavour
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {flavours.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: brand.textMuted }}
                    >
                      <span style={{ color: brand.secondary }}>&#x2728;</span> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bottom bar: date + report + comments + like ─────────────── */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px]" style={{ color: brand.textMuted }} title={createdAt}>
            {formatDate(createdAt)}
          </span>
          <div className="flex items-center gap-4">
          <button
            onClick={handleReport}
            className="flex items-center gap-1.5 text-xs transition hover:text-white"
            style={{ color: reported ? "#f87171" : brand.textMuted }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4a2 2 0 012-2h1l2-3V9a2 2 0 012-2h0a2 2 0 012 2v3h5a2 2 0 012 2l-1 5a2 2 0 01-2 2H5" />
            </svg>
            {reported ? "Reported" : "Report"}
          </button>

          <button
            onClick={toggleComments}
            className="flex items-center gap-1.5 text-xs font-medium transition hover:text-white"
            style={{ color: commentsOpen ? brand.secondary : brand.textMuted }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {comments.length > 0 ? comments.length : ""}
            {" "}Comment{comments.length !== 1 ? "s" : ""}
          </button>

          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-xs font-medium transition hover:text-white"
            style={{ color: liked ? brand.primary : brand.textMuted }}
          >
            <svg className="h-4 w-4" fill={liked ? brand.primary : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
            {likeCount}
          </button>
          </div>
        </div>

        {/* ── Comments section ────────────────────────────────────────── */}
        {commentsOpen && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ backgroundColor: brand.bgDeep, border: `1px solid ${brand.textMuted}15` }}
          >
            {loadingComments ? (
              <p className="text-center text-xs" style={{ color: brand.textMuted }}>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-xs" style={{ color: brand.textMuted }}>No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
                      style={{ backgroundColor: `${brand.primary}15`, border: `1px solid ${brand.primary}33` }}
                    >
                      {c.avatar_url ? (
                        <img
                          src={c.avatar_url.startsWith("http") ? c.avatar_url : `http://localhost:8001${c.avatar_url}`}
                          alt={c.username || ""}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" stroke={brand.primary} viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{c.username || "User"}</span>
                        <span className="text-[10px]" style={{ color: `${brand.textMuted}88` }}>
                          {timeAgo(c.created_at)}
                        </span>
                        {authUser && authUser.id === c.user_id && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="ml-auto text-[10px] transition hover:text-red-400"
                            style={{ color: `${brand.textMuted}66` }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: brand.textMuted }}>
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            {authUser ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
                  placeholder="Write a comment..."
                  maxLength={500}
                  className="min-w-0 flex-1 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  style={{ backgroundColor: brand.bgCard, border: `1px solid ${brand.textMuted}33` }}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentText.trim()}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: brand.primary, color: brand.bgDeep }}
                >
                  {submitting ? "..." : "Post"}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-center text-[11px]" style={{ color: brand.textMuted }}>
                <Link href="/login" className="underline transition hover:text-white">Sign in</Link> to leave a comment.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ───────────────────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Review photo"
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
