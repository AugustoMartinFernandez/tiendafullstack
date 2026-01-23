"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Menu, X, ShoppingBag, Heart } from "lucide-react";
import { useCart } from "@/context/cart-context";

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

  return (
    <header className="bg-background sticky top-0 z-50 border-b border-border">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        {/* LOGO */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">{storeName}</span>
            {logoUrl ? (
              <img className="h-8 w-auto" src={logoUrl} alt={storeName} />
            ) : (
              <span className="text-xl font-bold tracking-tighter text-foreground">
                {storeName}
              </span>
            )}
          </Link>
        </div>

        {/* BOTÓN MENÚ MÓVIL */}
        <div className="flex lg:hidden">
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
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* CARRITO Y LOGIN */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6 items-center">
          <Link
            href="/login"
            className="text-sm font-semibold leading-6 text-foreground hover:text-primary"
          >
            Ingresar <span aria-hidden="true">&rarr;</span>
          </Link>
          <div className="h-6 w-px bg-border" aria-hidden="true" />
          <Link href="/favoritos" className="group -m-2 flex items-center p-2 text-muted-foreground hover:text-primary transition-colors" title="Mis Favoritos">
            <Heart className="h-6 w-6" />
          </Link>
          <button onClick={openCart} className="group -m-2 flex items-center p-2">
            <ShoppingBag
              className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary"
              aria-hidden="true"
            />
            <span className="ml-2 text-sm font-medium text-muted-foreground group-hover:text-foreground">
              {totalItems}
            </span>
          </button>
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
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">{storeName}</span>
              <span className="text-xl font-bold tracking-tighter text-foreground">
                {storeName}
              </span>
            </Link>
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
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
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
                <Link
                  href="/favoritos"
                  className="-mx-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-5 w-5" />
                  Mis Favoritos
                </Link>
                <Link
                  href="/login"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                >
                  Ingresar
                </Link>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}