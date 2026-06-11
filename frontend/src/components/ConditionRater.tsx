"use client";

import { useState } from "react";

export interface ConditionRating {
  condition_name: string;
  efficacy_rating: number;
}

interface Props {
  value: ConditionRating[];
  onChange: (ratings: ConditionRating[]) => void;
}

export default function ConditionRater({ value, onChange }: Props) {
  const [newCondition, setNewCondition] = useState("");

  function addCondition() {
    const name = newCondition.trim();
    if (!name) return;
    if (value.some((c) => c.condition_name.toLowerCase() === name.toLowerCase()))
      return;
    onChange([...value, { condition_name: name, efficacy_rating: 5 }]);
    setNewCondition("");
  }

  function updateRating(index: number, rating: number) {
    const updated = [...value];
    updated[index].efficacy_rating = rating;
    onChange(updated);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">
        Condition Efficacy Ratings
      </label>

      {value.map((cr, i) => (
        <div key={i} className="mb-2 flex items-center gap-3">
          <span className="w-28 text-sm">{cr.condition_name}</span>
          <input
            type="range"
            min={1}
            max={10}
            value={cr.efficacy_rating}
            onChange={(e) => updateRating(i, parseInt(e.target.value))}
            className="flex-1 accent-green-500"
          />
          <span className="w-8 text-center text-sm text-green-400">
            {cr.efficacy_rating}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-400 hover:text-red-300"
          >
            x
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          placeholder="Add condition (e.g. Insomnia)"
          value={newCondition}
          onChange={(e) => setNewCondition(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCondition())}
          className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={addCondition}
          className="rounded bg-gray-700 px-3 py-1.5 text-sm hover:bg-gray-600"
        >
          Add
        </button>
      </div>
    </div>
  );
}
