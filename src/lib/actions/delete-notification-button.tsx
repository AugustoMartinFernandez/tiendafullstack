"use client";

import { useState, Fragment } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteNotification } from "@/lib/actions/notifications";
import { toast } from "sonner";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  notificationId: string;
}

export function DeleteNotificationButton({ notificationId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteNotification(notificationId);
      
      if (result.success) {
        toast.success("Notificación eliminada");
        setIsOpen(false);
        router.refresh(); // 🔄 Forzamos la actualización de la UI (Badge, Listas, etc.)
      } else {
        toast.error(result.message || "Error al eliminar");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Botón Trigger (Papelera) */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
        title="Eliminar notificación"
        aria-label="Eliminar notificación"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Modal de Confirmación */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeleting && setIsOpen(false)}>
          
          {/* Backdrop con desenfoque */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              
              {/* Panel del Modal */}
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-gray-100">
                  
                  <div className="flex items-start gap-4">
                    {/* Icono de Advertencia */}
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-50 sm:h-12 sm:w-12">
                      <AlertTriangle className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" aria-hidden="true" />
                    </div>
                    
                    <div className="mt-1">
                      <DialogTitle as="h3" className="text-lg font-bold leading-6 text-gray-900">
                        Eliminar notificación
                      </DialogTitle>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 leading-relaxed">
                          ¿Estás seguro de que querés eliminar esta notificación de tu historial? Esta acción no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 transition-colors"
                      onClick={() => setIsOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex justify-center items-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-bold text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                        isDeleting ? "bg-red-400 cursor-wait opacity-90" : "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100"
                      )}
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Eliminando...</span>
                        </>
                      ) : (
                        "Eliminar"
                      )}
                    </button>
                  </div>

                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
