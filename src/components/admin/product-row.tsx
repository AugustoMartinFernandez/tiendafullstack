// src/components/admin/product-row.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Product } from "@/lib/types";
import { ProductActions } from "@/components/admin/product-actions";
import { formatPrice } from "@/lib/format";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductRowProps {
  product: Product;
}

export function ProductRow({ product }: ProductRowProps) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);

  const handleRowClick = (e: React.MouseEvent) => {
    // Evitamos la navegación si se hizo clic en un botón o enlace (como las acciones)
    // Esto previene conflictos al intentar abrir el menú de acciones
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return;
    }
    router.push(`/admin/productos/editar/${product.id}`);
  };

  return (
    <tr 
      onClick={handleRowClick} 
      className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            {product.images?.[0] || product.imageUrl ? (
              <Image
                src={product.images?.[0] || product.imageUrl || ""}
                alt={product.name}
                fill
                className={cn(
                  "object-cover transition-all duration-500 ease-in-out",
                  imageLoading ? "scale-110 blur-sm grayscale" : "scale-100 blur-0 grayscale-0"
                )}
                sizes="48px"
                quality={50}
                onLoad={() => setImageLoading(false)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <span className="text-[10px]">Sin img</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{product.name}</p>
            <p className="text-xs text-gray-500 font-mono">{product.sku || "Sin SKU"}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {product.category}
          </span>
          {product.subCategory && (
            <span className="text-[10px] text-gray-400 mt-1 ml-1">
              ↳ {product.subCategory}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 font-medium text-gray-900">
        {formatPrice(product.price)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
          <span className="font-medium text-gray-700">{product.stock} u.</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <ProductActions id={product.id} isVisible={product.isVisible ?? true} />
      </td>
    </tr>
  );
}
