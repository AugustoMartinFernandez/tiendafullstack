"use client";

import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Acceso Administrador
          </h1>
          <p className="text-gray-400 mt-2">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <LoginForm
          redirectTo="/admin"
          title="Acceso Administrador"
          isAdmin={true}
        />
      </div>
    </div>
  );
}
