"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteNotification } from "@/lib/actions/notifications";
import { toast } from "sonner";

interface DeleteNotificationButtonProps {
  notificationId: string;
  onDeleted?: () => void;
}

export function DeleteNotificationButton({ 
  notificationId, 
  onDeleted 
}: DeleteNotificationButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await deleteNotification(notificationId);

      if (result.success) {
        toast.success("Notificación eliminada");
        onDeleted?.();
      } else {
        toast.error(result.message || "Error al eliminar");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Eliminar notificación"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
