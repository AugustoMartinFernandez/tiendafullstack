"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { ORDER_STATUSES, OrderStatus, Order } from "@/lib/types"; // IMPORTANTE: Se agregó 'Order'
import { requireAdmin, requireUser } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";
import { orderSchema } from "@/lib/schemas";

// --- ACCIÓN 1: VALIDAR CARRITO (Sanitización de Precios y Stock) ---
export async function validateCartItems(items: { id: string; quantity: number }[]) {
  if (!items || items.length === 0) return [];

  try {
    noStore(); // No almacenar en caché esta acción
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

// --- ACCIÓN 6: CREAR UN NUEVO PEDIDO (Desde el Checkout) ---
export async function createOrder(rawData: unknown) {
  noStore();

  // 1. Validación de Datos (Zod)
  const validation = orderSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.issues[0].message };
  }
  
  const { userId, userInfo, items: clientItems } = validation.data;

  // Normalización de datos para guardar
  const dataToSave = {
    userId: userId || "guest",
    guestInfo: userInfo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "pending" as OrderStatus,
    amountPaid: 0,
    balance: 0, // Se calculará abajo
    paymentStatus: "unpaid",
    adminNote: "",
  };

  try {
    const dbAdmin = getAdminDb();

    // 2. EJECUCIÓN TRANSACCIONAL (Atomicidad)
    const result = await dbAdmin.runTransaction(async (t) => {
      const finalOrderItems: any[] = [];
      let finalTotal = 0;

      // a. Leer todos los productos en paralelo dentro de la transacción
      const productRefs = clientItems.map((item) => 
        dbAdmin.collection("products").doc(item.id)
      );
      const productDocs = await t.getAll(...productRefs);

      // b. Validar y procesar cada item
      for (let i = 0; i < productDocs.length; i++) {
        const doc = productDocs[i];
        const clientItem = clientItems[i];

        if (!doc.exists) {
          throw new Error(`El producto con ID ${clientItem.id} ya no está disponible.`);
        }

        const productData = doc.data();
        if (!productData) throw new Error(`Error de datos en producto ${doc.id}`);

        // --- PUNTO CRÍTICO: VALIDACIÓN DE STOCK ---
        if (productData.stock < clientItem.quantity) {
          throw new Error(`Stock insuficiente para "${productData.name}". Disponible: ${productData.stock}`);
        }

        // --- PUNTO CRÍTICO: PRECIO DEL SERVIDOR ---
        const price = Number(productData.price);
        const subtotal = price * clientItem.quantity;
        finalTotal += subtotal;

        finalOrderItems.push({
          id: doc.id,
          name: productData.name,
          price: price,
          quantity: clientItem.quantity,
          imageUrl: productData.imageUrl || productData.images?.[0] || "",
          sku: productData.sku || "",
        });

        // --- PUNTO CRÍTICO: DESCUENTO DE STOCK ---
        t.update(doc.ref, {
          stock: FieldValue.increment(-clientItem.quantity),
          updatedAt: new Date().toISOString()
        });
      }

      // c. Crear el Pedido
      const newOrderRef = dbAdmin.collection("orders").doc();
      const newOrderData = {
        ...dataToSave,
        items: finalOrderItems,
        total: finalTotal,
        balance: finalTotal, // El balance inicial es el total
      };

      t.set(newOrderRef, newOrderData);

      return { id: newOrderRef.id, ...newOrderData };
    });

    // 3. Revalidación
    revalidatePath("/admin/ventas");
    revalidatePath("/admin/productos"); // El stock cambió
    if (userId && userId !== "guest") {
      revalidatePath("/mis-pedidos");
    }

    return { 
      success: true, 
      orderId: result.id, 
      order: result, 
      message: "Pedido creado con éxito." 
    };
  } catch (error) {
    console.error("Error creando pedido:", error);
    return { 
      success: false, 
      orderId: null, 
      order: null,
      message: error instanceof Error ? error.message : "Error desconocido al crear el pedido.",
    };
  }
}

