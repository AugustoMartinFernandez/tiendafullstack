"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { MessageCircle, X, UserPlus, ArrowRight } from "lucide-react";

interface Props {
  orderId: string;
}

export function SuccessClientActions({ orderId }: Props) {
  const { user, loading } = useAuth();
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  const handleWhatsAppClick = () => {
    // REEMPLAZAR CON TU NÚMERO REAL
    const phoneNumber = "5493511234567";
    const message = `Hola! Hice el pedido #${orderId.slice(0, 8)} y quiero coordinar el pago y envío.`;
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
    <>
      <div className="space-y-3 pt-6">
        <button
          onClick={handleWhatsAppClick}
          className="w-full group relative flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-200 transition-all active:scale-95 overflow-hidden"
        >
          <MessageCircle className="h-6 w-6 relative z-10" />
          <span className="relative z-10">Finalizar en WhatsApp</span>
        </button>

        <Link
          href="/tienda"
          className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 font-bold hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all"
        >
          Volver a la tienda
        </Link>
      </div>

      {/* Modal de Retención */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowRetentionModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95">
            <button
              onClick={() => setShowRetentionModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-8 pt-10 text-center">
              <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <UserPlus className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">
                ¡No pierdas tu pedido!
              </h2>
              <p className="text-gray-500 mb-8">
                Como compraste como invitado, no podrás rastrear el envío si
                cerrás esta web. <br />
                <span className="text-indigo-600 font-bold">
                  Creá tu cuenta para guardarlo.
                </span>
              </p>
              <div className="space-y-3">
                <Link
                  href={`/registro?redirect=/perfil/pedidos/${orderId}`}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95"
                >
                  Crear cuenta y guardar
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => setShowRetentionModal(false)}
                  className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 text-sm"
                >
                  No gracias
                </button>
              </div>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          </div>
        </div>
      )}
    </>
  );
}
