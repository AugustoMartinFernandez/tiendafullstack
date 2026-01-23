import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Esta función mágica combina clases y resuelve conflictos de Tailwind
// Ejemplo: cn("bg-red-500", true && "bg-blue-500") -> gana "bg-blue-500"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}