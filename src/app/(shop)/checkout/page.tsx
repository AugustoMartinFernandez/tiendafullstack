"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/actions/orders";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function CheckoutPage() {
  const { items, clearCart, totalPrice, isLoaded } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    notes: "",
  });

useEffect(() => {
  if (user && profile) { // Asegurate de verificar profile también si es posible
    setFormData((prev) => ({
      ...prev,
      // CORRECCIÓN: Usar displayName en lugar de name
      name: profile.displayName || user.displayName || prev.name, 
      email: user.email || prev.email,
      phone: profile.phone || prev.phone, // Ya está definido en UserProfile, no necesitas "as any"
      address: profile.defaultAddress || prev.address, // Ya está definido en UserProfile
    }));
  }
}, [user, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Esperar a que el carrito cargue desde LocalStorage
  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-pulse flex flex-col items-center">
          <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Cargando tu pedido...</p>
        </div>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setLoading(true);

    // 2. Seguridad de Envío: Solo enviamos IDs y Cantidades
    // El precio se calcula en el servidor (createOrder)
    const payload = {
      userId: user ? user.uid : null,
      userInfo: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        email: formData.email,
        notes: formData.notes,
      },
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };

    const result = await createOrder(payload);

    if (result.success) {
      clearCart();
      toast.success("¡Pedido realizado con éxito!");
      
      // Redirección a éxito o WhatsApp
      // const total = result.order?.total || 0;
      // const message = `Hola, mi pedido es #${result.orderId}. Total: $${total}`;
      // window.open(`https://wa.me/549XXXXXXXX?text=${encodeURIComponent(message)}`, "_blank");
      
      router.push(`/checkout/success?orderId=${result.orderId}`);
    } else {
      toast.error(result.message || "Hubo un error al procesar el pedido.");
    }

    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-gray-50 p-8 rounded-full mb-4">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Tu carrito está vacío</h2>
        <button onClick={() => router.push("/tienda")} className="mt-4 text-indigo-600 font-medium hover:underline">
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Finalizar Compra</h1>
      <p className="text-gray-500 mb-8">Completa tus datos para procesar el pedido.</p>

      <form onSubmit={handleCheckout} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
        {user && (
          <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-3 text-indigo-700 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Comprando como <span className="font-bold">{user.displayName || user.email}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Nombre Completo</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              required 
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" 
              placeholder="Juan Pérez" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Teléfono</label>
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange}
                required 
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" 
                placeholder="351..." 
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Email (Opcional)</label>
              <input 
                name="email" 
                type="email"
                value={formData.email} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-gray-800" 
                placeholder="juan@ejemplo.com" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Dirección de Envío</label>
            <textarea 
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              required 
              rows={3}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-gray-800 resize-none" 
              placeholder="Calle, Número, Barrio, Ciudad..." 
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Notas (Opcional)</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange}
              rows={2}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-gray-800 resize-none" 
              placeholder="Ej: El timbre no funciona..." 
            />
          </div>
        </div>
        
        <div className="pt-6 border-t border-gray-100 mt-6">
          <div className="flex justify-between items-end mb-6">
            <span className="text-sm font-medium text-gray-500">Total Estimado</span>
            <span className="text-3xl font-black text-gray-900">${totalPrice}</span>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 flex items-center justify-center gap-2 bg-gray-900 text-white font-black rounded-2xl hover:bg-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200 active:scale-95"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Pedido"}
          </button>
          <p className="text-[10px] text-center text-gray-400 mt-4 font-medium">
            * Al confirmar, verificaremos el stock final y te redirigiremos.
          </p>
        </div>
      </form>
    </div>
  );
}
