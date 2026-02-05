"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, ImageIcon, Package } from "lucide-react";
import { deleteProduct } from "@/lib/actions/products";
import { cn } from "@/lib/utils";

// Definimos la interfaz localmente basada en lo que devuelve tu backend
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  sku?: string;
  images?: string[];
  imageUrl?: string;
}

export function ProductListItem({ product }: { product: Product }) {
  // Helper para imagen
  const mainImage = product.images?.[0] || product.imageUrl;

  return (
    <tr className="flex flex-col md:table-row bg-white rounded-xl shadow-sm md:shadow-none mb-4 md:mb-0 border border-gray-100 md:border-b md:border-gray-100 p-4 md:p-0 gap-4 transition-colors hover:bg-gray-50/50">
      
      {/* COLUMNA 1: PRODUCTO (Imagen + Nombre + SKU) */}
      <td className="flex md:table-cell items-center gap-4 md:px-6 md:py-4">
        <div className="relative h-16 w-16 md:h-12 md:w-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
          {mainImage ? (
            <Image 
              src={mainImage} 
              alt={product.name} 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 64px, 48px"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-gray-400">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-gray-900 text-base md:text-sm truncate pr-4">
            {product.name}
          </span>
          <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
            {product.sku || "S/N"}
          </span>
        </div>
      </td>

      {/* COLUMNA 2: CATEGORÍA */}
      <td className="flex md:table-cell justify-between md:justify-start items-center md:px-6 md:py-4">
        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</span>
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {product.category}
        </span>
      </td>

      {/* COLUMNA 3: PRECIO */}
      <td className="flex md:table-cell justify-between md:justify-start items-center md:px-6 md:py-4">
        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Precio</span>
        <span className="font-bold text-gray-900">
          ${product.price.toLocaleString()}
        </span>
      </td>

      {/* COLUMNA 4: STOCK */}
      <td className="flex md:table-cell justify-between md:justify-start items-center md:px-6 md:py-4">
        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Stock</span>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2.5 w-2.5 rounded-full",
            product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-yellow-500" : "bg-red-500"
          )} />
          <span className={cn(
            "text-sm font-medium",
            product.stock === 0 ? "text-red-600" : "text-gray-700"
          )}>
            {product.stock} u.
          </span>
        </div>
      </td>

      {/* COLUMNA 5: ACCIONES */}
      <td className="flex md:table-cell gap-3 md:px-6 md:py-4 md:text-right mt-2 md:mt-0 border-t md:border-0 pt-4 md:pt-0 border-gray-100">
        <Link 
          href={`/admin/productos/editar/${product.id}`} 
          className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-4 py-2.5 md:py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-sm font-bold"
        >
          <Edit className="h-4 w-4" />
          <span className="md:hidden">Editar</span>
        </Link>
        
        <form action={async (formData) => {
          await deleteProduct(formData);
        }} className="flex-1 md:flex-none">
          <input type="hidden" name="id" value={product.id} />
          <button 
            type="submit"
            className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-4 py-2.5 md:py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-bold"
          >
            <Trash2 className="h-4 w-4" />
            <span className="md:hidden">Eliminar</span>
          </button>
        </form>
      </td>
    </tr>
  );
}
