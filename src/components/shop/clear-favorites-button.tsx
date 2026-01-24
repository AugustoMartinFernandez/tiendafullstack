"use client";

import { useFavorites } from "@/context/favorites-context";
import { Trash2 } from "lucide-react";

export function ClearFavoritesButton() {
  const { favorites, clearFavorites } = useFavorites();

  if (favorites.length === 0) return null;

  return (
    <button
      onClick={clearFavorites}
      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 transition-colors bg-red-50 rounded-lg hover:bg-red-100"
    >
      <Trash2 className="w-4 h-4" />
      Borrar todos
    </button>
  );
}