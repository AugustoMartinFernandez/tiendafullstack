import Link from "next/link";
import { Product } from "@/lib/types";
import { ShoppingCart, Heart } from "lucide-react";
import { cn } from "@/lib/utils"; // Usamos una utilidad de Tailwind para mezclar clases si hace falta

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Calculamos si hay descuento
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Formateador de moneda
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      
      {/* SECCIÓN IMAGEN */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {/* Imagen con efecto Zoom al pasar el mouse */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />

        {/* Badge de Oferta (Solo aparece si hay descuento) */}
        {hasDiscount && (
          <div className="absolute left-2 top-2 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground shadow-sm">
            -{discountPercentage}% OFF
          </div>
        )}

        {/* Botón de Wishlist (Corazón) */}
        <button className="absolute right-2 top-2 rounded-full bg-white/80 p-2 text-gray-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500">
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* SECCIÓN INFO */}
      <div className="flex flex-1 flex-col p-4">
        {/* Categoría y Atributos (Grisecito) */}
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-primary">{product.category}</span>
          <span>•</span>
          <span className="truncate">
            {product.attributes 
              ? Object.values(product.attributes).join(" / ") 
              : "Estándar"}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-base font-bold text-foreground line-clamp-2">
          <Link href={`/producto/${product.id}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {product.name}
          </Link>
        </h3>

        {/* Precios (Abajo del todo para alinear tarjetas de distinta altura) */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice!)}
              </span>
            )}
            <span className="text-lg font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Botón Carrito: En desktop aparece con hover, en móvil siempre visible */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all group-hover:bg-primary/90">
             <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}