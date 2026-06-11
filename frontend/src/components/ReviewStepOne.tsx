"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import StarRating from "./StarRating";
import PhotoUpload from "./PhotoUpload";

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

export default function ReviewStepOne({ onSuccess, onCancel }: ReviewStepOneProps) {
  // Grower / batch selection
  const [growers, setGrowers] = useState<Grower[]>([]);
  const [growerId, setGrowerId] = useState<number | "">("");
  const [batchNumber, setBatchNumber] = useState("");
  const [matchedBatch, setMatchedBatch] = useState<BatchResult | null>(null);
  const [batchError, setBatchError] = useState("");
  const [batchSearching, setBatchSearching] = useState(false);

  // Photos
  const [photoProduct, setPhotoProduct] = useState<File | null>(null);
  const [photoCloseup, setPhotoCloseup] = useState<File | null>(null);
  const [photoPackaging, setPhotoPackaging] = useState<File | null>(null);

  // Ratings (1-5)
  const [appearance, setAppearance] = useState(0);
  const [aroma, setAroma] = useState(0);
  const [moisture, setMoisture] = useState(0);
  const [flavour, setFlavour] = useState(0);
  const [effect, setEffect] = useState(0);

  // Narrative
  const [narrative, setNarrative] = useState("");

  // Confirmations
  const [confirmOwn, setConfirmOwn] = useState(false);
  const [confirmMedical, setConfirmMedical] = useState(false);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load growers on mount
  useEffect(() => {
    apiFetch<Grower[]>("/growers/")
      .then(setGrowers)
      .catch(() => {});
  }, []);

  // Search for batch when grower and batch number are filled
  useEffect(() => {
    if (!growerId || batchNumber.trim().length < 2) {
      setMatchedBatch(null);
      setBatchError("");
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
        } else {
          setMatchedBatch(null);
          setBatchError("Batch not found. Check the number and grower.");
        }
      } catch {
        setBatchError("Failed to search batches.");
      } finally {
        setBatchSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [growerId, batchNumber]);

  const allRated = appearance > 0 && aroma > 0 && moisture > 0 && flavour > 0 && effect > 0;
  const canSubmit =
    matchedBatch &&
    photoProduct &&
    photoCloseup &&
    photoPackaging &&
    allRated &&
    confirmOwn &&
    confirmMedical &&
    !submitting;

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-white">
        Write a<br />Review
      </h1>

      {/* Grower dropdown */}
      <div>
        <label className="mb-1 block text-sm font-bold text-white">Grower</label>
        <p className="mb-2 text-xs" style={{ color: C.textMuted }}>
          This is usually found <span className="underline">here</span> on the packaging.
        </p>
        <select
          value={growerId}
          onChange={(e) => {
            setGrowerId(e.target.value ? Number(e.target.value) : "");
            setMatchedBatch(null);
          }}
          className="w-full rounded-lg px-3 py-3 text-sm text-white focus:outline-none"
          style={{
            backgroundColor: C.bgCard,
            border: `1px solid ${C.textMuted}33`,
          }}
        >
          <option value="">Please choose a grower</option>
          {growers.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Batch number */}
      <div>
        <label className="mb-1 block text-sm font-bold text-white">Batch Number</label>
        <p className="mb-2 text-xs" style={{ color: C.textMuted }}>
          This is usually found <span className="underline">here</span> on the packaging.
        </p>
        <input
          type="text"
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          placeholder="Batch Number"
          className="w-full rounded-lg px-3 py-3 text-sm text-white focus:outline-none"
          style={{
            backgroundColor: C.bgCard,
            border: `1px solid ${C.textMuted}33`,
          }}
        />
        {batchSearching && (
          <p className="mt-1 text-xs" style={{ color: C.textMuted }}>
            Searching...
          </p>
        )}
        {matchedBatch && (
          <p className="mt-1 text-xs" style={{ color: C.primary }}>
            Found: {matchedBatch.strain_name} ({matchedBatch.batch_number})
          </p>
        )}
        {batchError && (
          <p className="mt-1 text-xs text-red-400">{batchError}</p>
        )}
      </div>

      {/* Photos */}
      <div>
        <label className="mb-1 block text-sm font-bold text-white">Photos</label>
        <p className="mb-1 text-xs" style={{ color: C.textMuted }}>
          Please upload the following images to verify your review.
        </p>
        <p className="mb-3 text-xs" style={{ color: C.textMuted }}>
          <span className="underline">Please note</span> - personal information must be obscured.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <PhotoUpload
            label="Add a Photo"
            sublabel="Photo of whole product"
            file={photoProduct}
            onChange={setPhotoProduct}
          />
          <PhotoUpload
            label="Add a Photo"
            sublabel="Close up photo of product"
            file={photoCloseup}
            onChange={setPhotoCloseup}
          />
          <PhotoUpload
            label="Add a Photo"
            sublabel="Photo of packaging"
            file={photoPackaging}
            onChange={setPhotoPackaging}
          />
        </div>
      </div>

      {/* Ratings */}
      <div>
        <label className="mb-3 block text-sm font-bold text-white">
          How would you rate the following?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <StarRating label="Appearance" value={appearance} onChange={setAppearance} />
          <StarRating label="Aroma" value={aroma} onChange={setAroma} />
          <StarRating label="Moisture" value={moisture} onChange={setMoisture} />
          <StarRating label="Flavour" value={flavour} onChange={setFlavour} />
          <StarRating label="Effect" value={effect} onChange={setEffect} />
        </div>
      </div>

      {/* Narrative */}
      <div>
        <label className="mb-1 block text-sm font-bold text-white">What did you think?</label>
        <p className="mb-2 text-xs" style={{ color: C.textMuted }}>
          Your input helps to shape our community!
        </p>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={5}
          placeholder="Type your review into here"
          className="w-full rounded-lg px-3 py-3 text-sm text-white focus:outline-none"
          style={{
            backgroundColor: C.bgCard,
            border: `1px solid ${C.textMuted}33`,
          }}
        />
      </div>

      {/* Disclaimer */}
      <p className="text-xs" style={{ color: C.textMuted }}>
        <span className="underline">Please note</span> - All reviews will be verified once
        submitted. Please allow us time before they show up on the page.
      </p>

      {/* Confirmations */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm text-white">
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
        <label className="flex items-start gap-3 text-sm text-white">
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

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-4">
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
          {submitting ? "Submitting..." : "Submit"}
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
    </div>
  );
}
