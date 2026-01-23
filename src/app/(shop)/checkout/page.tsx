import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center">
          <CreditCard className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Finalizar Compra</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Esta es una página de demostración. Aquí integrarías tu pasarela de pagos (MercadoPago, Stripe, etc.).
        </p>
        <Link 
          href="/tienda" 
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
