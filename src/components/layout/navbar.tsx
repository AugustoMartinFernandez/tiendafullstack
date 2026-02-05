// src/components/layout/navbar.tsx
"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel, Transition, TransitionChild } from "@headlessui/react";
import { Menu, X, ShoppingBag, Heart, LayoutDashboard, UserCircle, Package, LogOut, ChevronDown, User, LogIn, Store, Tag, Users, Mail } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { CartWidget } from "@/components/shop/cart-widget";
import { useAuth } from "@/context/auth-context";
import { UserMenu } from "@/components/auth/user-menu";
import { clientLogout } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { Toast, ToastType } from "@/components/ui/toast";
import { NotificationBadgeClient } from "@/components/shop/notification-badge-client";
import { NotificationsList } from "@/components/shop/notifications-list";

interface NavbarProps {
  logoUrl?: string;
  storeName: string;
}

const navigation = [
  { name: "Tienda", href: "/tienda", icon: Store },
  { name: "Ofertas", href: "/ofertas", icon: Tag },
  { name: "Nosotros", href: "/nosotros", icon: Users },
  { name: "Contacto", href: "/contacto", icon: Mail },
];

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex items-center justify-center p-2 transition-all duration-200 rounded-full focus:outline-none",
          isOpen ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-indigo-600 hover:bg-gray-100/50"
        )}
        aria-label="Notificaciones"
      >
        <NotificationBadgeClient initialCount={0} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop móvil */}
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:hidden animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />
          
          <div className={cn(
            "z-50 animate-in slide-in-from-top-2 fade-in duration-200",
            // Mobile: Fixed, centrado, ancho completo
            "fixed left-4 right-4 top-20 w-auto",
            // Desktop: Absoluto, alineado a la derecha
            "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96"
          )}>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden border border-gray-100 flex flex-col max-h-[75vh] sm:max-h-[600px]">
              <NotificationsList />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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

  // Detectar logout
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("loggedOut")) {
        setToast({ show: true, msg: "Sesión cerrada correctamente.", type: "success" });
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300 border-b",
      isScrolled 
        ? "bg-white/80 backdrop-blur-md border-gray-200/50 shadow-sm py-3" 
        : "bg-white/60 backdrop-blur-sm border-transparent py-5"
    )}>
      <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Global">
        
        {/* 1. LOGO (Izquierda) */}
        <div className="flex lg:flex-1">
          <TransitionLink href="/" className="-m-1.5 p-1.5 flex items-center gap-2 group">
            <span className="sr-only">{storeName}</span>
            {logoUrl ? (
              <img className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" src={logoUrl} alt={storeName} />
            ) : (
              <span className="text-2xl font-black tracking-tighter text-gray-900 group-hover:text-indigo-600 transition-colors">
                {storeName}
              </span>
            )}
          </TransitionLink>
        </div>

        {/* 2. MOBILE ACTIONS (Derecha en móvil) */}
        <div className="flex items-center gap-2 lg:hidden">
          {user && <NotificationBell />}
          <CartWidget />
          
          {/* Botón Hamburguesa Animado */}
          <button
            type="button"
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100/50 transition-colors focus:outline-none ml-1"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <div className="w-5 h-4 relative flex flex-col justify-between">
              <span className="w-full h-0.5 bg-gray-800 rounded-full" />
              <span className="w-full h-0.5 bg-gray-800 rounded-full" />
              <span className="w-full h-0.5 bg-gray-800 rounded-full" />
            </div>
          </button>
        </div>

        {/* 3. DESKTOP NAV (Centro) */}
        <div className="hidden lg:flex lg:gap-x-10">
          {navigation.map((item) => (
            <TransitionLink
              key={item.name}
              href={item.href}
              className="text-sm font-bold leading-6 text-gray-600 hover:text-indigo-600 transition-colors relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full rounded-full" />
            </TransitionLink>
          ))}
          
          {profile?.role === "admin" && (
            <TransitionLink
              href="/admin"
              className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors bg-indigo-50 px-3 py-1 rounded-full"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Admin
            </TransitionLink>
          )}
        </div>

        {/* 4. DESKTOP ACTIONS (Derecha) */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
          {/* Search Placeholder (Visual) */}
          

          <div className="h-5 w-px bg-gray-200 mx-1" aria-hidden="true" />

          {loading ? (
            <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <TransitionLink 
              href="/login" 
              className="text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              Ingresar
            </TransitionLink>
          )}

          <TransitionLink 
            href="/favoritos" 
            className="group p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-all" 
            title="Mis Favoritos"
          >
            <Heart className="h-5 w-5 transition-transform group-hover:scale-110" />
          </TransitionLink>
          
          <CartWidget />
        </div>
      </nav>

      {/* MOBILE MENU (SLIDE-OVER) */}
      <Transition show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileMenuOpen}>
          {/* Backdrop */}
          <TransitionChild
            as={Fragment}
            enter="transition-opacity duration-300 ease-linear"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300 ease-linear"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Panel */}
            <TransitionChild
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <DialogPanel className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl h-full overflow-y-auto border-l border-gray-100">
                
                {/* Header Mobile Menu */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/50">
                  <TransitionLink href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                    <span className="sr-only">{storeName}</span>
                    <span className="text-xl font-black tracking-tighter text-gray-900">
                      {storeName}
                    </span>
                  </TransitionLink>
                  
                  {/* Close Button (X) */}
                  <button
                    type="button"
                    className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-5 h-5 relative">
                      <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 rounded-full rotate-45 transition-transform" />
                      <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 rounded-full -rotate-45 transition-transform" />
                    </div>
                  </button>
                </div>

                <div className="px-6 py-6 space-y-8">
                  {/* 1. USER SECTION */}
                  {user ? (
                    <div className="flex items-center gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                      <div className="relative h-12 w-12 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
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
                    <div className="p-5 bg-indigo-50/80 rounded-2xl text-center border border-indigo-100">
                      <p className="text-indigo-900 font-bold mb-4 text-sm">¡Hola! Iniciá sesión para ver tus pedidos.</p>
                      <TransitionLink 
                        href="/login" 
                        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="h-4 w-4" /> Ingresar / Registrarse
                      </TransitionLink>
                    </div>
                  )}

                  {/* 2. QUICK ACTIONS GRID */}
                  <div className="grid grid-cols-2 gap-3">
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

                  {/* 3. NAVIGATION */}
                  <div className="space-y-1">
                    <p className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Explorar</p>
                    
                    {navigation.map((item) => (
                      <TransitionLink
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-all group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        {item.name}
                      </TransitionLink>
                    ))}

                    {profile?.role === "admin" && (
                      <TransitionLink
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 transition-all mt-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Panel Admin
                      </TransitionLink>
                    )}
                  </div>

                  {/* 4. ACCOUNT ACCORDION */}
                  {user && (
                    <div className="pt-4 border-t border-gray-100">
                      <Disclosure as="div">
                        {({ open }) => (
                          <>
                            <DisclosureButton className="flex w-full items-center justify-between px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                              <span className="flex items-center gap-3"><UserCircle className="h-5 w-5 text-gray-400" /> Mi Cuenta</span>
                              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                            </DisclosureButton>
                            <DisclosurePanel className="px-4 pb-2 space-y-1">
                              <TransitionLink 
                                href="/perfil" 
                                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ml-8"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                Mi Perfil
                              </TransitionLink>
                              <TransitionLink 
                                href="/mis-pedidos" 
                                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ml-8"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                Mis Pedidos
                              </TransitionLink>
                              <button 
                                onClick={() => { clientLogout(); setMobileMenuOpen(false); }}
                                className="flex w-full items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors ml-8"
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
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </header>
  );
}
