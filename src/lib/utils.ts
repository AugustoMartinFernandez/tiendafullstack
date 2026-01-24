import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Product } from "@/lib/types";

// Esta función mágica combina clases y resuelve conflictos de Tailwind
// Ejemplo: cn("bg-red-500", true && "bg-blue-500") -> gana "bg-blue-500"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- HELPERS DE IMÁGENES (Single Source of Truth) ---

/** Devuelve la URL de la imagen principal (Portada) */
export function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) return product.images[0];
  if (product.imageUrl) return product.imageUrl;
  return "/placeholder.png";
}

/** Devuelve siempre un array de imágenes para galerías/sliders */
export function getProductImages(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  if (product.imageUrl) return [product.imageUrl];
  return ["/placeholder.png"];
}