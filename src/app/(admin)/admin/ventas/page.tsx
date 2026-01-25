"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/order-service";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  RefreshCw, 
  User, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/toast-context";

const ITEMS_PER_PAGE = 10;

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estado para manejar loaders individuales por fila al actualizar
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  
  const { showToast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      showToast("Error al cargar pedidos", "error");
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE FILTRADO Y BÚSQUEDA ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filtro por Estado
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // 2. Búsqueda (ID, Cliente, Productos)
      if (!searchTerm) return true;
      
      const term = searchTerm.toLowerCase();
      const idMatch = order.id.toLowerCase().includes(term);
      const guestNameMatch = order.guestInfo?.name.toLowerCase().includes(term);
      const guestEmailMatch = order.guestInfo?.email.toLowerCase().includes(term);
      // Buscamos también dentro de los nombres de los productos del pedido
      const productMatch = order.items.some((item: any) => item.name.toLowerCase().includes(term));

      return idMatch || guestNameMatch || guestEmailMatch || productMatch;
    });
  }, [orders, searchTerm, statusFilter]);

  // --- PAGINACIÓN ---
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // --- MANEJO DE ESTADO ---
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    if (!window.confirm(`¿Estás seguro de cambiar el estado a "${newStatus}"?`)) return;

    // 1. UI Optimista
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // 2. Loader individual
    setUpdatingIds(prev => new Set(prev).add(orderId));

    // 3. Llamada API
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
      showToast("Estado actualizado correctamente", "success");
    } else {
      showToast("Error al actualizar el estado", "error");
      setOrders(previousOrders); // Revertir
    }

    // 4. Limpiar loader
    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  // --- EXPORTAR CSV ---
  const handleExportCSV = () => {
    const headers = ["ID", "Fecha", "Cliente", "Email", "Total", "Estado", "Productos"];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.date).toLocaleDateString(),
      o.userId ? "Usuario Registrado" : o.guestInfo?.name || "Invitado",
      o.guestInfo?.email || "N/A",
      o.total,
      o.status,
      o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(" | ")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-gray-500 font-medium">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <>

    <div className="space-y-8 pb-20">
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Panel de Ventas</h1>
            <p className="text-sm text-gray-500">Gestioná tus pedidos y estados en tiempo real.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadOrders} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors" title="Recargar">
              <RefreshCw className="h-5 w-5" />
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE PEDIDOS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs w-24">ID</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Cliente</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Fecha</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs max-w-xs">Resumen</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* ID */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      #{order.id.slice(0, 6)}
                    </span>
                  </td>

                  {/* CLIENTE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full shrink-0 relative group", order.userId ? "bg-indigo-100 text-indigo-600" : "bg-orange-100 text-orange-600")}>
                        {order.userId ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          {order.userId ? "Usuario Registrado" : "Invitado"}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {order.userId ? "Usuario Registrado" : order.guestInfo?.name || "Invitado"}
                        </div>
                        <a href={`mailto:${order.guestInfo?.email}`} className="text-xs text-gray-500 hover:text-indigo-600 hover:underline">
                          {order.guestInfo?.email || (order.userId ? "Ver perfil" : "Sin email")}
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* FECHA */}
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col">
                      <span className="font-medium">{new Date(order.date).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400">{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>

                  {/* RESUMEN PRODUCTOS */}
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-xs text-gray-600 line-clamp-2" title={order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}>
                      {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>
                  </td>

                  {/* TOTAL */}
                  <td className="px-6 py-4 font-black text-gray-900">
                    {formatPrice(order.total)}
                  </td>

                  {/* ESTADO (SELECTOR) */}
                  <td className="px-6 py-4">
                    <div className="relative">
                      {updatingIds.has(order.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        </div>
                      )}
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors",
                        order.status === 'approved' ? "bg-green-50 border-green-200 text-green-700" :
                        order.status === 'cancelled' ? "bg-red-50 border-red-200 text-red-700" :
                        "bg-yellow-50 border-yellow-200 text-yellow-700"
                      )}>
                        {order.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                        {order.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                        {order.status === 'pending' && <Clock className="h-3 w-3" />}
                        
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                          className="bg-transparent outline-none cursor-pointer w-full appearance-none"
                          disabled={updatingIds.has(order.id)}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="approved">Aprobado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* ESTADO VACÍO */}
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-3">
              <AlertTriangle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-bold">No se encontraron pedidos</h3>
            <p className="text-gray-500 text-sm">Intentá cambiar los filtros o la búsqueda.</p>
          </div>
        )}

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
