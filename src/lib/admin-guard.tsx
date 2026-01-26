import { requireAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import React from "react";

export async function AdminGuard({ children }: { children: React.ReactNode }) {
  try {
    // Verificamos la sesión y permisos en el servidor antes de renderizar nada
    await requireAdmin();
  } catch (error) {
    // Si no es admin o no hay sesión, redirigimos inmediatamente
    redirect("/admin/login");
  }

  // Si pasa la verificación, mostramos el contenido
  return <>{children}</>;
}