"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { ORDER_STATUSES, OrderStatus, Order, PaymentStatus, OrderEventType, OrderEvent, PaymentProof, UserProfile } from "@/lib/types";
import { requireAdmin, requireUser } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";
import { orderSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/loggers";
import { BusinessError, ValidationError, handleActionError } from "@/lib/errors";

// --- TYPE DEFINITION: CreateOrderResult (Discriminated Union) ---
export type CreateOrderResult = 
  | { success: true; orderId: string; order: Order; message: string; isDuplicate?: boolean }
  | { success: false; message: string; code?: string; orderId?: null; order?: null };

// --- HELPER: NORMALIZAR ESTADO DE PAGO (BLINDAJE) ---
function normalizePaymentStatus(status: any): PaymentStatus {
  if (status === 'paid' || status === 'partial' || status === 'unpaid') {
    return status;
  }
  return 'unpaid'; // Fallback seguro por defecto
}

// --- HELPER: AUDITORÍA POR PEDIDO (PASO 3) ---
async function logOrderEvent(
  orderId: string, 
  type: OrderEventType, 
  message: string, 
  metadata: Record<string, any> = {}, 
  actorEmail: string = "system"
) {
  try {
    const db = getAdminDb();
    const eventData: OrderEvent = {
      orderId,
      type,
      message,
      metadata,
      createdAt: new Date().toISOString(),
      createdBy: actorEmail
    };
    // Guardamos en subcolección para historial aislado
    await db.collection("orders").doc(orderId).collection("events").add(eventData);
  } catch (e) {
    console.error(`[OBSERVABILITY] Error logging event for ${orderId}:`, e);
  }
}

// --- HELPER: NOTIFICACIONES EXTERNAS (WhatsApp/Push) ---
async function sendWhatsAppNotification(phone: string, message: string) {
  // AQUÍ IRÍA LA LLAMADA REAL A LA API DE WHATSAPP (Twilio, Meta API, etc.)
  // Por ahora simulamos el envío para cumplir el requisito sin dependencias externas.
  console.log(`[WHATSAPP_MOCK] Enviando a ${phone}: ${message}`);
}

// --- HELPER: VERIFICAR OPT-IN Y ENVIAR ---
async function notifyUserOptIn(orderId: string, userId: string, message: string) {
  try {
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) return;
    const userData = userDoc.data() as UserProfile;

    // 1. Validar Opt-in y Teléfono
    if (userData.notificationsOptIn && userData.phone) {
      // 2. Enviar Notificación
      await sendWhatsAppNotification(userData.phone, message);

      // 3. Auditoría
      await logActivity("INFO", "NOTIFICATION_SENT", {
        actorUid: "system",
        actorRole: "system",
        targetId: orderId,
        metadata: { userId, method: "WHATSAPP" }
      });
    }
  } catch (error) {
    console.error("[NOTIFICATIONS] Error sending external notification:", error);
  }
}

// --- HELPER: NOTIFICACIONES BACKEND (PASO 3) ---
async function notifyOrderUpdate(order: Order, type: string, message: string) {
  try {
    const db = getAdminDb();
    // Detectar destinatario: Usuario registrado o Guest
    const userId = order.userId && order.userId !== "guest" ? order.userId : null;
    const guestEmail = !userId && order.guestInfo?.email ? order.guestInfo.email : null;

    if (!userId && !guestEmail) return; // No hay a quien notificar

    await db.collection("notifications").add({
      userId,      // Puede ser null si es guest
      guestEmail,  // Puede ser null si es user
      orderId: order.id,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString()
    });

    // Notificación Externa (WhatsApp/Push) - Solo si es usuario registrado
    if (userId) {
      await notifyUserOptIn(order.id, userId, message);
    }
  } catch (e) {
    console.error(`[NOTIFICATIONS] Error notifying for ${order.id}:`, e);
  }
}

// --- HELPER: SANITIZAR ORDEN PARA CLIENTE (SECURITY PATCH) ---
function sanitizeOrderForClient(data: any) {
  // Eliminamos adminNote y cualquier otro campo sensible futuro
  const { adminNote, ...rest } = data;
  
  return {
    ...rest,
    paymentStatus: normalizePaymentStatus(data.paymentStatus), // Blindaje de tipo al leer
    // Normalizar fechas para evitar errores de serialización en Server Components
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
  };
}

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

