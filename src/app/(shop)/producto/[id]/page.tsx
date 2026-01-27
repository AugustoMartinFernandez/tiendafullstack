import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Product } from "@/lib/types";
import { notFound } from "next/navigation";
import { 
  Check, ShieldCheck, Truck, 
  ChevronRight, AlertCircle, Tag
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductGallery } from "@/components/shop/product-gallery"; // Ya lo vamos a crear
import { AddToCart } from "@/components/shop/add-to-cart";
import { FavoriteButton, ShareButton } from "@/components/shop/product-interactions";
import { getStoreProducts } from "@/lib/actions/products";
import { getStoreConfig, getCategories } from "@/lib/actions/settings";
import { formatPrice } from "@/lib/format";

// 1. OBTENCIÓN DE DATOS (Server Side)
async function getProduct(id: string) {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
  } catch (error) {
    console.error("Error fetching product:", error);
  }
  return null;
}

// 2. SEO DINÁMICO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: `${product.name} | Doña Jovita`,
    description: product.description || `Comprá ${product.name}. Calidad garantizada en nuestra tienda oficial.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  const storeConfig = await getStoreConfig(); // Obtenemos configuración global

  if (!product) notFound();

  // Lógica de Precios
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Lógica de Envío Configurable
  const freeShippingThreshold = storeConfig?.freeShippingThreshold || 50000; // Umbral por defecto
  const hasFreeShipping = product.price >= freeShippingThreshold;
  
  // Textos Configurables (Con fallbacks a los valores solicitados)
  const shippingText = hasFreeShipping ? "Envío Gratis a todo el país" : (storeConfig?.shippingText || "Envíos a todo el país");
  const shippingSubtext = storeConfig?.shippingSubtext || "Recibilo en tu puerta en 48/72hs.";
  const securityText = storeConfig?.securityText || "Compra 100% Segura";
  const securitySubtext = storeConfig?.securitySubtext || "Tus datos están protegidos con encriptación SSL.";

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* BREADCRUMBS (Navegación UX) */}
        <nav className="flex items-center space-x-2 text-xs font-medium text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-primary transition-colors">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/tienda?category=${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
          {product.subCategory && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/tienda?category=${product.category}&subCategory=${product.subCategory}`} className="hover:text-primary transition-colors">{product.subCategory}</Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          
          {/* --- COLUMNA IZQUIERDA: GALERÍA (6/12) --- */}
          <div className="lg:col-span-7">
            {/* Pasamos el array de imágenes al componente de galería */}
            <ProductGallery images={product.images || [product.imageUrl]} name={product.name} />
          </div>

          {/* --- COLUMNA DERECHA: COMPRA (5/12) --- */}
          <div className="mt-10 px-0 sm:mt-16 lg:mt-0 lg:col-span-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    {product.category}
                  </span>
                  {product.subCategory && (
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700 ring-1 ring-inset ring-purple-700/10">
                      {product.subCategory}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  {product.name}
                </h1>
                {product.sku && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 font-mono">
                    <Tag className="h-3 w-3" /> SKU: {product.sku}
                  </div>
                )}
              </div>
              <FavoriteButton product={product} />
            </div>

            {/* PRECIO Y OFERTA */}
            <div className="mt-6 flex items-end gap-3">
              <p className="text-4xl font-bold text-gray-900 tracking-tight">
                {formatPrice(product.price)}
              </p>
              {hasDiscount && (
                <div className="flex flex-col mb-1">
                  <span className="text-sm font-bold text-red-600">
                    {discountPercentage}% OFF
                  </span>
                  <span className="text-lg text-gray-400 line-through leading-none">
                    {formatPrice(product.originalPrice!)}
                  </span>
                </div>
              )}
            </div>

            {/* DESCRIPCIÓN DEL PRODUCTO */}
            {product.description && (
              <div className="mt-6 prose prose-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                <p>{product.description}</p>
              </div>
            )}

            {/* ATRIBUTOS "CAMALEÓN" (Variantes) */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="mt-10 border-t border-gray-100 pt-8">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                  Especificaciones
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex flex-col p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{key}</span>
                      <span className="text-sm font-semibold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DISPONIBILIDAD */}
            {product.stock > 0 ? (
              <div className="mt-8 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100 w-fit">
                <Check className="h-4 w-4 text-green-600" />
                <p className="text-sm font-bold text-green-700">
                  ¡Stock disponible! ({product.stock} unidades)
                </p>
              </div>
            ) : (
              <div className="mt-8 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 w-fit">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-bold text-red-700">
                  Producto actualmente sin stock
                </p>
              </div>
            )}

            {/* BOTONES DE COMPRA */}
            <div className="mt-10 flex flex-col gap-4">
              {product.stock > 0 && <AddToCart product={product} />}
              <ShareButton productName={product.name} />
            </div>

            {/* BENEFICIOS (Trust Badges) */}
            <div className="mt-10 grid grid-cols-1 gap-4 border-t border-gray-100 pt-8">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", hasFreeShipping ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600")}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{shippingText}</p>
                  <p className="text-xs text-gray-500">{shippingSubtext}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{securityText}</p>
                  <p className="text-xs text-gray-500">{securitySubtext}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}