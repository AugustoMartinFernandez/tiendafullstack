"use client";

import { Order } from "@/lib/types";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react";

export function PaymentHistory({ order }: { order: Order }) {
  if (!order.payments || order.payments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
        <History className="w-4 h-4" /> Historial de Movimientos
      </h4>
      
      <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 font-bold uppercase bg-gray-100/50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Nota</th>
              <th className="px-4 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.payments.map((pay) => (
              <tr key={pay.id} className="hover:bg-white transition-colors">
                <td className="px-4 py-3 text-gray-600">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{new Date(pay.date).toLocaleDateString()}</span>
                    <span className="text-[10px] text-gray-400">{new Date(pay.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {pay.recordedBy.split('@')[0]}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={pay.note}>
                  {pay.note || "-"}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${pay.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {pay.amount >= 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Math.abs(pay.amount))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}