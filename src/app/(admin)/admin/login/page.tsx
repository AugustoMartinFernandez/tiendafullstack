import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <LoginForm redirectTo="/admin" title="Acceso Administrador" isAdmin />
    </div>
  );
}