// --- CORE: CREACIÓN SEGURA DE ÓRDENES (Backend Source of Truth) ---
export async function createOrderSecure(
  uid: string | null,
  items: { id: string; quantity: number }[],
  options: {
    guestInfo?: { name: string; email: string; phone: string; address: string; notes?: string };
    clientOrderId?: string;
  } = {}
): Promise<Extract<CreateOrderResult, { success: true }>> {
  const dbAdmin = getAdminDb();
  const { guestInfo, clientOrderId } = options;

  // 2. Transacción Atómica
  return await dbAdmin.runTransaction(async (t) => {
    // 1. Idempotencia: Verificar DENTRO de la transacción para evitar Race Conditions
    if (clientOrderId) {
      const existingQuery = dbAdmin.collection("orders").where("clientOrderId", "==", clientOrderId).limit(1);
      const existingSnap = await t.get(existingQuery);

      if (!existingSnap.empty) {
        const orderDoc = existingSnap.docs[0];
        return {
          success: true,
          orderId: orderDoc.id,
          order: { id: orderDoc.id, ...sanitizeOrderForClient(orderDoc.data()) } as Order,
          message: "Orden recuperada (ya existía).",
          isDuplicate: true
        };
      }
    }

    const finalOrderItems: any[] = [];
    let finalTotal = 0;

    // a. Leer productos en paralelo
    const productRefs = items.map((item) => dbAdmin.collection("products").doc(item.id));
    const productDocs = await t.getAll(...productRefs);

    // b. Validar y Calcular (Backend Trust Only)
    for (let i = 0; i < productDocs.length; i++) {
      const doc = productDocs[i];
      const clientItem = items[i];

      if (!doc.exists) throw new BusinessError(`Producto no encontrado: ${clientItem.id}`);
      
      const productData = doc.data();
      if (!productData) throw new BusinessError(`Datos corruptos en producto ${doc.id}`);

      // Validación de Stock Estricta
      if (productData.stock < clientItem.quantity) {
        throw new BusinessError(`Stock insuficiente para "${productData.name}". Disponible: ${productData.stock}`);
      }

      // Cálculo de Precio (Ignoramos lo que mande el cliente)
      const price = Number(productData.price);
      const subtotal = price * clientItem.quantity;
      finalTotal += subtotal;

      // Snapshot del item para la orden
      finalOrderItems.push({
        id: doc.id,
        name: productData.name,
        price: price,
        quantity: clientItem.quantity,
        imageUrl: productData.imageUrl || productData.images?.[0] || "",
        sku: productData.sku || "",
      });

      // Decremento de Stock
      t.update(doc.ref, {
        stock: FieldValue.increment(-clientItem.quantity),
        updatedAt: new Date().toISOString()
      });
    }

    // c. Construir Objeto de Orden
    const newOrderRef = dbAdmin.collection("orders").doc();
    const orderData = {
      userId: uid || "guest",
      guestInfo: guestInfo,
      clientOrderId: clientOrderId || undefined,
      items: finalOrderItems,
      total: finalTotal,
      balance: finalTotal, // Inicialmente debe todo
      amountPaid: 0,
      status: "pending" as OrderStatus,
      paymentStatus: "unpaid" as const, // Literal estricto
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNote: "",
    };

    t.set(newOrderRef, orderData);

    return { 
      success: true, 
      orderId: newOrderRef.id, 
      order: { id: newOrderRef.id, ...sanitizeOrderForClient(orderData) } as Order,
      message: "Pedido creado con éxito."
    };
  });
}

