import { getUserOrders } from "@/lib/actions/orders";
import { requireUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default async function MisPedidosPage() {
  const user = await requireUser();
  if (!user) redirect("/auth/login");

  const orders = await getUserOrders(user.uid);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="w-6 h-6" /> Mis Pedidos
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No tienes pedidos registrados.</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">Pedido #{order.id.slice(-6)}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    order.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {order.status === 'approved' ? 'Aprobado' : 
                     order.status === 'cancelled' ? 'Cancelado' : 
                     order.status === 'shipped' ? 'Enviado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-gray-600">${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  {/* Financial Summary */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Estado de Cuenta:</span>
                        {order.paymentStatus === 'paid' ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Pagado
                          </span>
                        ) : order.paymentStatus === 'partial' ? (
                          <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                            <Clock className="w-4 h-4" /> Pago Parcial
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" /> Pendiente de Pago
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block">Total</span>
                          <span className="font-bold">${order.total}</span>
                        </div>
                        <div className="border-l pl-4">
                          <span className="text-gray-500 block">Pagado</span>
                          <span className="font-medium text-green-600">${order.amountPaid || 0}</span>
                        </div>
                        <div className="border-l pl-4">
                          <span className="text-gray-500 block">Debés</span>
                          <span className={`font-bold ${order.balance && order.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            ${order.balance ?? order.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Note */}
                  {order.adminNote && (
                    <div className="mt-4 bg-blue-50 border border-blue-100 p-3 rounded-md">
                      <p className="text-xs font-bold text-blue-800 mb-1">Nota del Vendedor:</p>
                      <p className="text-sm text-blue-700">{order.adminNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
