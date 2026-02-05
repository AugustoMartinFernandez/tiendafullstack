import { Suspense } from "react";
import { getAdminDb } from "@/lib/firebase-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Asegúrate de tener estos componentes o usa divs con clases
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";

// Función auxiliar para obtener métricas rápidas
async function getDashboardMetrics() {
  const db = getAdminDb();
  // Esto es un ejemplo, idealmente usarías contadores reales o 'count()' de Firestore
  const ordersSnap = await db.collection("orders").count().get();
  const productsSnap = await db.collection("products").count().get();
  const usersSnap = await db.collection("users").count().get();
  
  return {
    orders: ordersSnap.data().count,
    products: productsSnap.data().count,
    users: usersSnap.data().count,
    revenue: 0 // Calcular ingresos reales requiere sumar órdenes
  };
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Resumen general de tu tienda.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS (Responsive Grid) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$ {metrics.revenue}</div>
            <p className="text-xs text-gray-500">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{metrics.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{metrics.users}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* AQUÍ PUEDES AGREGAR GRÁFICOS O TABLAS DE ÚLTIMOS PEDIDOS */}
    </div>
  );
}