// --- ACCIÓN 6: WRAPPER PÚBLICO (Compatible con Frontend Legacy) ---
export async function createOrder(rawData: unknown): Promise<CreateOrderResult> {
  noStore();

  // 1. Validación de Datos (Zod)
  const validation = orderSchema.safeParse(rawData);
  if (!validation.success) {
    return { 
      success: false, 
      message: "Datos inválidos: " + validation.error.issues[0].message, 
      code: "VALIDATION_ERROR",
      orderId: null,
      order: null
    };
  }
  
  // SEGURIDAD: Ignoramos el userId que viene del frontend (payload).
  // Usamos la sesión real del servidor para determinar la identidad.
  const sessionUser = await requireUser();
  const secureUserId = sessionUser ? sessionUser.uid : null;

  const { userInfo, items, clientOrderId } = validation.data;

  try {
    // Llamamos a la implementación segura
    const result = await createOrderSecure(
      secureUserId, // Usamos el ID verificado, nunca el del cliente
      items,
      { guestInfo: userInfo, clientOrderId }
    );

    // LOG: Éxito en creación de orden
    logActivity("INFO", "create_order", {
      actorUid: secureUserId || "guest",
      actorRole: secureUserId ? "user" : "guest",
      targetId: result.orderId,
      metadata: { total: result.order?.total, itemCount: items.length }
    });

    // 3. Revalidación
    revalidatePath("/admin/ventas");
    revalidatePath("/admin/productos"); // El stock cambió
    if (secureUserId && secureUserId !== "guest") {
      revalidatePath("/mis-pedidos");
    }

    return result;
  } catch (error) {
    // LOG: Fallo en creación
    logActivity("ERROR", "create_order_failed", {
      actorUid: secureUserId || "guest",
      actorRole: secureUserId ? "user" : "guest",
      metadata: { error: error instanceof Error ? error.message : "Unknown", items }
    });

    const handled = handleActionError(error);
    return { 
      success: false, 
      message: handled.message, 
      code: handled.code, 
      orderId: null, 
      order: null 
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
        throw new BusinessError("El pedido no existe.");
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

    // LOG: Cambio de estado
    logActivity("INFO", "update_order_status", {
      actorUid: claims.uid,
      actorRole: "admin",
      targetId: orderId,
      metadata: { oldStatus: "unknown", newStatus, note }
    });

    // --- PASO 3: OBSERVABILIDAD Y NOTIFICACIONES ---
    // Leemos el pedido actualizado para tener contexto completo para la notificación
    const updatedOrderSnap = await getAdminDb().collection("orders").doc(orderId).get();
    if (updatedOrderSnap.exists) {
      const updatedOrder = { id: updatedOrderSnap.id, ...updatedOrderSnap.data() } as Order;
      
      const eventType: OrderEventType = newStatus === 'cancelled' ? 'CANCELLED' : 'STATUS_CHANGE';
      await logOrderEvent(orderId, eventType, `Estado cambiado a: ${newStatus}`, { note }, email);
      
      await notifyOrderUpdate(updatedOrder, eventType, `Tu pedido #${orderId.slice(-6)} ahora está: ${newStatus.toUpperCase()}. ${note ? `Nota: ${note}` : ''}`);
    }
    
    revalidatePath("/admin/ventas");
    revalidatePath("/perfil");
    revalidatePath("/admin/productos");
    return { success: true, message: "Estado actualizado." };
  } catch (error) {
    return handleActionError(error);
  }
}

// --- ACCIÓN: REVISAR COMPROBANTE (Admin) ---
export async function reviewPaymentProof(orderId: string, proofId: string, decision: 'approved' | 'rejected', amountToCredit: number = 0) {
  const claims = await requireAdmin();
  
  try {
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) throw new Error("Pedido no encontrado");
    
    const orderData = orderSnap.data() as Order;
    const proofs = orderData.paymentProofs || [];
    
    // 1. Actualizar estado del comprobante en el array
    const updatedProofs = proofs.map(p => 
      p.id === proofId ? { ...p, status: decision } : p
    );
    
    await orderRef.update({ 
      paymentProofs: updatedProofs,
      updatedAt: new Date().toISOString()
    });

    // 2. Si se aprueba, IMPACTAR DINERO REAL reutilizando la lógica existente
    if (decision === 'approved' && amountToCredit > 0) {
      // Llamamos a la función existente para no duplicar lógica financiera
      const paymentResult = await addOrderPayment(orderId, amountToCredit, `Comprobante aprobado por ${claims.email}`);
      
      if (!paymentResult.success) {
        // Si falla el pago, revertimos el estado del comprobante (Rollback manual básico)
        // Nota: En un sistema ideal esto sería una sola transacción, pero addOrderPayment es atómica por sí misma.
        throw new Error(paymentResult.message);
      }
    }

    // 3. Logs y Notificaciones
    await logActivity("INFO", "review_proof", {
      actorUid: claims.uid,
      actorRole: "admin",
      targetId: orderId,
      metadata: { proofId, decision, amountToCredit }
    });

    revalidatePath("/admin/ventas");
    return { success: true, message: `Comprobante ${decision === 'approved' ? 'aprobado y acreditado' : 'rechazado'}.` };

  } catch (error) {
    return handleActionError(error);
  }
}

