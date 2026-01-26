"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Menu, X, ShoppingBag, Heart, LayoutDashboard, UserCircle, Package, LogOut, ChevronDown, User, LogIn } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { CartWidget } from "@/components/shop/cart-widget";
import { useAuth } from "@/context/auth-context";
import { UserMenu } from "@/components/auth/user-menu";
import { clientLogout } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { Toast, ToastType } from "@/components/ui/toast";

interface NavbarProps {
  logoUrl?: string; // Opcional, si no hay logo mostramos texto
  storeName: string;
}

const navigation = [
  { name: "Tienda", href: "/tienda" },
  { name: "Ofertas", href: "/ofertas" },
  { name: "Nosotros", href: "/nosotros" },
  { name: "Contacto", href: "/contacto" },
];

export function Navbar({ logoUrl, storeName }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCart, totalItems } = useCart();
  const { user, profile, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({ show: false, msg: "", type: "success" });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Detectar si venimos de un logout para mostrar el mensaje
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("loggedOut")) {
        setToast({ show: true, msg: "Sesión cerrada correctamente.", type: "success" });
        // Limpiar la URL para que no vuelva a salir el mensaje al recargar
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b transition-all duration-300",
      isScrolled 
        ? "bg-white/80 backdrop-blur-md border-gray-200 shadow-sm" 
        : "bg-white border-transparent"
    )}>
      <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      
      <nav
        className={cn("mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 transition-all duration-300", isScrolled ? "py-3" : "py-6")}
        aria-label="Global"
      >
        {/* LOGO */}
        <div className="flex lg:flex-1">
          <TransitionLink href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">{storeName}</span>
            {logoUrl ? (
              <img className="h-8 w-auto" src={logoUrl} alt={storeName} />
            ) : (
              <span className="text-xl font-bold tracking-tighter text-foreground">
                {storeName}
              </span>
            )}
          </TransitionLink>
        </div>

        {/* BOTÓN MENÚ MÓVIL */}
        <div className="flex items-center gap-4 lg:hidden">
          <CartWidget />
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menú</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* MENÚ ESCRITORIO */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <TransitionLink
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </TransitionLink>
          ))}

          {/* Botón Admin (Solo visible para administradores) */}
          {profile?.role === "admin" && (
            <TransitionLink
              href="/admin"
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </TransitionLink>
          )}
        </div>

        {/* CARRITO Y LOGIN */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6 items-center">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <UserMenu />
          ) : (
            <TransitionLink href="/login" className="text-sm font-semibold leading-6 text-foreground hover:text-primary">
              Ingresar <span aria-hidden="true">&rarr;</span>
            </TransitionLink>
          )}

          <div className="h-6 w-px bg-border" aria-hidden="true" />
          <TransitionLink href="/favoritos" className="group -m-2 flex items-center p-2 text-muted-foreground hover:text-primary transition-colors" title="Mis Favoritos">
            <Heart className="h-6 w-6" />
          </TransitionLink>
          <CartWidget />
        </div>
      </nav>

      {/* MENÚ MÓVIL (DIALOG) */}
      <Dialog
        as="div"
        className="lg:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white sm:max-w-sm sm:ring-1 sm:ring-gray-200 shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <TransitionLink href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
              <span className="sr-only">{storeName}</span>
              <span className="text-xl font-bold tracking-tighter text-foreground">
                {storeName}
              </span>
            </TransitionLink>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-400 hover:text-gray-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Cerrar menú</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 py-6">
            {/* 1. SECCIÓN DE USUARIO (ARRIBA) */}
            {user ? (
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="relative h-12 w-12 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  {profile?.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{profile?.displayName || "Usuario"}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-indigo-50 rounded-2xl text-center border border-indigo-100">
                <p className="text-indigo-900 font-medium mb-3 text-sm">¡Hola! Iniciá sesión para ver tus pedidos.</p>
                <TransitionLink 
                  href="/login" 
                  className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" /> Ingresar / Registrarse
                </TransitionLink>
              </div>
            )}

            {/* 2. ACCIONES RÁPIDAS (GRID) */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button 
                onClick={() => { setMobileMenuOpen(false); openCart(); }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group bg-white shadow-sm"
              >
                <div className="relative">
                  <ShoppingBag className="h-6 w-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                  {totalItems > 0 && <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-sm">{totalItems}</span>}
                </div>
                <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-700">Carrito</span>
              </button>

              <TransitionLink 
                href="/favoritos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/50 transition-all group bg-white shadow-sm"
              >
                <Heart className="h-6 w-6 text-gray-600 group-hover:text-pink-500 transition-colors" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-pink-600">Favoritos</span>
              </TransitionLink>
            </div>

            {/* 3. NAVEGACIÓN PRINCIPAL */}
            <div className="space-y-1">
              <p className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Navegación</p>
              
                {navigation.map((item) => (
                  <TransitionLink
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </TransitionLink>
                ))}

                {/* Link Admin */}
                {profile?.role === "admin" && (
                  <TransitionLink
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 transition-colors mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Panel Admin
                  </TransitionLink>
                )}

                {/* 4. ACORDEÓN DE CUENTA (Solo si está logueado) */}
                {user && (
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <Disclosure as="div">
                      {({ open }) => (
                        <>
                          <DisclosureButton className="flex w-full items-center justify-between px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                            <span className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-gray-400" /> Mi Cuenta</span>
                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </DisclosureButton>
                          <DisclosurePanel className="px-4 pb-2 space-y-1">
                            <TransitionLink 
                              href="/perfil" 
                              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Mi Perfil
                            </TransitionLink>
                            <TransitionLink 
                              href="/mis-pedidos" 
                              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Mis Pedidos
                            </TransitionLink>
                            <button 
                              onClick={() => { clientLogout(); setMobileMenuOpen(false); }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="h-4 w-4" /> Cerrar Sesión
                            </button>
                          </DisclosurePanel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                )}
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}