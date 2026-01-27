"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, registerPayment } from "@/lib/actions/orders";
import { Loader2, Pencil, X, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { Order, ORDER_STATUSES } from "@/lib/types";
import { PaymentHistory } from "@/components/admin/PaymentHistory";

interface OrderActionsProps {
  order: Order;
}

const MESSAGE_TEMPLATES = [
  { label: "Sin Stock", text: "Lamentablemente tuvimos que cancelar tu pedido por falta de stock. Disculpas por las molestias.", status: "cancelled" },
  { label: "Pago Recibido", text: "¡Pago recibido con éxito! Estamos preparando tu pedido." },
  { label: "Enviado", text: "Tu pedido ya está en camino. Te avisaremos cualquier novedad." },
  { label: "Falta Comprobante", text: "Por favor, subí el comprobante de pago para que podamos procesar tu pedido." },
];

export function OrderActions({ order }: OrderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Estado del Formulario
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState(order.adminNote || "");
  const [amountPaid, setAmountPaid] = useState(order.amountPaid || 0);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Usamos registerPayment para manejar la lógica financiera completa
      // Nota: registerPayment actualiza el estado automáticamente si se paga todo,
      // pero si el admin fuerza un estado manual, usamos updateOrderStatus después o combinamos.
      const result = await registerPayment(order.id, amountPaid, note);
      
      // Si el estado deseado es diferente al automático (ej: cancelar), forzamos update
      if (result.success && status !== order.status && status === 'cancelled') {
         await updateOrderStatus(order.id, status, note, amountPaid);
      }

      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Gestionar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">Gestionar Pedido #{order.id.slice(-6)}</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-4 space-y-4">
              {/* Selector de Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Pedido</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border rounded-md p-2 bg-white"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comprobante de Pago */}
              {order.paymentProofUrl && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex justify-between items-center">
                  <span className="text-sm text-blue-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Comprobante Adjunto
                  </span>
                  <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1">
                    Ver <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Input de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pago Realizado (Total: ${order.total})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max={order.total}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full border rounded-md p-2 pl-7"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Resta: <span className="font-bold text-red-600">${Math.max(0, order.total - amountPaid)}</span>
                </p>
              </div>

              {/* Nota Administrativa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje para el Cliente <span className="text-red-500">*</span>
                </label>
                
                {/* Plantillas Rápidas */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {MESSAGE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => {
                        setNote(tmpl.text);
                        if (tmpl.status) setStatus(tmpl.status as any);
                      }}
                      className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      title={tmpl.text}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribí un mensaje o seleccioná una plantilla..."
                  className="w-full border rounded-md p-2 min-h-[100px]"
                />
              </div>

              {/* Historial de Pagos */}
              <PaymentHistory order={order} />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
