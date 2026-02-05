// src/app/(admin)/admin/clientes/[id]/page.tsx
import { getClientDetails } from "@/lib/actions/users";
import { ClientDetail } from "@/components/admin/ClientDetail";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function ClientDetailPage({ params }: Props) {
  // En Next.js 15 params es una promesa. Usamos await para obtener el valor real.
  const { id } = await params; 
  
  const data = await getClientDetails(id);

  if (!data) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <Link 
        href="/admin/clientes" 
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la lista
      </Link>

      <ClientDetail 
        user={data.user} 
        orders={data.orders} 
        logs={[]} // Los logs se pueden implementar luego si tienes esa tabla
      />
    </div>
  );
}
