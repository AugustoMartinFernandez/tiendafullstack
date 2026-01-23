import Link from "next/link";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Product } from "@/lib/types";
import { ProductActions } from "@/components/admin/product-actions";
import { cn } from "@/lib/utils";

// Buscamos productos (Resiliente a falta de índice en Firebase)
async function getProducts() {
  try {
    // Intentamos traerlos ordenados por fecha (más nuevos primero)
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  } catch (e) {
    // Si falla (por falta de índice), traemos todo sin ordenar para que no rompa la página
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      {/* Header con Título y Buscador Visual */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario Profesional</h1>
          <p className="text-sm text-gray-500">Gestioná, duplicá y ocultá productos.</p>
        </div>
        <div className="flex gap-3">
          {/* Buscador visual (Funcionalidad pendiente) */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="h-10 rounded-md border border-gray-300 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* --- VISTA MÓVIL (CARDS) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden pb-24">
        {products.map((product) => {
          const isVisible = product.isVisible !== false;
          const mainImage = product.imageUrl || product.images?.[0];

          return (
            <div key={product.id} className="relative flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
              {/* Imagen pequeña optimizada */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                {mainImage && (
                  <Image 
                    src={mainImage} 
                    alt={product.name} 
                    fill 
                    className="object-cover" 
                    sizes="64px"
                    quality={50}
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 truncate pr-6">{product.name}</h3>
                  {/* Menú de acciones absoluto para no romper layout */}
                  <div className="absolute top-2 right-2">
                    <ProductActions id={product.id} isVisible={isVisible} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-black text-gray-900">${product.price}</span>
                  {isVisible ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                      Visible
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      Oculto
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
           <div className="text-center py-10 text-gray-500">No hay productos.</div>
        )}
      </div>

      {/* --- VISTA DESKTOP (TABLA) --- */}
      <div className="hidden md:flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex-col">
        
        {/* WRAPPER RESPONSIVE:
            1. overflow-x-auto: Permite scroll horizontal en móviles.
            2. pb-40: Agrega espacio extra abajo para que el menú desplegable 
               del último ítem no se corte.
        */}
        <div className="overflow-x-auto min-h-75 pb-40">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Precio</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Variantes</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.length === 0 ? (
                // ESTADO VACÍO
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">Tu inventario está vacío</p>
                    <p className="text-sm">Empezá cargando tu primer producto.</p>
                  </td>
                </tr>
              ) : (
                // LISTADO DE PRODUCTOS
                products.map((product) => {
                  // Definimos si es visible (por defecto true si no existe el campo)
                  const isVisible = product.isVisible !== false;
                  const mainImage = product.imageUrl || product.images?.[0];

                  return (
                    <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                      
                      {/* COLUMNA 1: IMAGEN Y NOMBRE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center min-w-50">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            {mainImage && (
                              <Image 
                                src={mainImage} 
                                alt={product.name} 
                                fill 
                                className="object-cover" 
                                sizes="48px"
                                quality={50}
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 truncate max-w-37.5">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.category}</div>
                          </div>
                        </div>
                      </td>

                      {/* COLUMNA 2: ESTADO (VISIBLE / OCULTO) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isVisible ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Público
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                            Oculto
                          </span>
                        )}
                      </td>

                      {/* COLUMNA 3: PRECIOS */}
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        ${product.price}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="ml-2 text-xs font-normal text-gray-500 line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </td>

                      {/* COLUMNA 4: ATRIBUTOS CAMALEÓN */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.attributes ? (
                          <div className="flex flex-wrap gap-1 min-w-37.5">
                            {Object.entries(product.attributes).map(([k, v]) => (
                              <span key={k} className="inline-flex items-center rounded border border-gray-200 px-2 py-0.5 text-xs bg-white">
                                <span className="font-medium text-gray-700 mr-1">{k}:</span> {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Estándar</span>
                        )}
                      </td>

                      {/* COLUMNA 5: ACCIONES (3 PUNTITOS) */}
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <ProductActions id={product.id} isVisible={isVisible} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}