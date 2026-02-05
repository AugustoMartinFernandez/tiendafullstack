"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "@/lib/user-service";
import { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  user: UserProfile;
}

export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    
    // Extraemos solo los campos permitidos para edición
    const data = {
      displayName: formData.get("displayName") as string,
      phone: formData.get("phone") as string,
      defaultAddress: formData.get("address") as string,
    };

    try {
      // ✅ Usamos la función puente que llama a la Server Action
      const result = await updateUserProfile(user.uid, data);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        router.refresh(); // Refresca los datos del servidor en la UI
      } else {
        setMessage({ type: 'error', text: result.message || 'Error al actualizar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ocurrió un error inesperado' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl animate-in fade-in duration-500">
      
      {message && (
        <div className={cn(
          "p-4 rounded-lg text-sm font-medium",
          message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        )}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm font-medium text-gray-700">Nombre Completo</label>
        <input
          name="displayName"
          // 👇 FIX: Si es null, usa string vacío
          defaultValue={user.displayName ?? ""} 
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-gray-700">Teléfono</label>
        <input
          name="phone"
          // 👇 FIX: Protegemos también el teléfono
          defaultValue={user.phone ?? ""}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium text-gray-700">Dirección de Envío Predeterminada</label>
        <textarea
          name="address"
          // 👇 FIX: Protegemos la dirección
          defaultValue={user.defaultAddress ?? ""}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
        />
      </div>

      <button
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
      </button>
    </form>
  );
}