"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { ORDER_STATUSES, OrderStatus, Order } from "@/lib/types"; // <--- 1. Importamos 'Order' para evitar errores de tipo
import { requireAdmin, requireUser } from "@/lib/auth-server";

// --- ACCIÓN 1: VALIDAR CARRITO (Sanitización de Precios y Stock) ---
export async function validateCartItems(items: { id: string; quantity: number }[]) {
  if (!items || items.length === 0) return [];

  try {
    const dbAdmin = getAdminDb();
    const docsSnap = await Promise.all(
      items.map((item) => dbAdmin.collection("products").doc(item.id).get())
    );

    const validatedItems = docsSnap
      .map((snap) => {
        if (!snap.exists) return null;
        const data = snap.data();
        
        if (!data) return null;
        
        return {
          id: snap.id,
          name: data.name,
          price: data.price,
          originalPrice: data.originalPrice || 0,
          images: data.images || [],
          imageUrl: data.imageUrl || "",
          stock: data.stock,
          category: data.category,
          sku: data.sku,
          attributes: data.attributes || {},
        };
      })
      .filter((item) => item !== null);

    return validatedItems;
  } catch (error) {
    console.error("Error validando carrito:", error);
    return [];
  }
}

// --- ACCIÓN 2: ACTUALIZAR ESTADO DE PEDIDO (Admin) ---
export async function updateOrderStatus(orderId: string, status: string) {
  const claims = await requireAdmin();
  const email = claims.email || "unknown";

  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { success: false, message: "Estado inválido." };
  }
  const newStatus = status as OrderStatus;

  try {
    const dbAdmin = getAdminDb();
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return { success: false, message: "El pedido no existe." };
    }

    const currentStatus = orderSnap.data()?.status as OrderStatus;

    // Lógica opcional: Impedir revivir cancelados (si quisieras)
    if (currentStatus === 'cancelled' && newStatus !== 'cancelled') {
       // return { success: false, message: "No se puede reactivar un pedido cancelado." };
    }

    await orderRef.update({ 
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: email
    });
    
    revalidatePath("/admin/ventas");
    revalidatePath("/perfil");
    return { success: true, message: "Estado actualizado." };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error al actualizar estado." };
  }
}

// --- ACCIÓN 3: SUBIR COMPROBANTE (Usuario) ---
export async function submitReceipt(orderId: string, fileUrl: string) {
  const user = await requireUser();
  if (!user) return { success: false, message: "Debes iniciar sesión." };

  try {
    const dbAdmin = getAdminDb();
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return { success: false, message: "Pedido no encontrado." };
    
    const orderData = orderSnap.data();
    
    // Verificamos que el pedido pertenezca al usuario
    if (orderData?.userId !== user.uid) {
        return { success: false, message: "No tienes permiso para editar este pedido." };
    }

    await orderRef.update({
        receiptUrl: fileUrl,
        receiptStatus: "reviewing",
        updatedAt: new Date().toISOString()
    });

    revalidatePath("/perfil");
    revalidatePath("/mis-pedidos");
    revalidatePath("/admin/ventas");
    
    return { success: true, message: "Comprobante subido correctamente." };
  } catch (error) {
    console.error("Error submitting receipt:", error);
    return { success: false, message: "Error al subir comprobante." };
  }
}

// --- ACCIÓN 4: OBTENER PEDIDOS DE UN USUARIO (Server Side) ---
export async function getUserOrdersServer() {
  const user = await requireUser();
  if (!user) return [];

  try {
    const dbAdmin = getAdminDb();
    const q = dbAdmin.collection("orders").where("userId", "==", user.uid);
    
    const snapshot = await q.get();
    
    // <--- 2. Casting 'as Order[]' para que TypeScript no se queje
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[]; 

    // Ordenamos por fecha (asumiendo que tenés 'createdAt' o 'date')
    return orders.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

// --- ACCIÓN 5: OBTENER TODOS LOS PEDIDOS (Admin) ---
export async function getAllOrders() {
  await requireAdmin();

  try {
    const dbAdmin = getAdminDb();
    const snapshot = await dbAdmin.collection("orders").orderBy("createdAt", "desc").get();
    
    // <--- 3. Casting 'as Order[]' es fundamental aquí
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
}