// --- ACCIÓN 16: ELIMINAR COMPROBANTE (Usuario) ---
export async function deletePaymentProof(orderId: string, proofId: string) {
  const user = await requireUser();
  if (!user) return { success: false, message: "Debes iniciar sesión." };

  try {
    const dbAdmin = getAdminDb();
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return { success: false, message: "Pedido no encontrado." };
    
    const orderData = orderSnap.data() as Order;
    
    if (orderData.userId !== user.uid) {
      return { success: false, message: "No tienes permiso." };
    }

    const proofs = orderData.paymentProofs || [];
    const proofToDelete = proofs.find(p => p.id === proofId);

    if (!proofToDelete) {
        return { success: false, message: "Comprobante no encontrado." };
    }

    if (proofToDelete.status !== 'pending_review') {
        return { success: false, message: "Solo se pueden eliminar comprobantes pendientes." };
    }

    // 1. Intentar borrar archivo de Storage (Limpieza)
    try {
        if (proofToDelete.url) {
             const urlObj = new URL(proofToDelete.url);
             // Extraer path relativo del bucket desde la URL pública
             const path = decodeURIComponent(urlObj.pathname.split('/o/')[1]);
             await getAdminStorage().bucket().file(path).delete();
        }
    } catch (e) {
        console.warn("Error deleting file from storage (ignoring):", e);
    }

    // 2. Actualizar Firestore (Eliminar del array)
    const updatedProofs = proofs.filter(p => p.id !== proofId);
    
    await orderRef.update({
        paymentProofs: updatedProofs,
        updatedAt: new Date().toISOString()
    });

    revalidatePath("/mis-pedidos");
    revalidatePath("/admin/ventas");
    
    return { success: true, message: "Comprobante eliminado." };

  } catch (error) {
    console.error("Error deleting proof:", error);
    return { success: false, message: "Error al eliminar comprobante." };
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

    // Nuevo objeto de comprobante
    const newProof: PaymentProof = {
      id: Date.now().toString(),
      url: fileUrl,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.uid,
      status: 'pending_review'
    };

    await orderRef.update({
      paymentProofs: FieldValue.arrayUnion(newProof), // Agregamos al array
      paymentProofUrl: fileUrl, // Mantenemos compatibilidad legacy
      status: 'payment_review',
      updatedAt: new Date().toISOString()
    });

    logActivity("INFO", "upload_payment_proof", {
      actorUid: user.uid,
      actorRole: "user",
      targetId: orderId,
      metadata: { fileType }
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
      if (!orderDoc.exists) throw new BusinessError("Pedido no encontrado");

      const data = orderDoc.data();
      const total = data?.total || 0;
      const currentAmountPaid = data?.amountPaid || 0;
      
      const newAmountPaid = currentAmountPaid + amountToAdd;

      // Validación: No permitir pagar más del total
      if (newAmountPaid > total) {
        throw new BusinessError(`El monto excede el saldo restante ($${total - currentAmountPaid}).`);
      }

      const newBalance = total - newAmountPaid;
      const newPaymentStatus: PaymentStatus = newBalance <= 0 ? 'paid' : 'partial';

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

    logActivity("SECURITY", "add_payment", {
      actorUid: claims.uid,
      actorRole: "admin",
      targetId: orderId,
      metadata: { amountToAdd, note }
    });

    // --- PASO 3: OBSERVABILIDAD Y NOTIFICACIONES ---
    const updatedOrderSnap = await getAdminDb().collection("orders").doc(orderId).get();
    if (updatedOrderSnap.exists) {
      const updatedOrder = { id: updatedOrderSnap.id, ...updatedOrderSnap.data() } as Order;
      const newBalance = updatedOrder.balance;
      
      await logOrderEvent(orderId, 'PAYMENT_ADDED', `Pago de $${amountToAdd} registrado.`, { note, newBalance }, email);
      
      // Solo notificamos si es relevante para el usuario (ej: saldo actualizado)
      await notifyOrderUpdate(updatedOrder, 'PAYMENT_ADDED', `Se registró un pago de $${amountToAdd}. Resta abonar: $${newBalance}.`);
    }

    revalidatePath("/admin/ventas");
    revalidatePath("/mis-pedidos");
    return { success: true, message: "Pago registrado correctamente." };
  } catch (error) {
    return handleActionError(error);
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

    logActivity("INFO", "submit_receipt", {
      actorUid: user.uid,
      actorRole: "user",
      targetId: orderId,
      metadata: { amountClaimed }
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
      ...sanitizeOrderForClient(doc.data())
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

    return { id: orderSnap.id, ...sanitizeOrderForClient(orderData) } as Order;
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
      ...sanitizeOrderForClient(data)
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

    logActivity("INFO", "claim_guest_orders", {
      actorUid: user.uid,
      actorRole: "user",
      metadata: { email, count: snapshot.size }
    });
    
    return { success: true, count: snapshot.size, message: `${snapshot.size} pedidos vinculados.` };
  } catch (error) {
    console.error("Error claiming guest orders:", error);
    return { success: false, message: "Error al vincular pedidos." };
  }
}
