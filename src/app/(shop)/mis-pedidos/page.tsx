import { getUserOrders, claimGuestOrders } from "@/lib/actions/orders";
import { requireUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Calendar, ArrowRight, History, Clock } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { OrderStatus, PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MisPedidosPage() {
  const user = await requireUser();
  
  if (!user) {
    redirect("/login?redirect=/mis-pedidos");
  }

  // 1. Auto-Linking: "Adopción" automática de pedidos huérfanos al entrar
  if (user.email) {
    await claimGuestOrders(user.email);
  }

  // 2. Obtener pedidos (ahora incluyendo los recién vinculados)
  const orders = await getUserOrders(user.uid);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Pedidos</h1>
          <Link href="/tienda" className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
            Ir a la tienda &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Aún no tenés pedidos</h3>
            <p className="text-gray-500 mt-2">Tus compras aparecerán acá.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Header del Pedido */}
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pedido #{order.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span className="text-xl font-black text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Mensaje de Revisión de Pago */}
                {order.status === 'payment_review' && order.paymentProof && (
                  <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold">Comprobante enviado por {formatPrice(order.paymentProof.amountClaimed)}</p>
                      <p className="text-blue-600/80 mt-1">Estamos verificando tu pago. Te avisaremos cuando se apruebe.</p>
                    </div>
                  </div>
                )}

                {/* Cuerpo */}
                <div className="p-6 space-y-6">
                  {/* Items (Resumen) */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">
                          <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* --- SECCIÓN DE HISTORIAL DE PAGOS (TRANSPARENCIA) --- */}
                  {order.payments && order.payments.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                        <History className="h-3 w-3" /> Historial de Pagos
                      </h4>
                      <div className="space-y-3">
                        {order.payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between items-start text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-700">
                                {new Date(payment.date).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-500 italic">{payment.note || "Pago registrado"}</span>
                            </div>
                            <span className={`font-bold ${payment.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {payment.amount >= 0 ? '+' : ''}{formatPrice(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Resumen Financiero */}
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                        <span className="text-gray-500">Pagado: <span className="font-bold text-green-600">{formatPrice(order.amountPaid)}</span></span>
                        <span className="text-gray-500">Resta: <span className="font-bold text-red-600">{formatPrice(order.balance)}</span></span>
                      </div>
                    </div>
                  )}

                  {/* Footer / Acciones */}
                  <div className="pt-2 flex justify-end">
                    <Link 
                      href={`/checkout/success?orderId=${order.id}`}
                      className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Ver Recibo / Pagar <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    payment_review: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    shipped: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const labels = {
    pending: "Pendiente",
    payment_review: "Revisando Pago",
    approved: "Aprobado",
    shipped: "Enviado",
    cancelled: "Cancelado",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const styles = {
    unpaid: "bg-red-100 text-red-700",
    partial: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
  };

  const labels = {
    unpaid: "Impago",
    partial: "Pago Parcial",
    paid: "Pagado",
  };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
