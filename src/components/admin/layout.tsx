import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="container mx-auto p-6 md:p-10 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}