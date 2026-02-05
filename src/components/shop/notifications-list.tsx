"use client";

import { useEffect, useState, useTransition } from "react";
import { onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { Bell, Loader2, CheckCheck, Package, CreditCard, AlertCircle, Info, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkReadButton } from "./mark-read-button";
import { DeleteNotificationButton } from "./delete-notification-button";
import { deleteAllNotifications } from "@/lib/actions/notifications";
import { toast } from "sonner";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
  orderId?: string;
}

export function NotificationsList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(5);
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, limitCount]);

  // Helper para iconos según tipo
  const getIcon = (type?: string) => {
    switch (type) {
      case 'PAYMENT_ADDED': return CreditCard;
      case 'STATUS_CHANGE': return Package;
      case 'CANCELLED': return AlertCircle;
      default: return Info;
    }
  };

  // Helper para colores de iconos
  const getIconColor = (type?: string) => {
    switch (type) {
      case 'PAYMENT_ADDED': return "text-green-600 bg-green-50";
      case 'STATUS_CHANGE': return "text-blue-600 bg-blue-50";
      case 'CANCELLED': return "text-red-600 bg-red-50";
      default: return "text-indigo-600 bg-indigo-50";
    }
  };

  // Helper para tiempo relativo
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "hace un momento";
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} d`;
    return date.toLocaleDateString();
  };

  // --- LÓGICA DE AGRUPACIÓN ---
  const groupedNotifications = (() => {
    const groups: Record<string, Notification[]> = {
      "Hoy": [],
      "Ayer": [],
      "Anteriores": []
    };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      
      if (date.toDateString() === today.toDateString()) {
        groups["Hoy"].push(notification);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups["Ayer"].push(notification);
      } else {
        groups["Anteriores"].push(notification);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  })();

  // Función para mostrar toast de confirmación personalizado
  const showDeleteConfirmation = () => {
    toast.custom(
      (t) => (
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
          {/* Header */}
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm">¿Eliminar todas?</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                ¿Estás seguro de que deseas eliminar TODAS las notificaciones? Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!user?.uid) {
                  toast.error("Usuario no identificado");
                  toast.dismiss(t);
                  return;
                }

                startTransition(async () => {
                  const result = await deleteAllNotifications(user.uid);

                  if (result.success) {
                    toast.success(result.message, {
                      description: `Se eliminaron ${notifications.length} notificaciones`,
                    });
                    setLimitCount(5);
                  } else {
                    toast.error(result.message || "Error al eliminar");
                  }

                  toast.dismiss(t);
                });
              }}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-600 disabled:opacity-50 text-white text-xs font-bold transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar"
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.dismiss(t);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // No desaparece automáticamente
        position: "top-center",
      }
    );
  };

  // 1. ESTADO DE CARGA (Feedback visual inmediato)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-400 space-y-3 min-h-75">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-bold uppercase tracking-widest">Cargando...</p>
      </div>
    );
  }

  // 2. ESTADO VACÍO (Empty State amigable)
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center h-full">
        <div className="bg-gray-50 p-4 rounded-full mb-4 border border-gray-100 animate-in zoom-in duration-300">
          <CheckCheck className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-base font-black text-gray-900">Todo al día</h3>
        <p className="text-xs text-gray-500 mt-1 font-medium max-w-50">
          No tenés notificaciones nuevas por el momento.
        </p>
      </div>
    );
  }

  // 3. LISTA DE NOTIFICACIONES
  return (
    <div className="flex flex-col h-full sm:max-h-150">
      {/* Header Fijo */}
      <div className="px-5 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gray-900 tracking-tight">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full shadow-sm shadow-indigo-200 animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Lista Scrollable */}
      <div className="overflow-y-auto flex-1 p-3 space-y-6 bg-gray-50/50 scroll-smooth">
        {groupedNotifications.map(([label, groupItems]) => (
          <div key={label} className="space-y-3">
            <h4 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-50/95 backdrop-blur-sm py-1 z-10">
              {label}
            </h4>
            {groupItems.map((notification) => {
          const Icon = getIcon(notification.type);
          const iconColorClass = getIconColor(notification.type);

          return (
            <div 
              key={notification.id} 
              className={cn(
                "relative group flex gap-4 p-4 rounded-2xl border transition-all duration-300",
                "hover:shadow-md hover:border-indigo-100 hover:bg-white",
                !notification.read 
                  ? "bg-white border-indigo-100 shadow-sm" 
                  : "bg-white/40 border-transparent"
              )}
            >
              {/* Icono Distintivo */}
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", iconColorClass)}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Contenido */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <p className={cn(
                    "text-sm leading-snug line-clamp-2",
                    !notification.read ? "font-bold text-gray-900" : "font-medium text-gray-600"
                  )}>
                    {notification.message}
                  </p>
                  
                  {/* Indicador No Leído */}
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1.5 shadow-[0_0_0_2px_rgba(255,255,255,1)]" />
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-gray-400">
                    {getRelativeTime(notification.createdAt)}
                  </span>
                  
                  {/* Acciones (Visibles en hover desktop, siempre accesibles por espacio) */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    {!notification.read && (
                        <MarkReadButton notificationId={notification.id} />
                    )}
                    <DeleteNotificationButton notificationId={notification.id} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
          </div>
        ))}

        {/* Botón Cargar Más */}
        {notifications.length >= limitCount && (
          <div className="pt-2 pb-4 text-center">
             <button 
               onClick={() => setLimitCount(prev => prev + 5)}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
             >
               <ChevronDown className="h-3 w-3" />
               Cargar más
             </button>
          </div>
        )}
      </div>

      {/* Footer con Botones */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 shrink-0">
        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                showDeleteConfirmation();
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-all"
            >
              Borrar Todas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
