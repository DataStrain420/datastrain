"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import ConditionRater, { type ConditionRating } from "./ConditionRater";

interface Props {
  batchId: number;
  onSuccess?: () => void;
}

export default function ReviewForm({ batchId, onSuccess }: Props) {
  const [overallRating, setOverallRating] = useState(5);
  const [flavourRating, setFlavourRating] = useState(5);
  const [aromaRating, setAromaRating] = useState(5);
  const [effectRating, setEffectRating] = useState(5);
  const [consistencyRating, setConsistencyRating] = useState(5);
  const [narrative, setNarrative] = useState("");
  const [conditions, setConditions] = useState<ConditionRating[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) {
      setError("Photo is required");
      return;
    }
    setError("");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("batch_id", String(batchId));
    formData.append("overall_rating", String(overallRating));
    formData.append("flavour_rating", String(flavourRating));
    formData.append("aroma_rating", String(aromaRating));
    formData.append("effect_rating", String(effectRating));
    formData.append("consistency_rating", String(consistencyRating));
    formData.append("written_narrative", narrative);
    formData.append("condition_ratings_json", JSON.stringify(conditions));
    formData.append("photo", photo);

    try {
      await apiFetch("/reviews/", {
        method: "POST",
        body: formData,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-800 bg-green-900/20 p-6 text-center">
        <p className="text-lg font-semibold text-green-400">
          Review submitted!
        </p>
        <p className="mt-1 text-sm text-gray-400">
          It will appear once approved by a moderator.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded bg-red-900/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Photo upload */}
      <div>
        <label className="mb-2 block text-sm text-gray-400">
          Photo (required)
        </label>
        <div className="flex items-center gap-4">
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="h-24 w-24 rounded-lg object-cover"
            />
          )}
          <label className="cursor-pointer rounded-lg border border-dashed border-gray-600 px-6 py-4 text-sm text-gray-400 hover:border-green-500 hover:text-green-400">
            {photo ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RatingSlider
          label="Overall"
          value={overallRating}
          onChange={setOverallRating}
        />
        <RatingSlider
          label="Flavour"
          value={flavourRating}
          onChange={setFlavourRating}
        />
        <RatingSlider
          label="Aroma"
          value={aromaRating}
          onChange={setAromaRating}
        />
        <RatingSlider
          label="Effect"
          value={effectRating}
          onChange={setEffectRating}
        />
        <RatingSlider
          label="Consistency"
          value={consistencyRating}
          onChange={setConsistencyRating}
        />
      </div>

      {/* Condition ratings */}
      <ConditionRater value={conditions} onChange={setConditions} />

      {/* Narrative */}
      <div>
        <label className="mb-1 block text-sm text-gray-400">
          Written review (optional)
        </label>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={4}
          placeholder="Share your experience..."
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !photo}
        className="w-full rounded-lg bg-green-600 py-3 font-semibold transition hover:bg-green-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold text-green-400">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-green-500"
      />
    </div>
  );
}
