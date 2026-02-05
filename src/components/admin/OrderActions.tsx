"use client";

import { useState, useTransition, useEffect } from "react";
import { updateOrderStatus, addOrderPayment, reviewPaymentProof } from "@/lib/actions/orders";
import { Loader2, Pencil, X, FileText, CheckCircle, XCircle, LayoutDashboard, CreditCard, History, MessageSquare, MessageCircle, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Order, ORDER_STATUSES } from "@/lib/types";
import { PaymentHistory } from "@/components/admin/PaymentHistory";
import { cn } from "@/lib/utils";

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
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'history'>('general');
  const [whatsappMessage, setWhatsAppMessage] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    const itemsList = order.items?.map(item => 
      `• ${item.quantity}x *${item.name}* ${item.sku ? `(SKU: ${item.sku})` : ""} → ${origin}/producto/${item.id}`
    ).join('\n') || "";

    setWhatsAppMessage(`Hola *${order.guestInfo?.name || 'Cliente'}*, te escribimos por tu pedido *#${order.id.slice(-8)}*. Resta abonar: $${order.balance}.\n\n*Detalle del pedido:*\n${itemsList}\n\nPor favor envianos el comprobante cuando puedas. ¡Gracias!`);
  }, [order]);
  
  // Estado del Formulario
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState(order.adminNote || "");
  const [amountToAdd, setAmountToAdd] = useState<string>(""); // Empezamos vacío para obligar a escribir

  const executeUpdate = async () => {
    const amount = Number(amountToAdd) || 0;
    let success = false;

    // 1. Intentar registrar pago (Solo si el monto es mayor a 0)
    if (amount > 0) {
      const resPayment = await addOrderPayment(order.id, amount, note);
      if (!resPayment.success) {
        toast.error(resPayment.message);
        return; // Detenemos todo si falla el pago (prioridad financiera)
      }
      success = true;
      toast.success(resPayment.message);
    }

    // 2. Actualizar Estado / Nota
    const statusChanged = status !== order.status;
    const noteChanged = note !== (order.adminNote || "");

    if (statusChanged || (amount === 0 && noteChanged)) {
       const resStatus = await updateOrderStatus(order.id, status, note);
       if (resStatus.success) {
         success = true;
         if (amount === 0 || statusChanged) toast.success(resStatus.message);
       } else {
         toast.error(resStatus.message);
         return;
       }
    }

    if (success) {
      setIsOpen(false);
      setShowConfirmCancel(false);
      setAmountToAdd(""); // Reset
    } else if (amount === 0 && !statusChanged && !noteChanged) {
      setIsOpen(false); // Cerrar si no hubo cambios
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Interceptar cancelación para pedir confirmación
    if (status === 'cancelled' && order.status !== 'cancelled') {
      setShowConfirmCancel(true);
      return;
    }

    startTransition(executeUpdate);
  };

  // Handler para validar comprobantes
  const handleProofReview = async (proofId: string, decision: 'approved' | 'rejected') => {
    let amount = 0;
    if (decision === 'approved') {
      const input = window.prompt("Monto a acreditar por este comprobante:", order.balance.toString());
      if (input === null) return; // Cancelado
      amount = Number(input);
      if (isNaN(amount) || amount <= 0) return toast.error("Monto inválido");
    }

    const res = await reviewPaymentProof(order.id, proofId, decision, amount);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleDownloadHistoryPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error("Por favor, permití las ventanas emergentes para descargar el PDF.");
        return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Historial de Movimientos - Pedido #${order.id.slice(-8)}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            h1 { font-size: 24px; margin: 0; }
            .meta { font-size: 12px; color: #666; text-align: right; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px; background: #f9fafb; font-weight: 800; text-transform: uppercase; color: #666; }
            td { border-bottom: 1px solid #eee; padding: 10px; vertical-align: top; }
            .amount { text-align: right; font-weight: bold; font-family: monospace; font-size: 14px; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
                <h1>Historial de Movimientos</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Pedido <strong>#${order.id.slice(-8)}</strong></p>
            </div>
            <div class="meta">
                <p>Cliente: <strong>${order.guestInfo?.name || 'Invitado'}</strong></p>
                <p>Fecha de Emisión: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Detalle / Nota</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${order.payments?.map(p => `
                <tr>
                  <td>
                    ${new Date(p.date).toLocaleDateString()}
                    <div style="font-size: 10px; color: #999;">${new Date(p.date).toLocaleTimeString()}</div>
                  </td>
                  <td>${p.note || '-'}</td>
                  <td class="amount ${p.amount >= 0 ? 'positive' : 'negative'}">
                    ${p.amount >= 0 ? '+' : ''}${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(p.amount)}
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="3" style="text-align:center; padding: 20px;">Sin movimientos registrados.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Documento generado automáticamente por el sistema de gestión.
          </div>

          <script>
            window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Helper for status colors
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
      >
        <Pencil className="w-3.5 h-3.5" />
        Gestionar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
          {/* Modal Container: Bottom Sheet on Mobile, Centered Card on Desktop */}
          <div className="bg-white w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[85vh] flex flex-col rounded-t-[2rem] sm:rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h3 className="font-black text-xl text-gray-900 tracking-tight">Gestionar Pedido</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">ID: <span className="font-mono">{order.id.slice(-8)}</span></p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors border border-gray-200 shadow-sm active:scale-90">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Navigation - Segmented Control Style */}
            <div className="px-5 pb-4 pt-2 bg-white shrink-0">
                <div className="flex p-1.5 bg-gray-100/80 rounded-2xl gap-1">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all touch-manipulation",
                        activeTab === 'general' ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">General</span><span className="sm:hidden">Gral.</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('finance')}
                        className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all touch-manipulation",
                        activeTab === 'finance' ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        )}
                    >
                        <CreditCard className="w-4 h-4" /> Finanzas
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all touch-manipulation",
                        activeTab === 'history' ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        )}
                    >
                        <History className="w-4 h-4" /> Historial
                    </button>
                </div>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white overscroll-contain">
              <form id="order-form" onSubmit={handleUpdate} className="space-y-8 pb-10">
                
                {/* TAB 1: GENERAL */}
                {activeTab === 'general' && (
                  <div className="space-y-8 animate-in slide-in-from-left-4 duration-200 fade-in">
                    
                    {/* Status Selector */}
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Estado del Pedido</label>
                      <div className="flex flex-wrap gap-3">
                        {ORDER_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s as any)}
                            className={cn(
                              "px-5 py-3 rounded-2xl text-sm font-bold border transition-all capitalize active:scale-95 touch-manipulation",
                              status === s 
                                ? getStatusColor(s) + " ring-2 ring-offset-2 ring-indigo-500/20 shadow-sm"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin Note & Templates */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Mensaje / Nota <span className="text-red-500">*</span></label>
                      </div>
                      
                      {/* Quick Chips */}
                      <div className="flex flex-wrap gap-2.5">
                        {MESSAGE_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.label}
                            type="button"
                            onClick={() => {
                              setNote(tmpl.text);
                              if (tmpl.status) setStatus(tmpl.status as any);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors border border-indigo-100 active:scale-95 touch-manipulation"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {tmpl.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        required
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Escribí un mensaje para el cliente o una nota interna..."
                        className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[140px] text-base sm:text-sm font-medium resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: FINANCE */}
                {activeTab === 'finance' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-200 fade-in">
                    
                    {/* Balance Card */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl shadow-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total del Pedido</p>
                          <p className="text-3xl font-black tracking-tight">${order.total}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-1">Resta Pagar</p>
                          <p className="text-3xl font-black text-red-400 tracking-tight">${order.balance}</p>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Reminder */}
                    {order.guestInfo?.phone && order.balance > 0 && (
                      <div className="p-5 bg-green-50 rounded-3xl border border-green-100 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 rounded-2xl text-green-600 shrink-0">
                            <MessageCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-800">Recordatorio de Pago</p>
                            <p className="text-xs text-green-600 font-medium">Enviar mensaje al {order.guestInfo.phone}</p>
                          </div>
                        </div>
                        
                        <textarea
                          value={whatsappMessage}
                          onChange={(e) => setWhatsAppMessage(e.target.value)}
                          className="w-full p-4 rounded-2xl border border-green-200 bg-white text-base sm:text-sm text-gray-700 focus:ring-4 focus:ring-green-500/20 outline-none resize-none"
                          rows={3}
                        />

                        <div className="flex justify-end">
                          <a
                            href={`https://wa.me/${order.guestInfo.phone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-2 active:scale-95"
                          >
                            <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Payment Input */}
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Ingresar Pago Manual</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                        <input
                          type="number"
                          min="0"
                          max={order.balance}
                          value={amountToAdd}
                          onChange={(e) => setAmountToAdd(e.target.value)}
                          className="w-full pl-10 pr-5 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 text-base sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium ml-1">
                        * Al guardar, este monto se descontará de la deuda y se registrará en el historial.
                      </p>
                    </div>

                    {/* Proofs */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Comprobantes Adjuntos</label>
                      
                      {(!order.paymentProofs || order.paymentProofs.length === 0) && !order.paymentProofUrl && (
                        <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-400 font-medium">No hay comprobantes cargados.</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Legacy Support */}
                        {(!order.paymentProofs || order.paymentProofs.length === 0) && order.paymentProofUrl && (
                           <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                              <span className="text-xs font-bold text-blue-700">Comprobante (Legacy)</span>
                              <a href={order.paymentProofUrl} target="_blank" className="text-xs font-bold text-blue-600 hover:underline">Ver Archivo</a>
                           </div>
                        )}
                        
                        {order.paymentProofs?.map((proof) => (
                          <div key={proof.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow gap-4">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6 text-gray-500" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <a href={proof.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-900 hover:text-indigo-600 truncate block">
                                  Ver Comprobante
                                </a>
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-wide",
                                  proof.status === 'approved' ? 'text-green-600' : proof.status === 'rejected' ? 'text-red-500' : 'text-yellow-600'
                                )}>
                                  {proof.status === 'pending_review' ? 'Pendiente de Revisión' : proof.status}
                                </span>
                              </div>
                            </div>
                            
                            {proof.status === 'pending_review' && (
                              <div className="flex gap-3 sm:ml-auto">
                                <button type="button" onClick={() => handleProofReview(proof.id, 'approved')} className="flex-1 sm:flex-none py-2 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold text-xs active:scale-95" title="Aprobar">
                                  <CheckCircle className="w-4 h-4" /> Aprobar
                                </button>
                                <button type="button" onClick={() => handleProofReview(proof.id, 'rejected')} className="flex-1 sm:flex-none py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold text-xs active:scale-95" title="Rechazar">
                                  <XCircle className="w-4 h-4" /> Rechazar
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: HISTORY */}
                {activeTab === 'history' && (
                  <div className="animate-in slide-in-from-bottom-4 duration-200 fade-in">
                    {order.payments && order.payments.length > 0 && (
                      <div className="flex justify-end mb-4">
                        <button
                          type="button"
                          onClick={handleDownloadHistoryPDF}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
                        >
                          <Download className="w-4 h-4" /> Descargar PDF
                        </button>
                      </div>
                    )}
                    <PaymentHistory order={order} />
                  </div>
                )}

              </form>
            </div>

            {/* Footer Actions */}
            <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-gray-600 hover:bg-white hover:text-gray-900 rounded-xl border border-transparent hover:border-gray-200 transition-all active:scale-95"
              >
                Cancelar
              </button>
              
              {/* Only show Save button on General or Finance tabs where inputs exist */}
              {(activeTab === 'general' || activeTab === 'finance') && (
                <button
                  type="submit"
                  form="order-form"
                  disabled={isPending}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-gray-200 transition-all active:scale-95"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
              )}
            </div>

          </div>

          {/* Modal de Confirmación de Cancelación (Overlay extra) */}
          {showConfirmCancel && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-red-100">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-lg">¿Cancelar Pedido?</h3>
                </div>
                
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Estás a punto de marcar este pedido como <strong>Cancelado</strong>. Esta acción es importante y podría notificar al cliente.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmCancel(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(executeUpdate)}
                    disabled={isPending}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
