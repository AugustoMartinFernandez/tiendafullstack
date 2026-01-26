// src/app/(shop)/mis-pedidos/page.tsx
import { getUserOrdersServer } from "@/lib/actions";
import { formatPrice } from "@/lib/format";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function MisPedidosPage() {
  const orders = await getUserOrdersServer();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-gray-900">Historial de Pedidos</h1>
          <Link href="/perfil" className="text-sm font-bold text-indigo-600 hover:underline">
            Volver al Perfil
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No hay pedidos registrados</h3>
            <p className="text-gray-500 mt-2">Tus compras aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pedido #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.status === 'pending' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold"><Clock className="h-3 w-3" /> Pendiente</span>}
                    {order.status === 'approved' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle className="h-3 w-3" /> Aprobado</span>}
                    {order.status === 'cancelled' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><XCircle className="h-3 w-3" /> Cancelado</span>}
                    <span className="text-xl font-black text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-50 pt-4">
                  <p className="text-sm text-gray-600 font-medium">
                    {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
