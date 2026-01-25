"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/order-service";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Loader2, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/toast-context";

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    // Actualización optimista (UI primero)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
      showToast("Estado actualizado correctamente", "success");
    } else {
      showToast("Error al actualizar el estado", "error");
      loadOrders(); // Revertir cambios si falla
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(filter.toLowerCase()) ||
    order.guestInfo?.email.toLowerCase().includes(filter.toLowerCase()) ||
    order.guestInfo?.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900">Ventas y Pedidos</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por ID, nombre o email..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Pedido</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Cliente</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Fecha</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Estado</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">
                      {order.guestInfo?.name || "Usuario Registrado"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.guestInfo?.email || "Ver detalles"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-black text-gray-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      order.status === 'approved' ? "bg-green-100 text-green-700" :
                      order.status === 'cancelled' ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    )}>
                      {order.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                      {order.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                      {order.status === 'pending' && <Clock className="h-3 w-3" />}
                      {order.status === 'approved' ? 'Aprobado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 outline-none focus:border-indigo-500 cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobar</option>
                      <option value="cancelled">Cancelar</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-10 text-center text-gray-400 text-sm">
            No se encontraron pedidos.
          </div>
        )}
      </div>
    </div>
  );
}