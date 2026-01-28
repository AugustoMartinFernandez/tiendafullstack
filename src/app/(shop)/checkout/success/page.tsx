import Link from "next/link";
import Image from "next/image";
import { Package, CheckCircle, MapPin, Phone, User } from "lucide-react";
import { getOrderSuccessDetails } from "@/lib/actions/orders";
import { SuccessClientActions } from "./success-client-actions";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  const order = orderId ? await getOrderSuccessDetails(orderId) : null;

  if (!order) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Package className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No encontramos tu pedido</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Parece que el enlace expiró o el ID es incorrecto. Si acabas de comprar, revisa tu correo.
        </p>
        <Link href="/" className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
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
          
          {/* ID Visual */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase">ID de Orden</span>
            <span className="font-mono font-bold text-gray-800">#{order.id.slice(0, 8)}</span>
          </div>

          {/* Resumen de Items */}
          <div>
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" /> Resumen del Pedido
            </h3>
            <div className="space-y-3">
              {order.items.map((item: any) => (
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

          {/* Datos de Envío */}
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

          {/* Acciones del Cliente (WhatsApp + Modal) */}
          <SuccessClientActions orderId={order.id} />
          
        </div>
      </div>
    </div>
  );
}
