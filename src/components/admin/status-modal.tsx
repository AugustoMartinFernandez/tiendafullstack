"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { Order } from "@/lib/types";
import { AlertTriangle, X } from "lucide-react";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  currentStatus: string;
  newStatus: Order['status'];
  orderId: string;
}

export function StatusModal({ isOpen, onClose, onConfirm, currentStatus, newStatus, orderId }: StatusModalProps) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note);
    setNote(""); // Reset
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar Cambio de Estado
            </DialogTitle>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Estás por cambiar el estado del pedido <span className="font-mono font-bold">#{orderId.slice(0,6)}</span>
            </p>
            
            <div className="flex items-center justify-center gap-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-xs font-bold uppercase text-gray-500">{currentStatus}</span>
              <span className="text-gray-400">→</span>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                newStatus === 'approved' ? 'bg-green-100 text-green-700' : 
                newStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {newStatus}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nota de Auditoría (Opcional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Pago confirmado por comprobante #1234"
                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}