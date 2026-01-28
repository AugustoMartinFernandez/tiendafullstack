"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { Order } from "@/lib/types";
import { 
  CheckCircle, 
  MessageCircle, 
  Copy, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  Package, 
  ArrowRight, 
  X, 
  UserPlus,
  Store
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SuccessTicketProps {
  order: Order;
}

export function SuccessTicket({ order }: SuccessTicketProps) {
  const { user, loading } = useAuth();
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setIsCopied(true);
    toast.success("ID copiado al portapapeles");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWhatsAppClick = () => {
    // REEMPLAZAR CON TU NÚMERO REAL
    const phoneNumber = "5493511234567"; 
    const message = `Hola! Hice el pedido #${order.id.slice(0, 8)} y quiero coordinar el pago y envío.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank");

    // Lógica de Retención (Trampa Ética) para invitados
    if (!loading && !user) {
      setTimeout(() => {
        setShowRetentionModal(true);
      }, 1500);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Encabezado Verde */}
      <div className="bg-emerald-500 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg animate-in zoom-in duration-500 delay-150">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">¡Compra Exitosa!</h1>
          <p className="text-emerald-100 font-medium text-sm mt-1">Comprobante Digital #{order.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* ID Copiable */}
        <button 
          onClick={handleCopyId}
          className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-xl border border-gray-200 transition-all group"
        >
          <span className="text-xs font-bold text-gray-500 uppercase">ID de Orden</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-gray-800">#{order.id.slice(0, 8)}</span>
            {isCopied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
          </div>
        </button>

        {/* Sección: Resumen de Items */}
        <div>
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" /> Resumen del Pedido
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">${item.price * item.quantity}</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">${order.total}</span>
            </div>
          </div>
        </div>

        {/* Sección: Datos de Envío */}
        {order.guestInfo && (
          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
            <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-3">Datos de Envío</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-indigo-500 mt-0.5" />
                <span className="font-medium text-gray-700">{order.guestInfo.name}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-indigo-500 mt-0.5" />
                <span className="font-medium text-gray-700">{order.guestInfo.address}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-indigo-500 mt-0.5" />
                <span className="font-medium text-gray-700">{order.guestInfo.phone}</span>
              </div>
            </div>
          </div>
        )}

        {/* Estado */}
        <div className="flex items-center justify-center gap-2 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wide">Pendiente de Pago</span>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleWhatsAppClick}
            className="w-full group relative flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-200 transition-all active:scale-95 overflow-hidden"
          >
            <MessageCircle className="h-6 w-6 relative z-10" />
            <span className="relative z-10">Finalizar en WhatsApp</span>
          </button>
          
          <Link href="/tienda" className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 font-bold hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all">
            <Store className="h-4 w-4" />
            Volver a la tienda
          </Link>
        </div>
      </div>

      {/* Modal de Retención */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowRetentionModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95">
            <button onClick={() => setShowRetentionModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
              <X className="h-5 w-5" />
            </button>
            <div className="p-8 pt-10 text-center">
              <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <UserPlus className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">¡No pierdas tu pedido!</h2>
              <p className="text-gray-500 mb-8">
                Como compraste como invitado, no podrás rastrear el envío si cerrás esta web. <br/>
                <span className="text-indigo-600 font-bold">Creá tu cuenta para guardarlo.</span>
              </p>
              <div className="space-y-3">
                <Link href={`/registro?redirect=/perfil/pedidos/${order.id}`} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95">
                  Crear cuenta y guardar
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <button onClick={() => setShowRetentionModal(false)} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 text-sm">
                  No gracias
                </button>
              </div>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          </div>
        </div>
      )}
    </div>
  );
}