// src/lib/schemas.ts
import { z } from "zod";

const forbiddenWords = ["prohibido", "ofensivo", "spam", "groseria"];

export const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  sku: z.string().optional(),
  description: z.string().max(500, "La descripción no puede superar los 500 caracteres.").optional().refine((val) => {
    if (!val) return true;
    const lowerVal = val.toLowerCase();
    return !forbiddenWords.some(word => lowerVal.includes(word));
  }, { message: "La descripción contiene palabras prohibidas u ofensivas." }),
  price: z.number().min(0, "El precio no puede ser negativo."),
  originalPrice: z.number().min(0).optional(),
  category: z.string().min(1, "La categoría es obligatoria."),
  subCategory: z.string().optional(),
  stock: z.number().int("El stock debe ser entero").min(0, "El stock no puede ser negativo.").max(1000, "El stock no puede ser mayor a 1000 unidades."),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, "El producto debe tener al menos una imagen."),
  attributes: z.record(z.string(), z.string()).optional(),
}).refine((data) => {
  if (data.originalPrice && data.originalPrice > 0) {
    return data.originalPrice > data.price;
  }
  return true;
}, { message: "El precio original debe ser mayor al precio de venta.", path: ["originalPrice"] });
