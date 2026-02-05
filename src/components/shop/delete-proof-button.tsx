"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deletePaymentProof } from "@/lib/actions/orders";
import { useToast } from "@/context/toast-context";

interface DeleteProofButtonProps {
  orderId: string;
  proofId: string;
}

export function DeleteProofButton({ orderId, proofId }: DeleteProofButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este comprobante?")) return;

    setIsDeleting(true);
    try {
      const result = await deletePaymentProof(orderId, proofId);
      if (result.success) {
        showToast("Comprobante eliminado", "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error al eliminar", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
      title="Eliminar comprobante"
      type="button"
    >
      {isDeleting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
    </button>
  );
}