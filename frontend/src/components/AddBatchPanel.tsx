"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";

const C = brand;

interface Strain {
  id: number;
  name: string;
  strain_type: string;
  grower_id: number | null;
}

interface SubmittedBatch {
  id: number;
  batch_number: string;
  strain_name: string | null;
}

interface AddBatchPanelProps {
  growerId: number;
  batchNumber: string;
  onSubmitted: (batch: SubmittedBatch) => void;
}

type IrradiatedChoice = "yes" | "no" | "unknown";

export default function AddBatchPanel({ growerId, batchNumber, onSubmitted }: AddBatchPanelProps) {
  const [allStrains, setAllStrains] = useState<Strain[]>([]);
  const [strainSearch, setStrainSearch] = useState("");
  const [selectedStrainId, setSelectedStrainId] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // New strain fallback
  const [addingNewStrain, setAddingNewStrain] = useState(false);
  const [newStrainName, setNewStrainName] = useState("");
  const [newStrainType, setNewStrainType] = useState<"indica" | "sativa" | "hybrid">("hybrid");

  // Batch fields
  const [thc, setThc] = useState("");
  const [cbd, setCbd] = useState("");
  const [testedDate, setTestedDate] = useState("");
  const [irradiated, setIrradiated] = useState<IrradiatedChoice>("unknown");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Strain[]>("/strains/?limit=100")
      .then(setAllStrains)
      .catch(() => {});
  }, []);

  const filteredStrains = useMemo(() => {
    const q = strainSearch.trim().toLowerCase();
    if (!q) {
      // Show grower's strains first if we have them
      return allStrains
        .filter((s) => s.grower_id === growerId)
        .slice(0, 8);
    }
    return allStrains
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allStrains, strainSearch, growerId]);

  const selectedStrain = selectedStrainId
    ? allStrains.find((s) => s.id === selectedStrainId) ?? null
    : null;

  const thcNum = parseFloat(thc);
  const cbdNum = parseFloat(cbd);
  const thcValid = !isNaN(thcNum) && thcNum >= 0 && thcNum <= 100;
  const cbdValid = !isNaN(cbdNum) && cbdNum >= 0 && cbdNum <= 100;

  const strainReady = addingNewStrain
    ? newStrainName.trim().length >= 2
    : selectedStrainId !== null;

  const canSubmit = strainReady && thcValid && cbdValid && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    const payload: any = {
      grower_id: growerId,
      batch_number: batchNumber.trim(),
      thc_percentage: thcNum,
      cbd_percentage: cbdNum,
      irradiated: irradiated === "unknown" ? null : irradiated === "yes",
    };
    if (testedDate) payload.tested_date = testedDate;
    if (addingNewStrain) {
      payload.new_strain_name = newStrainName.trim();
      payload.new_strain_type = newStrainType;
    } else {
      payload.strain_id = selectedStrainId;
    }

    try {
      const batch = await apiFetch<SubmittedBatch>("/batches/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onSubmitted(batch);
    } catch (err: any) {
      setError(err.message || "Failed to submit batch");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    backgroundColor: C.bgDeep,
    border: `1px solid ${C.textMuted}33`,
  };

  return (
    <div
      className="mt-3 rounded-xl p-4"
      style={{
        backgroundColor: `${C.secondary}0d`,
        border: `1px solid ${C.secondary}44`,
      }}
    >
      <div className="mb-3 flex items-start gap-2">
        <span className="text-lg" aria-hidden>➕</span>
        <div>
          <p className="text-sm font-bold text-white">Add this batch</p>
          <p className="text-xs" style={{ color: C.textMuted }}>
            Submit it for admin approval — your review will be tied to it and both go live together.
          </p>
        </div>
      </div>

      {/* Strain selector */}
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
            Strain
          </label>
          {!addingNewStrain && (
            <>
              {selectedStrain ? (
                <div
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{
                    backgroundColor: `${C.primary}12`,
                    border: `1px solid ${C.primary}55`,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {selectedStrain.name}
                    </p>
                    <p className="text-xs capitalize" style={{ color: C.textMuted }}>
                      {selectedStrain.strain_type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStrainId(null);
                      setStrainSearch("");
                    }}
                    className="text-xs underline"
                    style={{ color: C.secondary }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={strainSearch}
                    onChange={(e) => setStrainSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Search strain name..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2"
                    style={{ ...inputStyle, outlineColor: C.primary }}
                  />
                  {showDropdown && (
                    <div
                      className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg shadow-xl"
                      style={{
                        backgroundColor: C.bgCard,
                        border: `1px solid ${C.textMuted}33`,
                      }}
                    >
                      {filteredStrains.length === 0 && strainSearch.trim().length === 0 && (
                        <p className="px-3 py-2 text-xs" style={{ color: C.textMuted }}>
                          Type to search, or add a new strain below.
                        </p>
                      )}
                      {filteredStrains.length === 0 && strainSearch.trim().length > 0 && (
                        <p className="px-3 py-2 text-xs" style={{ color: C.textMuted }}>
                          No strains match "{strainSearch}".
                        </p>
                      )}
                      {filteredStrains.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedStrainId(s.id);
                            setStrainSearch(s.name);
                            setShowDropdown(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white transition hover:bg-white/5"
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="ml-2 text-xs capitalize" style={{ color: C.textMuted }}>
                            {s.strain_type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setAddingNewStrain(true)}
                className="mt-2 text-xs underline"
                style={{ color: C.secondary }}
              >
                Can't find your strain? Add a new one
              </button>
            </>
          )}

          {addingNewStrain && (
            <div className="space-y-3">
              <input
                type="text"
                value={newStrainName}
                onChange={(e) => setNewStrainName(e.target.value)}
                placeholder="New strain name"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2"
                style={{ ...inputStyle, outlineColor: C.primary }}
              />
              <div className="flex gap-2">
                {(["indica", "sativa", "hybrid"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewStrainType(t)}
                    className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition"
                    style={{
                      backgroundColor: newStrainType === t ? C.primary : `${C.bgDeep}88`,
                      color: newStrainType === t ? C.bgDeep : C.textMuted,
                      border: `1px solid ${newStrainType === t ? C.primary : `${C.textMuted}33`}`,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddingNewStrain(false);
                  setNewStrainName("");
                }}
                className="text-xs underline"
                style={{ color: C.secondary }}
              >
                ← Pick an existing strain instead
              </button>
            </div>
          )}
        </div>

        {/* THC + CBD */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
              THC %
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="100"
              value={thc}
              onChange={(e) => setThc(e.target.value)}
              placeholder="e.g. 22.5"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
              CBD %
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="100"
              value={cbd}
              onChange={(e) => setCbd(e.target.value)}
              placeholder="e.g. 0.1"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2"
              style={{ ...inputStyle, outlineColor: C.primary }}
            />
          </div>
        </div>

        {/* Tested date */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
            Tested date <span className="normal-case text-white/40">(optional)</span>
          </label>
          <input
            type="date"
            value={testedDate}
            onChange={(e) => setTestedDate(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2"
            style={{ ...inputStyle, outlineColor: C.primary, colorScheme: "dark" }}
          />
        </div>

        {/* Irradiated */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>
            Irradiated?
          </label>
          <div className="flex gap-2">
            {([
              ["yes", "Yes ☢"],
              ["no", "No 🌿"],
              ["unknown", "Not sure"],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setIrradiated(val)}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition"
                style={{
                  backgroundColor: irradiated === val ? C.primary : `${C.bgDeep}88`,
                  color: irradiated === val ? C.bgDeep : C.textMuted,
                  border: `1px solid ${irradiated === val ? C.primary : `${C.textMuted}33`}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:opacity-40"
          style={{ backgroundColor: C.secondary, color: C.bgDeep }}
        >
          {submitting ? "Submitting batch..." : "Submit batch & continue"}
        </button>
      </div>
    </div>
  );
}
