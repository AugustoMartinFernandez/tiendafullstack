import { getUserOrders } from "@/lib/actions/orders";
import { requireUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Calendar, ArrowRight, History, Clock, FileText, AlertCircle, Info } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { OrderStatus, PaymentStatus } from "@/lib/types";
import { ClaimGuestOrders } from "@/app/(shop)/mis-pedidos/ClaimGuestOrders.client";
import { PaymentProofUpload } from "@/components/shop/payment-proof-upload";
import { DeleteProofButton } from "@/components/shop/delete-proof-button";

export default async function MisPedidosPage() {
  const user = await requireUser();
  
  if (!user) {
    redirect("/login?redirect=/mis-pedidos");
  }

  // 2. Obtener pedidos (ahora incluyendo los recién vinculados)
  const orders = await getUserOrders(user.uid);

 return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 1. Auto-Linking: Ejecutado desde el cliente para soportar revalidatePath */}
      {user.email && <ClaimGuestOrders email={user.email} />}

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
            {orders.map((order) => {
              // --- CORRECCIÓN CLAVE: Definimos pendingProof AQUÍ, dentro del map ---
              const pendingProof = order.paymentProofs?.find(p => p.status === 'pending_review');

              return (
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

                  {/* Nota del Admin (Feedback) */}
                  {order.adminNote && (
                    <div className={`mx-6 mt-6 p-4 rounded-xl border flex items-start gap-3 ${
                      order.status === 'cancelled' 
                        ? 'bg-red-50 border-red-100 text-red-800' 
                        : 'bg-blue-50 border-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'cancelled' ? (
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-5 w-5 shrink-0 mt-0.5" />
                      )}
                      <div className="text-sm">
                        <p className="font-bold">Nota del Vendedor:</p>
                        <p className="mt-1 leading-relaxed">{order.adminNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Mensaje de Revisión de Pago (USANDO LA VARIABLE DEFINIDA ARRIBA) */}
                  {order.status === 'payment_review' && pendingProof && (
                    <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-bold">
                          Comprobante enviado por {pendingProof.amountClaimed ? formatPrice(pendingProof.amountClaimed) : "monto a verificar"}
                        </p>
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
                    <div className="pt-4 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                      {/* Subida de Comprobante */}
                      {order.status !== 'cancelled' && order.paymentStatus !== 'paid' && (
                        <div className="w-full sm:w-auto">
                          <PaymentProofUpload orderId={order.id} userId={user.uid} />
                          
                          {/* Lista de comprobantes subidos */}
                          {order.paymentProofs && order.paymentProofs.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {order.paymentProofs.map((proof) => (
                                <div key={proof.id} className="flex items-center justify-between gap-2 bg-blue-50/50 p-2 rounded border border-blue-100">
                                  <a 
                                    href={proof.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate"
                                  >
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">Comprobante ({new Date(proof.uploadedAt).toLocaleDateString()})</span>
                                  </a>
                                  
                                  {proof.status === 'pending_review' && (
                                    <DeleteProofButton orderId={order.id} proofId={proof.id} />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : order.paymentProofUrl && (
                             // Fallback Legacy
                             <a 
                              href={order.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors bg-blue-50/50 p-2 rounded border border-blue-100"
                            >
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span>Ver comprobante enviado</span>
                            </a>
                          )}
                        </div>
                      )}

                      <Link 
                        href={`/checkout/success?orderId=${order.id}`}
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-auto sm:ml-0"
                      >
                        Ver Recibo / Pagar <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
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
