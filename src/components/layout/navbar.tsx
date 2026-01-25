"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Menu, X, ShoppingBag, Heart, LayoutDashboard } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { CartWidget } from "@/components/shop/cart-widget";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/ui/TransitionLink";

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
  const { profile } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b transition-all duration-300",
      isScrolled 
        ? "bg-white/80 backdrop-blur-md border-gray-200 shadow-sm" 
        : "bg-white border-transparent"
    )}>
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
          <TransitionLink
            href="/login"
            className="text-sm font-semibold leading-6 text-foreground hover:text-primary"
          >
            Ingresar <span aria-hidden="true">&rarr;</span>
          </TransitionLink>
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
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-border">
          <div className="flex items-center justify-between">
            <TransitionLink href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
              <span className="sr-only">{storeName}</span>
              <span className="text-xl font-bold tracking-tighter text-foreground">
                {storeName}
              </span>
            </TransitionLink>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Cerrar menú</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-border">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <TransitionLink
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </TransitionLink>
                ))}

                {/* Botón Admin Móvil */}
                {profile?.role === "admin" && (
                  <TransitionLink
                    href="/admin"
                    className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-bold leading-7 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Panel Admin
                  </TransitionLink>
                )}
              </div>
              <div className="py-6">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCart();
                  }}
                  className="-mx-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Carrito ({totalItems})
                </button>
                <TransitionLink
                  href="/favoritos"
                  className="-mx-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-5 w-5" />
                  Mis Favoritos
                </TransitionLink>
                <TransitionLink
                  href="/login"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ingresar
                </TransitionLink>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}