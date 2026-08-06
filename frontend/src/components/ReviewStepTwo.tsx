"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import { EFFECTS, CONDITIONS, CONSUMPTION_METHODS } from "@/lib/constants";
import StarRating from "./StarRating";

const C = brand;

interface ReviewStepTwoProps {
  reviewId: number;
  strainName: string;
  onDone: () => void;
}

export default function ReviewStepTwo({ reviewId, strainName, onDone }: ReviewStepTwoProps) {
  const [thc, setThc] = useState("");
  const [cbd, setCbd] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [conditionsPublic, setConditionsPublic] = useState(false);
  const [efficacy, setEfficacy] = useState(0);
  const [durationHours, setDurationHours] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleEffect(id: string) {
    setSelectedEffects((prev) =>
      prev.includes(id)
        ? prev.filter((e) => e !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  }

  function toggleCondition(id: string) {
    setSelectedConditions((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  }

  async function handleSubmit() {
    setError("");

    const hoursNum = durationHours ? parseInt(durationHours) : null;
    const minsNum = durationMins ? parseInt(durationMins) : null;
    if (hoursNum !== null && (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24)) {
      setError("Hours must be between 0 and 24. For anything longer, adjust the value.");
      return;
    }
    if (minsNum !== null && (isNaN(minsNum) || minsNum < 0 || minsNum > 59)) {
      setError("Minutes must be between 0 and 59.");
      return;
    }

    setSubmitting(true);

    const body: Record<string, unknown> = {};
    if (thc) body.thc_content = parseFloat(thc);
    if (cbd) body.cbd_content = parseFloat(cbd);
    if (method) body.consumption_method = method;
    if (selectedEffects.length > 0) body.effects = selectedEffects;
    body.conditions_public = conditionsPublic;
    if (efficacy > 0) body.condition_efficacy_rating = efficacy;
    if (hoursNum !== null) body.effect_duration_hours = hoursNum;
    if (minsNum !== null) body.effect_duration_mins = minsNum;
    if (selectedConditions.length > 0) {
      body.condition_ratings = selectedConditions.map((id) => {
        const cond = CONDITIONS.find((c) => c.id === id);
        return {
          condition_name: cond?.label || id,
          efficacy_rating: efficacy || 3,
        };
      });
    }

    try {
      await apiFetch(`/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      onDone();
    } catch (err: any) {
      setError(err.message || "Failed to update review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        type="button"
        onClick={onDone}
        className="text-sm"
        style={{ color: C.secondary }}
      >
        &lt; Back to {strainName}
      </button>

      <div>
        <h1 className="text-3xl font-extrabold text-white">
          Thanks for your<br />review!
        </h1>
        <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
          Please let us know some extra info if you can...
        </p>
      </div>

      {/* THC / CBD */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-white">THC Content</label>
          <div className="relative">
            <input
              type="number"
              value={thc}
              onChange={(e) => setThc(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              placeholder=""
              className="w-full rounded-lg px-3 py-3 pr-10 text-sm text-white focus:outline-none"
              style={{
                backgroundColor: C.bgCard,
                border: `1px solid ${C.primary}44`,
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: C.primary }}
            >
              %
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-white">CBD Content</label>
          <div className="relative">
            <input
              type="number"
              value={cbd}
              onChange={(e) => setCbd(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              placeholder=""
              className="w-full rounded-lg px-3 py-3 pr-10 text-sm text-white focus:outline-none"
              style={{
                backgroundColor: C.bgCard,
                border: `1px solid ${C.primary}44`,
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: C.primary }}
            >
              %
            </span>
          </div>
        </div>
      </div>

      {/* Consumption method */}
      <div>
        <label className="mb-3 block text-sm font-bold text-white">How did you use it?</label>
        <div className="grid grid-cols-3 gap-3">
          {CONSUMPTION_METHODS.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(active ? null : m.id)}
                className="flex flex-col items-center gap-1 rounded-xl py-3 text-sm transition"
                style={{
                  backgroundColor: active ? `${C.primary}15` : C.bgCard,
                  border: `2px solid ${active ? C.primary : "transparent"}`,
                }}
              >
                <span className="text-2xl">{m.icon}</span>
                <span style={{ color: active ? C.primary : C.textMuted }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Effects grid */}
      <div>
        <label className="mb-1 block text-sm font-bold text-white">
          What effects did you feel?
        </label>
        <p className="mb-3 text-xs" style={{ color: C.textMuted }}>
          Please choose 1 - 3
        </p>
        <div className="grid grid-cols-3 gap-3">
          {EFFECTS.map((e) => {
            const active = selectedEffects.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => toggleEffect(e.id)}
                className="flex flex-col items-center gap-1 rounded-xl py-3 text-sm transition"
                style={{
                  backgroundColor: active ? `${C.primary}15` : C.bgCard,
                  border: `2px solid ${active ? C.primary : "transparent"}`,
                }}
              >
                <span className="text-xl">{e.icon}</span>
                <span style={{ color: active ? C.primary : C.textMuted }}>{e.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditions grid */}
      <div>
        <label className="mb-1 block text-sm font-bold text-white">
          What condition did you take it for?
        </label>
        <p className="mb-2 text-xs" style={{ color: C.textMuted }}>
          Please choose 1 - 3
        </p>
        <label className="mb-3 flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
          <input
            type="checkbox"
            checked={conditionsPublic}
            onChange={(e) => setConditionsPublic(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: C.primary }}
          />
          Please tick if you're happy for this to be made public in your review.
        </label>
        <div className="grid grid-cols-3 gap-3">
          {CONDITIONS.map((c) => {
            const active = selectedConditions.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCondition(c.id)}
                className="flex flex-col items-center gap-1 rounded-xl py-3 text-sm transition"
                style={{
                  backgroundColor: active ? `${C.primary}15` : C.bgCard,
                  border: `2px solid ${active ? C.primary : "transparent"}`,
                }}
              >
                <span className="text-xl">{c.icon}</span>
                <span style={{ color: active ? C.primary : C.textMuted }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition efficacy */}
      {selectedConditions.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-bold text-white">
            How effective do you feel it was for the condition?
          </label>
          <StarRating label="" value={efficacy} onChange={setEfficacy} />
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="mb-1 block text-sm font-bold text-white">
          How long did the effects last?
        </label>
        <p className="mb-3 text-xs" style={{ color: C.textMuted }}>
          Hours (0–24) and minutes (0–59)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              min="0"
              max="24"
              placeholder=""
              className="w-full rounded-lg px-3 py-3 pr-16 text-sm text-white focus:outline-none"
              style={{
                backgroundColor: C.bgCard,
                border: `1px solid ${C.primary}44`,
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: C.primary }}
            >
              hours
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
              min="0"
              max="59"
              placeholder=""
              className="w-full rounded-lg px-3 py-3 pr-14 text-sm text-white focus:outline-none"
              style={{
                backgroundColor: C.bgCard,
                border: `1px solid ${C.primary}44`,
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: C.primary }}
            >
              mins
            </span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-4 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg px-6 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
          style={{
            backgroundColor: C.primary,
            color: C.bgDeep,
          }}
        >
          {submitting ? "Updating..." : "Update Review"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm"
          style={{ color: C.secondary }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
