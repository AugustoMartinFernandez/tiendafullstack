import { CheckCircle, MessageCircle, Package, Clock, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { getOrderById } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/format";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Image from "next/image";

export const metadata = {
  title: "Pedido Confirmado",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const user = await requireUser();

  // Si no hay usuario, redirigimos al login
  if (!user) {
    redirect("/login?redirect=/checkout/success");
  }

  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    notFound(); 
  }

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  // --- LÓGICA WHATSAPP INTACTA ---
  const PHONE_NUMBER = "5493815949243"; 
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  let whatsappMessage = `👋 ¡Hola! Quiero confirmar mi pedido *#${order.id.slice(0, 8).toUpperCase()}*.\n\n`;
  order.items.forEach(item => {
    whatsappMessage += `▪️ *${item.quantity}x ${item.name}* (${formatPrice(item.price)})\n`;
    whatsappMessage += `   🔗 ${baseUrl}/producto/${item.id}\n`;
  });
  whatsappMessage += `\n💰 *TOTAL: ${formatPrice(order.total)}*\n\n`;
  
  // La información del cliente siempre está en `guestInfo`
  const clientInfo = order.guestInfo;

  if (clientInfo) {
    whatsappMessage += `📋 *Mis Datos:*\n`;
    whatsappMessage += `👤 Nombre: ${clientInfo.name}\n`;
    whatsappMessage += `📍 Dirección: ${clientInfo.address}\n`;
    whatsappMessage += `📱 Teléfono: ${clientInfo.phone}\n`;
    if (clientInfo.notes) whatsappMessage += `📝 Notas: ${clientInfo.notes}\n`;
  }
  const encodedWhatsappMessage = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedWhatsappMessage}`;
  // ------------------------------

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-100 max-w-lg w-full">
        
        {/* Encabezado de Éxito */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">¡Pedido Confirmado!</h2>
          <p className="text-gray-500 mb-8 text-sm sm:text-base">
            Tu pedido <span className="font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span> ha sido registrado.
            <br className="hidden sm:block"/> Para finalizar, envianos el detalle por WhatsApp.
          </p>
        </div>

        {/* Resumen del Pedido Mejorado */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-100/50">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-600" /> Resumen de compra
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span>Pendiente</span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-4">
                {/* Imagen del Producto */}
                <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <Image
                    src={item.imageUrl || "/images/product-placeholder.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                
                {/* Detalles */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm line-clamp-2">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cantidad: <span className="font-medium text-gray-900">{item.quantity}</span>
                  </p>
                </div>
                
                {/* Precio */}
                <p className="font-bold text-gray-900 text-sm whitespace-nowrap">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="bg-gray-100/50 p-4 border-t border-gray-200 flex justify-between items-center">
             <span className="text-gray-600 font-medium">Total a Pagar</span>
             <span className="text-xl font-black text-gray-900">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Datos de Envío (Visual) */}
        {clientInfo && (
          <div className="mb-8 p-4 rounded-xl border border-gray-100 bg-white text-sm space-y-2 text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> <span>{clientInfo.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" /> <span className="line-clamp-1">{clientInfo.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" /> <span>{clientInfo.phone}</span>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-green-200 flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" /> Confirmar por WhatsApp
          </a>
          
          <Link 
            href="/mis-pedidos" 
            className="w-full py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Package className="h-5 w-5" /> Ir a Mis Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}