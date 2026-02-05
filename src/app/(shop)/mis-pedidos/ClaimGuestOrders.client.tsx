// src/app/(shop)/mis-pedidos/ClaimGuestOrders.client.tsx
"use client";

import { useEffect } from "react";
import { claimGuestOrders } from "@/lib/actions/orders";

export function ClaimGuestOrders({ email }: { email: string }) {
  useEffect(() => {
    // Ejecutamos la Server Action al montar el componente.
    // Al ser una Server Action invocada desde el cliente, revalidatePath() funcionará correctamente,
    // actualizando la vista de pedidos si hubo cambios.
    const sync = async () => {
      try {
        await claimGuestOrders(email);
      } catch (error) {
        console.error("Error syncing guest orders:", error);
      }
    };
    sync();
  }, [email]);

  // Este componente no renderiza nada visualmente
  return null;
}