// --- ACCIÓN 2: ACTUALIZAR ESTADO DE PEDIDO (Admin) ---
export async function updateOrderStatus(
  orderId: string, 
  status: string, 
  note: string = "", 
  amountPaid: number = 0
) {
  const claims = await requireAdmin();
  const email = claims.email || "unknown";

  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { success: false, message: "Estado inválido." };
  }
  const newStatus = status as OrderStatus;

  try {
    const dbAdmin = getAdminDb();
    
    await dbAdmin.runTransaction(async (t) => {
      const orderRef = dbAdmin.collection("orders").doc(orderId);
      const orderDoc = await t.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error("El pedido no existe.");
      }

      const orderData = orderDoc.data();
      const currentStatus = orderData?.status as OrderStatus;

      // Lógica de Devolución de Stock si se cancela
      if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
        const items = orderData?.items || [];
        for (const item of items) {
          const productRef = dbAdmin.collection("products").doc(item.id);
          t.update(productRef, { stock: FieldValue.increment(item.quantity) });
        }
      }

      t.update(orderRef, { 
        status: newStatus,
        adminNote: note,
        updatedAt: new Date().toISOString(),
        updatedBy: email
      });
    });
    
    revalidatePath("/admin/ventas");
    revalidatePath("/perfil");
    revalidatePath("/admin/productos");
    return { success: true, message: "Estado actualizado." };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error al actualizar estado." };
  }
}

// --- ACCIÓN 8: SUBIR COMPROBANTE DE PAGO (Usuario) ---
export async function uploadPaymentProof(orderId: string, fileUrl: string, fileType: 'image' | 'pdf') {
  const user = await requireUser();
  if (!user) return { success: false, message: "Debes iniciar sesión." };

  try {
    const dbAdmin = getAdminDb();
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    
    // Verificación de propiedad
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists || orderSnap.data()?.userId !== user.uid) {
      return { success: false, message: "No tienes permiso." };
    }

    await orderRef.update({
      paymentProofUrl: fileUrl,
      paymentProofType: fileType,
      status: 'payment_review', // Cambiamos estado automáticamente
      updatedAt: new Date().toISOString()
    });

    revalidatePath("/mis-pedidos");
    revalidatePath("/admin/ventas");
    return { success: true, message: "Comprobante enviado a revisión." };
  } catch (error) {
    console.error("Error uploading proof:", error);
    return { success: false, message: "Error al registrar el comprobante." };
  }
}

// --- ACCIÓN 9: AGREGAR PAGO INCREMENTAL (Admin - Transaccional) ---
export async function addOrderPayment(orderId: string, amountToAdd: number, note: string = "") {
  const claims = await requireAdmin();
  const email = claims.email || "admin";

  if (amountToAdd <= 0) {
    return { success: false, message: "El monto debe ser mayor a 0." };
  }

  try {
    const dbAdmin = getAdminDb();
    
    await dbAdmin.runTransaction(async (t) => {
      const orderRef = dbAdmin.collection("orders").doc(orderId);
      const orderDoc = await t.get(orderRef);
      if (!orderDoc.exists) throw new Error("Pedido no encontrado");

      const data = orderDoc.data();
      const total = data?.total || 0;
      const currentAmountPaid = data?.amountPaid || 0;
      
      const newAmountPaid = currentAmountPaid + amountToAdd;

      // Validación: No permitir pagar más del total
      if (newAmountPaid > total) {
        throw new Error(`El monto excede el saldo restante ($${total - currentAmountPaid}).`);
      }

      const newBalance = total - newAmountPaid;
      const newPaymentStatus = newBalance <= 0 ? 'paid' : 'partial';

      // --- HISTORIAL DE PAGOS ---
      let newPayments = data?.payments || [];
      const transaction = {
        id: Date.now().toString(),
        amount: amountToAdd,
        date: new Date().toISOString(),
        note: note || "Pago registrado",
        recordedBy: email
      };
      newPayments = [...newPayments, transaction];
      
      // Auto-aprobar si se paga el total y no estaba cancelado
      let newStatus = data?.status;
      if (newBalance <= 0 && newStatus !== 'cancelled' && newStatus !== 'shipped') {
        newStatus = 'approved';
      }

      t.update(orderRef, {
        amountPaid: newAmountPaid,
        balance: newBalance,
        paymentStatus: newPaymentStatus,
        status: newStatus,
        adminNote: note, // Actualizamos la nota general también
        payments: newPayments, // Guardamos el historial
        updatedAt: new Date().toISOString(),
        updatedBy: email
      });
    });

    revalidatePath("/admin/ventas");
    revalidatePath("/mis-pedidos");
    return { success: true, message: "Pago registrado correctamente." };
  } catch (error) {
    console.error("Error registering payment:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error al registrar pago." };
  }
}

