// src/components/shop/cart-drawer.tsx
"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Trash2 } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { getProductImage } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Componente auxiliar para efecto de carga
function CartItemImage({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn(
        "object-cover transition-all duration-500 ease-in-out",
        isLoading ? "scale-110 blur-sm grayscale" : "scale-100 blur-0 grayscale-0"
      )}
      onLoad={() => setIsLoading(false)}
    />
  );
}

export function CartDrawer() {
  const { isCartOpen, closeCart, items, removeFromCart, totalPrice } = useCart();

  // Calcular ahorro total
  const totalSavings = items.reduce((acc, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return acc + (item.originalPrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);

  return (
    <Dialog open={isCartOpen} onClose={closeCart} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
            >
              <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-lg font-medium text-gray-900">Tu Carrito</DialogTitle>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        onClick={closeCart}
                        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                      >
                        <span className="absolute -inset-0.5" />
                        <span className="sr-only">Cerrar panel</span>
                        <X aria-hidden="true" className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flow-root">
                      {items.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-gray-500">Tu carrito está vacío.</p>
                          <button onClick={closeCart} className="mt-4 text-indigo-600 font-medium hover:text-indigo-500">
                            Empezar a comprar &rarr;
                          </button>
                        </div>
                      ) : (
                        <ul role="list" className="-my-6 divide-y divide-gray-200">
                          {items.map((product) => {
                            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                            const discountPercentage = hasDiscount
                              ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                              : 0;

                            return (
                              <li key={product.id} className="flex py-6">
                                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                                  <CartItemImage
                                    src={getProductImage(product)}
                                    alt={product.name}
                                  />
                                </div>

                                <div className="ml-4 flex flex-1 flex-col">
                                  <div className="flex justify-between items-start">
                                    <div className="pr-4">
                                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                                        <Link href={`/producto/${product.id}`} onClick={closeCart}>
                                          {product.name}
                                        </Link>
                                      </h3>
                                      <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                                      
                                      {/* Mostrar Atributos (Variantes) */}
                                      {product.attributes && Object.keys(product.attributes).length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {Object.entries(product.attributes).map(([key, value]) => (
                                            <span key={key} className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-100">
                                              {key}: {value}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Botón Eliminar (Trash Icon) */}
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(product.id)}
                                      className="p-1.5 -mr-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                      title="Eliminar producto"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <div className="flex flex-1 items-end justify-between text-sm mt-2">
                                    <p className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                      x{product.quantity}
                                    </p>

                                    <div className="text-right">
                                      {hasDiscount ? (
                                        <div className="flex flex-col items-end">
                                          <span className="text-[10px] text-gray-400 line-through decoration-gray-300">
                                            {formatPrice(product.originalPrice! * product.quantity)}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                              {discountPercentage}% OFF
                                            </span>
                                            <span className="font-bold text-gray-900 text-base">
                                              {formatPrice(product.price * product.quantity)}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="font-bold text-gray-900 text-base">
                                          {formatPrice(product.price * product.quantity)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="border-t border-gray-200 px-4 py-6 sm:px-6 bg-gray-50/50">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p className="text-xl font-black">{formatPrice(totalPrice)}</p>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-sm font-medium text-green-600 mt-2">
                        <p>¡Ahorro Total!</p>
                        <p>-{formatPrice(totalSavings)}</p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      El envío y el pago se coordinan por WhatsApp al finalizar.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/checkout"
                        onClick={closeCart}
                        className="flex items-center justify-center rounded-xl border border-transparent bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        Finalizar Compra
                      </Link>
                    </div>
                    <div className="mt-4 flex justify-center text-center text-sm text-gray-500">
                      <p>
                        o{' '}
                        <button
                          type="button"
                          onClick={closeCart}
                          className="font-bold text-indigo-600 hover:text-indigo-500"
                        >
                          Seguir mirando
                          <span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
