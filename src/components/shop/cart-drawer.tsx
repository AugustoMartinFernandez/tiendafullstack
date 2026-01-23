// src/components/shop/cart-drawer.tsx
"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

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
                          {items.map((product) => (
                            <li key={product.id} className="flex py-6">
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gray-200">
                                <Image
                                  src={product.images?.[0] || product.imageUrl || "/placeholder.png"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>
                                      <Link href={`/producto/${product.id}`} onClick={closeCart}>
                                        {product.name}
                                      </Link>
                                    </h3>
                                    <div className="text-right">
                                      <p className="ml-4 font-bold text-indigo-900 whitespace-nowrap">{formatPrice(product.price * product.quantity)}</p>
                                      {product.originalPrice && product.originalPrice > product.price && (
                                        <p className="text-xs text-green-600 font-medium mt-0.5">
                                          Ahorrás {formatPrice((product.originalPrice - product.price) * product.quantity)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                                  
                                  {/* Mostrar Atributos (Variantes) */}
                                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {Object.entries(product.attributes).map(([key, value]) => (
                                        <span key={key} className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                                          {key}: {value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm">
                                  <p className="text-gray-500">Cant. {product.quantity}</p>

                                  <div className="flex">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(product.id)}
                                      className="font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p>{formatPrice(totalPrice)}</p>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-sm font-medium text-green-600 mt-2">
                        <p>¡Ahorro Total!</p>
                        <p>-{formatPrice(totalSavings)}</p>
                      </div>
                    )}
                    <p className="mt-0.5 text-sm text-gray-500">Envío e impuestos calculados al finalizar.</p>
                    <div className="mt-6">
                      <Link
                        href="/checkout"
                        onClick={closeCart}
                        className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700"
                      >
                        Finalizar Compra
                      </Link>
                    </div>
                    <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                      <p>
                        o{' '}
                        <button
                          type="button"
                          onClick={closeCart}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Continuar Comprando
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
