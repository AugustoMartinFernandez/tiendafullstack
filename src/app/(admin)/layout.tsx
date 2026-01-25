"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Calendar,
  FileText,
  Menu,
  Bell,
  LogOut,
} from "lucide-react";
import { Dialog, DialogPanel } from "@headlessui/react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { auth } from "@/lib/firebase";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Ventas", href: "/admin/ventas", icon: ShoppingBag },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Productos", href: "/admin/productos", icon: FileText },
  { name: "Calendario", href: "/admin/calendario", icon: Calendar },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  // El AdminGuard maneja la protección completa.
  // Si no es admin, renderiza UnauthorizedView y este contenido NUNCA se monta.
  return (
    <AdminGuard>
      <div className="min-h-full bg-gray-100">
        {/* SIDEBAR MÓVIL */}
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
          <div className="fixed inset-0 flex">
            <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
                <div className="flex h-16 shrink-0 items-center">
                  <span className="text-xl font-bold text-white">
                    Admin Panel
                  </span>
                </div>

                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={classNames(
                                pathname === item.href
                                  ? "bg-gray-800 text-white"
                                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                              )}
                            >
                              <item.icon
                                className="h-6 w-6 shrink-0"
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li className="mt-auto">
                      <button
                        onClick={handleLogout}
                        className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                      >
                        <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* SIDEBAR ESCRITORIO */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <span className="text-xl font-bold text-white">
                Mi Tienda Admin
              </span>
            </div>

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            pathname === item.href
                              ? "bg-gray-800 text-white"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white",
                            "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                          )}
                        >
                          <item.icon
                            className="h-6 w-6 shrink-0"
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                    <li className="mt-auto">
                      <button
                        onClick={handleLogout}
                        className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                      >
                        <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                        Cerrar Sesión
                      </button>
                    </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="lg:pl-72">
          {/* NAVBAR SUPERIOR */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Abrir sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1" />

              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Notificaciones</span>
                  <Bell className="h-6 w-6" aria-hidden="true" />
                </button>

                <div
                  className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10"
                  aria-hidden="true"
                />

                <span className="text-sm font-semibold leading-6 text-gray-900">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* PÁGINAS DEL ADMIN */}
          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
