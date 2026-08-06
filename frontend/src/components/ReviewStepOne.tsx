"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import StarRating from "./StarRating";
import PhotoUpload from "./PhotoUpload";
import AddBatchPanel from "./AddBatchPanel";

const C = brand;

interface Grower {
  id: number;
  name: string;
}

interface BatchResult {
  id: number;
  batch_number: string;
  strain_name: string | null;
}

interface ReviewStepOneProps {
  onSuccess: (reviewId: number, strainName: string) => void;
  onCancel: () => void;
}

function SectionCard({
  step,
  title,
  subtitle,
  complete,
  optional,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  complete: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-5 sm:p-6"
      style={{
        backgroundColor: `${C.bgCard}b3`,
        border: `1px solid ${complete ? `${C.primary}55` : `${C.textMuted}22`}`,
        boxShadow: complete ? `0 0 0 1px ${C.primary}22` : "none",
      }}
    >
      <header className="mb-4 flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition"
          style={{
            backgroundColor: complete ? C.primary : `${C.textMuted}22`,
            color: complete ? C.bgDeep : C.textMuted,
          }}
        >
          {complete ? "✓" : step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-white sm:text-lg">
            {title}
            {optional && (
              <span
                className="ml-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: C.textMuted }}
              >
                Optional
              </span>
            )}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs sm:text-sm" style={{ color: C.textMuted }}>
              {subtitle}
            </p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

export default function ReviewStepOne({ onSuccess, onCancel }: ReviewStepOneProps) {
  const [growers, setGrowers] = useState<Grower[]>([]);
  const [growerId, setGrowerId] = useState<number | "">("");
  const [batchNumber, setBatchNumber] = useState("");
  const [matchedBatch, setMatchedBatch] = useState<BatchResult | null>(null);
  const [batchError, setBatchError] = useState("");
  const [batchSearching, setBatchSearching] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [pendingBatchApproval, setPendingBatchApproval] = useState(false);

  const [photoProduct, setPhotoProduct] = useState<File | null>(null);
  const [photoCloseup, setPhotoCloseup] = useState<File | null>(null);
  const [photoPackaging, setPhotoPackaging] = useState<File | null>(null);

  const [appearance, setAppearance] = useState(0);
  const [aroma, setAroma] = useState(0);
  const [moisture, setMoisture] = useState(0);
  const [flavour, setFlavour] = useState(0);
  const [effect, setEffect] = useState(0);

  const [narrative, setNarrative] = useState("");

  const [confirmOwn, setConfirmOwn] = useState(false);
  const [confirmMedical, setConfirmMedical] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Grower[]>("/growers/")
      .then(setGrowers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    // A just-submitted batch should stick until grower/batch change explicitly.
    if (pendingBatchApproval) return;

    if (!growerId || batchNumber.trim().length < 2) {
      setMatchedBatch(null);
      setBatchError("");
      setShowAddBatch(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setBatchSearching(true);
      setBatchError("");
      try {
        const results = await apiFetch<BatchResult[]>(
          `/batches/?grower_id=${growerId}&approved=true&limit=50`
        );
        const match = results.find(
          (b) => b.batch_number.toLowerCase() === batchNumber.trim().toLowerCase()
        );
        if (match) {
          setMatchedBatch(match);
          setBatchError("");
          setShowAddBatch(false);
        } else {
          setMatchedBatch(null);
          setBatchError("Batch not found. Check the number and grower — or add it below.");
        }
      } catch {
        setBatchError("Failed to search batches.");
      } finally {
        setBatchSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [growerId, batchNumber, pendingBatchApproval]);

  const productComplete = !!matchedBatch;
  const photosComplete = !!photoProduct && !!photoCloseup && !!photoPackaging;
  const ratingsComplete =
    appearance > 0 && aroma > 0 && moisture > 0 && flavour > 0 && effect > 0;
  const confirmComplete = confirmOwn && confirmMedical;
  const storyComplete = narrative.trim().length >= 20;

  const requiredDone = [productComplete, photosComplete, ratingsComplete, confirmComplete].filter(
    Boolean
  ).length;
  const requiredTotal = 4;
  const progressPct = Math.round((requiredDone / requiredTotal) * 100);

  const canSubmit =
    productComplete && photosComplete && ratingsComplete && confirmComplete && !submitting;

  const missingLabel = useMemo(() => {
    if (submitting) return "Submitting...";
    if (canSubmit) return "Ready to submit";
    const missing: string[] = [];
    if (!productComplete) missing.push("Product");
    if (!photosComplete) missing.push("Photos");
    if (!ratingsComplete) missing.push("Ratings");
    if (!confirmComplete) missing.push("Confirmations");
    if (missing.length === 1) return `Almost — add ${missing[0]}`;
    return `${requiredTotal - requiredDone} of ${requiredTotal} steps left`;
  }, [canSubmit, submitting, productComplete, photosComplete, ratingsComplete, confirmComplete, requiredDone]);

  async function handleSubmit() {
    if (!canSubmit || !matchedBatch) return;
    setSubmitting(true);
    setError("");

    const form = new FormData();
    form.append("batch_id", String(matchedBatch.id));
    form.append("appearance_rating", String(appearance));
    form.append("aroma_rating", String(aroma));
    form.append("moisture_rating", String(moisture));
    form.append("flavour_rating", String(flavour));
    form.append("effect_rating", String(effect));
    if (narrative.trim()) form.append("written_narrative", narrative.trim());
    form.append("confirmed_own_experience", String(confirmOwn));
    form.append("confirmed_medical_only", String(confirmMedical));
    form.append("photo_product", photoProduct!);
    form.append("photo_closeup", photoCloseup!);
    form.append("photo_packaging", photoPackaging!);

    try {
      const review = await apiFetch<{ id: number; strain_name: string | null }>(
        "/reviews/",
        { method: "POST", body: form }
      );
      onSuccess(review.id, review.strain_name || matchedBatch.strain_name || "your strain");
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    backgroundColor: C.bgDeep,
    border: `1px solid ${C.textMuted}33`,
  };

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <header
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${C.bgCard} 0%, ${C.bgDeep} 100%)`,
          border: `1px solid ${C.primary}33`,
        }}
      >
        <div
          className="absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: C.primary }}
        />
        <div className="relative flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{
              backgroundColor: `${C.primary}18`,
              border: `1px solid ${C.primary}55`,
            }}
            aria-hidden
          >
            ✎
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="mb-1 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: C.primary }}
            >
              Step 1 of 2 · Your review
            </p>
            <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              Write a review
            </h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: C.textMuted }}>
              Help other UK patients find the right medication. Verified reviews only —
              takes about 3 minutes.
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span style={{ color: C.textMuted }}>
              {requiredDone} of {requiredTotal} required steps complete
            </span>
            <span className="font-semibold" style={{ color: C.primary }}>
              {progressPct}%
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: `${C.textMuted}22` }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: C.primary,
                boxShadow: `0 0 12px ${C.primary}66`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Section 1 — Product */}
      <SectionCard
        step={1}
        title="What did you try?"
        subtitle="Pick your grower, then paste the batch number from the packaging."
        complete={productComplete}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
              Grower
            </label>
            <select
              value={growerId}
              onChange={(e) => {
                setGrowerId(e.target.value ? Number(e.target.value) : "");
                setMatchedBatch(null);
                setPendingBatchApproval(false);
                setShowAddBatch(false);
              }}
              className="w-full rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            >
              <option value="">Please choose a grower</option>
              {growers.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
              Batch Number
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => {
                setBatchNumber(e.target.value);
                if (pendingBatchApproval) {
                  setPendingBatchApproval(false);
                  setMatchedBatch(null);
                  setShowAddBatch(false);
                }
              }}
              placeholder="e.g. XY-2405-A"
              className="w-full rounded-lg px-3 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
            {batchSearching && (
              <p className="mt-2 text-xs" style={{ color: C.textMuted }}>
                Searching...
              </p>
            )}
            {batchError && (
              <p className="mt-2 text-xs text-red-400">{batchError}</p>
            )}

            {batchError && !matchedBatch && growerId && batchNumber.trim().length >= 2 && !showAddBatch && (
              <button
                type="button"
                onClick={() => setShowAddBatch(true)}
                className="mt-2 text-xs font-semibold underline"
                style={{ color: C.secondary }}
              >
                + Add this batch instead
              </button>
            )}

            {showAddBatch && growerId && batchNumber.trim().length >= 2 && !matchedBatch && (
              <AddBatchPanel
                growerId={Number(growerId)}
                batchNumber={batchNumber}
                onSubmitted={(batch) => {
                  setMatchedBatch({
                    id: batch.id,
                    batch_number: batch.batch_number,
                    strain_name: batch.strain_name,
                  });
                  setPendingBatchApproval(true);
                  setShowAddBatch(false);
                  setBatchError("");
                }}
              />
            )}
          </div>

          {matchedBatch && (
            <div
              className="flex items-center gap-3 rounded-lg p-3"
              style={{
                backgroundColor: pendingBatchApproval ? `${C.secondary}12` : `${C.primary}12`,
                border: `1px solid ${pendingBatchApproval ? `${C.secondary}55` : `${C.primary}55`}`,
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                style={{
                  backgroundColor: pendingBatchApproval ? `${C.secondary}22` : `${C.primary}22`,
                  color: pendingBatchApproval ? C.secondary : C.primary,
                }}
                aria-hidden
              >
                {pendingBatchApproval ? "⏳" : "🌿"}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: pendingBatchApproval ? C.secondary : C.primary }}
                >
                  {pendingBatchApproval ? "Batch submitted · pending approval" : "Batch matched"}
                </p>
                <p className="truncate text-sm font-semibold text-white">
                  {matchedBatch.strain_name}
                </p>
                <p className="text-xs" style={{ color: C.textMuted }}>
                  {matchedBatch.batch_number}
                </p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Section 2 — Photos */}
      <SectionCard
        step={2}
        title="Show us"
        subtitle="Three photos verify your review. Obscure any personal details."
        complete={photosComplete}
      >
        <div className="grid grid-cols-3 gap-3">
          <PhotoUpload
            label="Add photo"
            sublabel="Whole product"
            icon="🌿"
            hint="Full bud on a plain surface"
            file={photoProduct}
            onChange={setPhotoProduct}
          />
          <PhotoUpload
            label="Add photo"
            sublabel="Close-up"
            icon="🔍"
            hint="Macro of trichomes / colour"
            file={photoCloseup}
            onChange={setPhotoCloseup}
          />
          <PhotoUpload
            label="Add photo"
            sublabel="Packaging"
            icon="📦"
            hint="Label with batch visible"
            file={photoPackaging}
            onChange={setPhotoPackaging}
          />
        </div>
      </SectionCard>

      {/* Section 3 — Ratings */}
      <SectionCard
        step={3}
        title="Rate the five dimensions"
        subtitle="Tap the stars — your ratings feed into every batch's score."
        complete={ratingsComplete}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StarRating label="Appearance" value={appearance} onChange={setAppearance} />
          <StarRating label="Aroma" value={aroma} onChange={setAroma} />
          <StarRating label="Moisture" value={moisture} onChange={setMoisture} />
          <StarRating label="Flavour" value={flavour} onChange={setFlavour} />
          <StarRating label="Effect" value={effect} onChange={setEffect} />
        </div>
      </SectionCard>

      {/* Section 4 — Narrative */}
      <SectionCard
        step={4}
        title="Tell your story"
        subtitle="What did you notice? How did it feel? What conditions did it help?"
        complete={storyComplete}
        optional
      >
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={5}
          placeholder="e.g. 'Sedating in the evenings, took the edge off nerve pain after ~20 minutes. Earthy, slightly sweet on the exhale...'"
          className="w-full rounded-lg px-3 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2"
          style={{ ...inputStyle, outlineColor: C.primary }}
        />
        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: C.textMuted }}>
          <span>Your input helps shape our community.</span>
          <span>{narrative.trim().length} chars</span>
        </div>
      </SectionCard>

      {/* Section 5 — Confirm */}
      <SectionCard
        step={5}
        title="Confirm & submit"
        subtitle="Reviews are verified within 24 hours before they appear."
        complete={confirmComplete}
      >
        <div className="space-y-3">
          <label
            className="flex cursor-pointer items-start gap-3 rounded-lg p-3 text-sm text-white transition hover:opacity-90"
            style={{
              backgroundColor: confirmOwn ? `${C.primary}10` : `${C.bgDeep}88`,
              border: `1px solid ${confirmOwn ? `${C.primary}55` : `${C.textMuted}22`}`,
            }}
          >
            <input
              type="checkbox"
              checked={confirmOwn}
              onChange={(e) => setConfirmOwn(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded"
              style={{ accentColor: C.primary }}
            />
            <span>
              I confirm this review is based on my own experience and is my true experience.
            </span>
          </label>
          <label
            className="flex cursor-pointer items-start gap-3 rounded-lg p-3 text-sm text-white transition hover:opacity-90"
            style={{
              backgroundColor: confirmMedical ? `${C.primary}10` : `${C.bgDeep}88`,
              border: `1px solid ${confirmMedical ? `${C.primary}55` : `${C.textMuted}22`}`,
            }}
          >
            <input
              type="checkbox"
              checked={confirmMedical}
              onChange={(e) => setConfirmMedical(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded"
              style={{ accentColor: C.primary }}
            />
            <span>I confirm this review is based on medical cannabis only.</span>
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-5 hidden items-center gap-4 sm:flex">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg px-6 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
            style={{
              backgroundColor: C.primary,
              color: C.bgDeep,
            }}
          >
            {submitting ? "Submitting..." : "Submit review"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm underline"
            style={{ color: C.secondary }}
          >
            Cancel &amp; go back
          </button>
        </div>
      </SectionCard>

      {/* Sticky submit bar — mobile only */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t sm:hidden"
        style={{
          backgroundColor: `${C.bgDeep}f2`,
          borderTopColor: `${C.textMuted}22`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
              {missingLabel}
            </p>
            <div
              className="mt-1 h-1 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: `${C.textMuted}22` }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%`, backgroundColor: C.primary }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="shrink-0 rounded-lg px-5 py-3 text-sm font-bold transition disabled:opacity-40"
            style={{ backgroundColor: C.primary, color: C.bgDeep }}
          >
            {submitting ? "..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
