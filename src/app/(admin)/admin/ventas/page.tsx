import { getAllOrders } from "@/lib/actions/orders";
import { OrderActions } from "@/components/admin/OrderActions";
import { User, Ghost, MessageCircle, MapPin, Phone, Calendar, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const orders = await getAllOrders();

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ventas</h1>
           <p className="text-gray-500 mt-2 font-medium">Gestioná tus pedidos y clientes en tiempo real.</p>
         </div>
         <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
           <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
             <DollarSign className="h-5 w-5" />
           </div>
           <div>
             <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Total Ventas</span>
             <span className="text-xl font-black text-gray-900">{orders.length}</span>
           </div>
         </div>
       </div>

       {/* Tabla de Pedidos */}
       <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                 <th className="px-6 py-5">Pedido</th>
                 <th className="px-6 py-5">Cliente</th>
                 <th className="px-6 py-5">Contacto</th>
                 <th className="px-6 py-5">Dirección</th>
                 <th className="px-6 py-5">Estado / Total</th>
                 <th className="px-6 py-5 text-right">Acciones</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {orders.map((order) => {
                 // --- LÓGICA HÍBRIDA DE DATOS ---
                 const isGuest = !order.userId || order.userId === "guest";
                 
                 // Prioridad: Usuario Registrado > Guest Info > Anónimo
                 const name = order.user?.name || order.guestInfo?.name || "Anónimo";
                 const email = order.user?.email || order.guestInfo?.email || "Sin email";
                 const phone = order.user?.phone || order.guestInfo?.phone;
                 const address = order.user?.address || order.guestInfo?.address || "Retiro en local / Sin dirección";
                 
                 // Formato de fecha
                 const date = new Date(order.createdAt).toLocaleDateString("es-AR", {
                   day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                 });

                 return (
                   <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                     
                     {/* ID y Fecha */}
                     <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="font-mono font-bold text-gray-900 text-sm">#{order.id.slice(0, 6)}</span>
                         <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                           <Calendar className="h-3 w-3" />
                           {date}
                         </div>
                       </div>
                     </td>

                     {/* Cliente (Con Badge de Invitado) */}
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full shrink-0 ${isGuest ? "bg-orange-50 text-orange-500" : "bg-indigo-50 text-indigo-600"}`}>
                           {isGuest ? <Ghost className="h-5 w-5" /> : <User className="h-5 w-5" />}
                         </div>
                         <div className="flex flex-col max-w-[180px]">
                           <span className="font-bold text-gray-900 truncate" title={name}>{name}</span>
                           <span className="text-xs text-gray-500 truncate" title={email}>{email}</span>
                           {isGuest && <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide mt-0.5">Invitado</span>}
                         </div>
                       </div>
                     </td>

                     {/* Contacto (WhatsApp) */}
                     <td className="px-6 py-4">
                       {phone ? (
                         <a 
                           href={`https://wa.me/${phone.replace(/\D/g, "")}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-bold border border-green-100"
                         >
                           <MessageCircle className="h-3.5 w-3.5" />
                           {phone}
                         </a>
                       ) : (
                         <span className="text-xs text-gray-400 italic">Sin teléfono</span>
                       )}
                     </td>

                     {/* Dirección */}
                     <td className="px-6 py-4">
                       <div className="flex items-start gap-2 max-w-[200px]">
                         <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                         <span className="text-sm text-gray-600 leading-snug line-clamp-2" title={address}>
                           {address}
                         </span>
                       </div>
                     </td>

                     {/* Estado y Total */}
                     <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                         <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                           ${order.status === 'approved' ? 'bg-green-100 text-green-700' : 
                             order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                             order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                             'bg-yellow-100 text-yellow-700'
                           }`}>
                           {order.status === 'payment_review' ? 'Revisión' : order.status}
                         </span>
                         <span className="font-black text-gray-900">{formatPrice(order.total)}</span>
                       </div>
                     </td>

                     {/* Acciones */}
                     <td className="px-6 py-4 text-right">
                       <OrderActions order={order} />
                     </td>
                   </tr>
                 );
               })}
               
               {orders.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                     No hay ventas registradas todavía.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
    </div>
  );
}
