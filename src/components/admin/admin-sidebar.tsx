"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Store } from "lucide-react";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import Image from "next/image";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Productos", href: "/admin/productos", icon: Package },
  { name: "Ventas", href: "/admin/ventas", icon: ShoppingCart },
  { name: "Configuración", href: "/admin/configuracion", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex h-screen sticky top-0">
      <div className="flex flex-col border-b border-gray-100 px-6 py-6 gap-6">
        <h1 className="text-xl font-black tracking-tight text-gray-900">Admin Panel</h1>
        
        {user && (
          <div className="flex items-center gap-3 p-2 -mx-2 rounded-xl bg-gray-50 border border-gray-100">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
              <Image
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "Admin")}&background=random`}
                alt={user.displayName || "Admin"}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 truncate">
                {user.displayName || "Administrador"}
              </span>
              <span className="text-[10px] text-gray-500 truncate font-medium">
                {user.email}
              </span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Detectamos si la ruta actual coincide o es una sub-ruta (ej: /admin/productos/editar)
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900"
        >
          <Store className="h-5 w-5" />
          Ver Tienda
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}