// --- ACCIÓN 3: SUBIR COMPROBANTE (Usuario) ---
export async function submitReceipt(orderId: string, fileUrl: string, amountClaimed: number, fileType: string = 'image') {
  const user = await requireUser();
  if (!user) return { success: false, message: "Debes iniciar sesión." };

  try {
    const dbAdmin = getAdminDb();
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return { success: false, message: "Pedido no encontrado." };
    
    const orderData = orderSnap.data();
    
    if (orderData?.userId !== user.uid) {
        return { success: false, message: "No tienes permiso para editar este pedido." };
    }

    await orderRef.update({
        paymentProof: {
          url: fileUrl,
          type: fileType,
          amountClaimed: Number(amountClaimed),
          status: 'pending',
          submittedAt: new Date().toISOString()
        },
        status: 'payment_review',
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
export async function getUserOrders(userId: string) {
  const sessionUser = await requireUser();

  // Si no hay usuario en sesión, no puede pedir órdenes.
  if (!sessionUser) {
    console.warn(`[SECURITY] Intento de acceso a órdenes sin autenticación para el usuario ${userId}.`);
    return [];
  }

  // Verificación de seguridad: Un usuario solo puede solicitar sus propios pedidos.
  // Si el ID de la sesión no coincide con el ID solicitado, se deniega la petición.
  if (sessionUser.uid !== userId) {
    console.warn(`[SECURITY] User ${sessionUser.uid} intentó acceder a los pedidos de ${userId}.`);
    return [];
  }

  try {
    const dbAdmin = getAdminDb();
    // Usamos el userId que viene como parámetro, ya que fue validado.
    const q = dbAdmin.collection("orders").where("userId", "==", userId);
    
    const snapshot = await q.get();
    
    // Casting 'as Order[]' para evitar errores de tipo
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];

    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    
    // Casting 'as Order[]' para evitar errores de tipo en el frontend
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
}

// --- ACCIÓN 7: OBTENER UN PEDIDO POR ID (Server Side) ---
export async function getOrderById(orderId: string) {
  const user = await requireUser();
  if (!user) return null; // No autenticado

  try {
    const dbAdmin = getAdminDb();
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return null; // Pedido no encontrado

    const orderData = orderSnap.data();

    // Verificación de seguridad: Asegurarse de que el usuario es el dueño del pedido
    if (orderData?.userId !== user.uid) return null;

    return { id: orderSnap.id, ...orderData } as Order;
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    return null;
  }
}

// --- ACCIÓN 10: OBTENER DETALLES DE ÉXITO (Público/Seguro) ---
export async function getOrderSuccessDetails(orderId: string) {
  noStore(); // Evitar caché para mostrar estado real
  try {
    const dbAdmin = getAdminDb();
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return null;
    
    const data = orderSnap.data();
    if (!data) return null;

    // Retornamos un objeto plano serializado para evitar errores en Server Components
    return { 
      id: orderSnap.id, 
      ...data,
      createdAt: data.createdAt || new Date().toISOString(), // Asegurar string
    } as Order;
  } catch (error) {
    console.error(`Error fetching order success details ${orderId}:`, error);
    return null;
  }
}

// --- ACCIÓN 11: VINCULAR PEDIDOS DE INVITADO (Adopción) ---
export async function claimGuestOrders(email: string) {
  const user = await requireUser();
  if (!user) return { success: false, message: "Debes iniciar sesión." };

  // Seguridad: Validamos que el email reclamado sea el del usuario actual
  // Esto evita que un usuario malintencionado reclame pedidos de otros sabiendo su email
  if (user.email !== email) {
    return { success: false, message: "No puedes reclamar pedidos de otro email." };
  }

  try {
    const dbAdmin = getAdminDb();
    
    // Buscamos pedidos donde userId es 'guest' Y el email coincide
    const snapshot = await dbAdmin.collection("orders")
      .where("userId", "==", "guest")
      .where("guestInfo.email", "==", email)
      .get();

    if (snapshot.empty) {
      return { success: true, count: 0, message: "No se encontraron pedidos huérfanos." };
    }

    const batch = dbAdmin.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { 
        userId: user.uid,
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();
    
    // Revalidamos para que aparezcan inmediatamente en la lista
    revalidatePath("/mis-pedidos");
    
    return { success: true, count: snapshot.size, message: `${snapshot.size} pedidos vinculados.` };
  } catch (error) {
    console.error("Error claiming guest orders:", error);
    return { success: false, message: "Error al vincular pedidos." };
  }
}
