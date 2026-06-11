"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import StrainCard, { type CardData } from "./StrainCard";

export default function CardSwipeFeed() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  async function loadCards(skip = 0) {
    try {
      const limit = 12;
      // Fetch batches then get card data for each
      const batches = await apiFetch<{ id: number }[]>(
        `/batches/?approved=true&skip=${skip}&limit=${limit}`
      );
      const cardPromises = batches.map((b) =>
        apiFetch<CardData>(`/batches/${b.id}/card`).catch(() => null)
      );
      const newCards = (await Promise.all(cardPromises)).filter(
        (c): c is CardData => c !== null
      );

      if (skip === 0) {
        setCards(newCards);
      } else {
        setCards((prev) => [...prev, ...newCards]);
      }
      setHasMore(batches.length === limit);
    } catch (err) {
      console.error("Failed to load cards:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards();
  }, []);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCards(nextPage * 12);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-400">Loading strains...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-400">
          No strains available yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StrainCard key={card.id} card={card} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            className="rounded-lg bg-gray-800 px-6 py-2 text-sm text-gray-300 hover:bg-gray-700"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
