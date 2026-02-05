"use client";

import { useTransition } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { markNotificationAsRead } from "@/lib/actions/notifications";
import { toast } from "sonner";

interface MarkReadButtonProps {
  notificationId: string;
  onMarked?: () => void;
}

export function MarkReadButton({ 
  notificationId, 
  onMarked 
}: MarkReadButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleMarkRead = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await markNotificationAsRead(notificationId);

      if (result.success) {
        toast.success("Marcada como leída");
        onMarked?.();
      } else {
        toast.error(result.message || "Error al marcar");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleMarkRead}
      disabled={isPending}
      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Marcar como leída"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCheck className="w-4 h-4" />
      )}
    </button>
  );
}