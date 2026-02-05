"use client";

import { useState, useTransition } from "react";
import { UserProfile, Order } from "@/lib/types";
import { updateClientNote } from "@/lib/actions/users";
import { OrderActions } from "@/components/admin/OrderActions";
import { formatPrice } from "@/lib/format";
import { User, Mail, Save, Loader2, FileText, Activity, Package, CreditCard, Clock, CheckCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  user: UserProfile;
  orders: Order[];
  logs: any[];
}

export function ClientDetail({ user, orders, logs }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'logs'>('info');
  const [note, setNote] = useState(user.internalNote || "");
  const [isPending, startTransition] = useTransition();

  const handleSaveNote = () => {
    startTransition(async () => {
      const res = await updateClientNote(user.uid, note);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  // KPIs
  const totalSpent = orders.reduce((acc, o) => acc + (o.amountPaid || 0), 0);
  const registrationDate = new Date(user.createdAt || Date.now());
  const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-8">
      
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm p-6 sm:p-10">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <User className="w-64 h-64" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-4 border-white shadow-lg flex items-center justify-center text-indigo-600 shrink-0">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                    <span className="text-3xl font-black">{user.displayName?.charAt(0) || "U"}</span>
                )}
            </div>
            <div className="text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{user.displayName || "Usuario Sin Nombre"}</h1>
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                        user.role === 'admin' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                        {user.role}
                    </span>
                </div>
                <p className="text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="w-4 h-4" /> {user.email}
                </p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest pt-2">
                    ID: <span className="font-mono font-normal normal-case select-all">{user.uid}</span>
                </p>
            </div>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <CreditCard className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Gastado</p>
                <p className="text-xl font-black text-gray-900">{formatPrice(totalSpent)}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Package className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pedidos Totales</p>
                <p className="text-xl font-black text-gray-900">{orders.length}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                <Clock className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Antigüedad</p>
                <p className="text-xl font-black text-gray-900">{daysSinceRegistration} días</p>
            </div>
        </div>
      </div>

      {/* 3. TABS SYSTEM */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
        {/* Navigation */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
            <button
                onClick={() => setActiveTab('info')}
                className={cn(
                    "flex-1 py-4 px-6 text-sm font-bold text-center border-b-2 transition-colors whitespace-nowrap",
                    activeTab === 'info' ? "border-indigo-600 text-indigo-600 bg-indigo-50/30" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
            >
                Información Personal
            </button>
            <button
                onClick={() => setActiveTab('orders')}
                className={cn(
                    "flex-1 py-4 px-6 text-sm font-bold text-center border-b-2 transition-colors whitespace-nowrap",
                    activeTab === 'orders' ? "border-indigo-600 text-indigo-600 bg-indigo-50/30" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
            >
                Historial de Pedidos
            </button>
            <button
                onClick={() => setActiveTab('logs')}
                className={cn(
                    "flex-1 py-4 px-6 text-sm font-bold text-center border-b-2 transition-colors whitespace-nowrap",
                    activeTab === 'logs' ? "border-indigo-600 text-indigo-600 bg-indigo-50/30" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
            >
                Logs de Actividad
            </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
            
            {/* TAB 1: INFO */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" /> Datos de Contacto
                        </h3>
                        <div className="space-y-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase">Email</span>
                                <span className="font-medium text-gray-900">{user.email}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase">Teléfono</span>
                                <span className="font-medium text-gray-900">{user.phone || "No registrado"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase">Fecha de Registro</span>
                                <span className="font-medium text-gray-900">{registrationDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase">Dirección (Última)</span>
                                <span className="font-medium text-gray-900 flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                    {orders[0]?.guestInfo?.address || "Sin dirección registrada"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" /> Notas Internas
                        </h3>
                        <div className="relative">
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full h-48 p-4 rounded-2xl border border-gray-200 bg-yellow-50/50 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none shadow-inner"
                                placeholder="Escribí notas privadas sobre este cliente (preferencias, problemas, devoluciones)..."
                            />
                            <div className="absolute bottom-4 right-4">
                                <button
                                    onClick={handleSaveNote}
                                    disabled={isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ORDERS */}
            {activeTab === 'orders' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Este cliente no tiene pedidos.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {orders.map((order) => (
                                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md group">
                                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0",
                                            order.status === 'approved' ? "bg-green-500" : order.status === 'cancelled' ? "bg-red-500" : "bg-yellow-500"
                                        )}>
                                            {order.status === 'approved' ? <CheckCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-gray-900">#{order.id.slice(0, 8)}</span>
                                                <span className="text-xs text-gray-400">• {new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                {order.items.length} productos • Total: <span className="text-gray-900 font-bold">{formatPrice(order.total)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Deuda</p>
                                            <p className={cn("font-bold text-sm", order.balance > 0 ? "text-red-600" : "text-green-600")}>
                                                {formatPrice(order.balance)}
                                            </p>
                                        </div>
                                        <OrderActions order={order} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: LOGS */}
            {activeTab === 'logs' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No hay actividad registrada.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 py-2">
                            {logs.map((log) => (
                                <div key={log.id} className="relative pl-8">
                                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-indigo-200" />
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                <span className="uppercase text-xs bg-gray-100 px-2 py-0.5 rounded mr-2 text-gray-600 border border-gray-200">{log.action}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                                        </div>
                                        {log.metadata && (
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-[10px] font-mono text-gray-600 max-w-xs overflow-x-auto">
                                                {JSON.stringify(log.metadata)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
