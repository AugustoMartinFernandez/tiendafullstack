// c:\Users\mff06\Desktop\mi-tienda-pro\src\components\admin\ClientsPanel.tsx

"use client";

import { useState } from "react";
import { ClientWithOrders } from "@/lib/actions/users";
import { Search, User, Phone, Mail, ChevronDown, ChevronUp, AlertCircle, Package, Eye, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { OrderActions } from "@/components/admin/OrderActions";
import Link from "next/link";

interface Props {
  initialClients: ClientWithOrders[];
}

export function ClientsPanel({ initialClients }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Filtrado en tiempo real
  const filteredClients = initialClients.filter(client => {
    const term = searchTerm.toLowerCase();
    return (
      client.displayName?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone?.includes(term) ||
      client.uid.includes(term)
    );
  });

  const toggleExpand = (clientId: string) => {
    setExpandedClientId(prev => prev === clientId ? null : clientId);
  };

  return (
    <div className="space-y-8">
      {/* Buscador Mejorado */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Buscar clientes por nombre, email o teléfono..."
          className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-500 border border-gray-200">
                {filteredClients.length} resultados
            </span>
        </div>
      </div>

      {/* VISTA DESKTOP: Tabla */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Pedidos</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Deuda</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Total Gastado</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredClients.map((client) => (
              <tr 
                key={client.uid} 
                className="group hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 shadow-sm">
                      {client.photoURL ? (
                        <img src={client.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{client.displayName || "Sin Nombre"}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 mt-1">
                        {client.role === 'admin' ? 'ADMIN' : 'CLIENTE'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400" /> {client.email}
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400" /> {client.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100">
                    {client.ordersCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {client.totalDebt > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="h-3 w-3" />
                      {formatPrice(client.totalDebt)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">
                  {formatPrice(client.totalSpent)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                        href={`/admin/clientes/${client.uid}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Ver Perfil Completo"
                    >
                        <Eye className="h-5 w-5" />
                    </Link>
                    <button 
                        onClick={() => toggleExpand(client.uid)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        {expandedClientId === client.uid ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Expanded View (Desktop Only) */}
        {expandedClientId && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in slide-in-from-top-2">
                {(() => {
                    const client = filteredClients.find(c => c.uid === expandedClientId);
                    if (!client) return null;
                    return (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                                <Package className="h-4 w-4" /> Últimos Pedidos de {client.displayName}
                            </h4>
                            {client.orders.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No hay pedidos recientes.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {client.orders.slice(0, 3).map(order => (
                                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${order.status === 'approved' ? 'bg-green-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                <span className="font-mono text-sm font-bold text-gray-700">#{order.id.slice(0,8)}</span>
                                                <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
                                                <OrderActions order={order} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-center pt-2">
                                        <Link href={`/admin/clientes/${client.uid}`} className="text-xs font-bold text-indigo-600 hover:underline">
                                            Ver todos los pedidos &rarr;
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        )}
      </div>

      {/* VISTA MOBILE: Tarjetas */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredClients.map((client) => (
          <div key={client.uid} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm active:scale-[0.99] transition-transform">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                        {client.photoURL ? (
                            <img src={client.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <User className="h-5 w-5" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{client.displayName || "Sin Nombre"}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{client.role}</span>
                    </div>
                </div>
                <Link 
                    href={`/admin/clientes/${client.uid}`}
                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                    <ArrowRight className="h-5 w-5" />
                </Link>
            </div>

            <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" /> 
                    <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" /> {client.phone}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
                <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pedidos</p>
                    <p className="text-sm font-black text-gray-900">{client.ordersCount}</p>
                </div>
                <div className="text-center border-l border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Gastado</p>
                    <p className="text-sm font-black text-gray-900">{formatPrice(client.totalSpent)}</p>
                </div>
                <div className="text-center border-l border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Deuda</p>
                    <p className={`text-sm font-black ${client.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPrice(client.totalDebt)}
                    </p>
                </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No se encontraron clientes</h3>
            <p className="text-gray-500">Intenta con otro término de búsqueda.</p>
        </div>
      )}
    </div>
  );
}
