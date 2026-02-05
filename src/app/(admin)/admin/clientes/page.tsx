// src/app/(admin)/admin/clientes/page.tsx
import { getClientsWithOrders } from "@/lib/actions/users";
import { ClientsPanel } from "@/components/admin/ClientsPanel";
import { Users } from "lucide-react";

export const metadata = {
  title: "Gestión de Clientes | Admin",
};

export default async function ClientesPage() {
  const clients = await getClientsWithOrders();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-indigo-600" /> Clientes Registrados
        </h1>
        <span className="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm font-bold text-gray-600 shadow-sm">
          Total: {clients.length}
        </span>
      </div>

      <ClientsPanel initialClients={clients} />
    </div>
  );
}
