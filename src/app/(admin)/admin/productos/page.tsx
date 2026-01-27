import { getAdminProducts, getProductsCount } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/settings";
import { ProductRow } from "@/components/admin/product-row";
import { AdminCategorySelector } from "@/components/admin/admin-category-selector";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = 'force-dynamic';


export const metadata = {
  title: "Admin Productos",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const cursor = typeof params.cursor === "string" ? params.cursor : undefined;
  const dir = params.dir === "prev" ? "prev" : "next";
  const category = typeof params.category === "string" ? params.category : undefined;
  const page = typeof params.page === "string" ? Number(params.page) : 1;

  // Obtenemos los productos del servidor
  const { products, firstId, lastId } = await getAdminProducts(cursor, dir, search, category);
  const totalProducts = await getProductsCount();
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">Gestioná tu catálogo ({totalProducts} productos en total).</p>
        </div>
        <div className="flex gap-2">
          <AdminCategorySelector categories={categories} />
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <Plus className="h-5 w-5" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-black tracking-wider">Producto</th>
                <th className="px-6 py-4 font-black tracking-wider">Categoría</th>
                <th className="px-6 py-4 font-black tracking-wider">Precio</th>
                <th className="px-6 py-4 font-black tracking-wider">Stock</th>
                <th className="px-6 py-4 font-black tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay productos cargados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINACIÓN */}
      {/* Solo mostramos paginación si no hay búsqueda activa (la búsqueda usa scroll infinito o límite fijo) */}
      {!search && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <span className="text-sm font-medium text-gray-500">
            Página {page}
          </span>
          <div>
            {cursor && (
              <Link
                href={`/admin/productos?cursor=${firstId}&dir=prev&page=${page - 1}${category ? `&category=${category}` : ""}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Link>
            )}
          </div>
          <div>
            {products.length === 20 && (
              <Link
                href={`/admin/productos?cursor=${lastId}&dir=next&page=${page + 1}${category ? `&category=${category}` : ""}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm ml-2"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}