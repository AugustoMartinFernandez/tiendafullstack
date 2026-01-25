import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { FavoritesProvider } from "@/context/favorites-context";
import { ToastProvider } from "@/context/toast-context";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mi Tienda Pro",
  description: "La mejor tienda online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <ToastProvider>
                {children}
                <CartDrawer />
              </ToastProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}