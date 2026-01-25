"use client";

import { useAuth } from "@/context/auth-context";
import Image from "next/image";
import { Package, Upload, LogOut, User as UserIcon, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { UserGuard } from "@/components/auth/user-guard";
import { useEffect, useState } from "react";
import { getUserOrders } from "@/lib/order-service";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (user) {
        const userOrders = await getUserOrders(user.uid);
        setOrders(userOrders);
      }
      setLoadingOrders(false);
    }
    
    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (!profile) return null; // El guard se encarga del loading y redirect

  return (
    <UserGuard>
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Tarjeta de Perfil */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="relative h-24 w-24 shrink-0">
            {profile.profilePhoto ? (
              <Image 
                src={profile.profilePhoto} 
                alt={profile.displayName} 
                fill 
                className="rounded-full object-cover border-4 border-indigo-50"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserIcon className="h-10 w-10" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-2xl font-black text-gray-900">{profile.displayName}</h1>
            <p className="text-gray-500 font-medium">{profile.email}</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
              Cliente Verificado
            </span>
          </div>

          <button 
            onClick={() => auth.signOut().then(() => router.push("/tienda"))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
          >
            <LogOut className="h-4 w-4" /> Cerrar Sesión
          </button>
        </div>

        {/* Sección de Pedidos */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" /> Mis Pedidos
            </h2>
          </div>
          
          <div className="p-6">
            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold">Aún no tenés pedidos</h3>
                <p className="text-gray-500 text-sm mt-1 mb-6">Tus compras aparecerán acá para que puedas seguirlas.</p>
                <button 
                  onClick={() => router.push("/tienda")}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Ir a la tienda &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold"><Clock className="h-3 w-3" /> Pendiente</span>}
                        {order.status === 'approved' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle className="h-3 w-3" /> Aprobado</span>}
                        {order.status === 'cancelled' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><XCircle className="h-3 w-3" /> Cancelado</span>}
                        <span className="text-lg font-black text-gray-900">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-sm text-gray-600">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carga de Comprobantes */}
        <div className="bg-indigo-900 rounded-3xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black mb-2">¿Tenés un pago pendiente?</h3>
              <p className="text-indigo-200 text-sm max-w-md">Si realizaste una transferencia, subí tu comprobante aquí para que podamos procesar tu pedido más rápido.</p>
            </div>
            <button className="flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
              <Upload className="h-5 w-5" /> Subir Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
    </UserGuard>
  );
}
