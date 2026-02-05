"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { UserNotification } from "@/lib/types";

export async function markNotificationAsRead(notificationId: string) {
  // Validar que el usuario tenga un ID token válido
  // En una implementación real, deberías verificar el usuario actual
  // Por ahora, permitimos el acceso pero validamos que el ID existe
  
  try {
    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("notifications").doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) return { success: false, message: "Notificación no encontrada" };

    await docRef.update({ read: true });
    revalidatePath("/mis-pedidos"); 
    return { success: true };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("notifications").doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) return { success: false, message: "Notificación no encontrada" };

    await docRef.delete();
    
    // Revalidar para que se actualice en tiempo real
    revalidatePath("/");
     
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, message: "Error al eliminar" };
  }
}

// --- ACCIÓN NUEVA: ELIMINAR TODAS LAS NOTIFICACIONES ---
export async function deleteAllNotifications(userId: string) {
  if (!userId) return { success: false, message: "Usuario no identificado" };

  try {
    const dbAdmin = getAdminDb();
    const snapshot = await dbAdmin.collection("notifications")
      .where("userId", "==", userId)
      .get();

    if (snapshot.empty) return { success: true, message: "No hay notificaciones para eliminar" };

    const batch = dbAdmin.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    revalidatePath("/");

    return { success: true, message: `${snapshot.size} notificaciones eliminadas.` };
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return { success: false, message: "Error al eliminar notificaciones" };
  }
}

// --- ACCIÓN 12: OBTENER NOTIFICACIONES DEL USUARIO (Lectura Segura) ---
export async function getUserNotifications(userId: string, orderId?: string) {
  if (!userId) return [];

  try {
    const dbAdmin = getAdminDb();
    let q = dbAdmin.collection("notifications")
      .where("userId", "==", userId);

    // Si se especifica un pedido, filtramos también por él
    if (orderId) {
      q = q.where("orderId", "==", orderId);
    }

    // Ordenamos por fecha descendente (requiere índice compuesto userId + createdAt)
    const snapshot = await q.orderBy("createdAt", "desc").limit(20).get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserNotification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

// --- ACCIÓN 13: MARCAR NOTIFICACIONES COMO LEÍDAS ---
export async function markAllNotificationsAsRead(userId: string, orderId?: string) {
  if (!userId) return { success: false, message: "No autorizado" };

  try {
    const dbAdmin = getAdminDb();
    let q = dbAdmin.collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false);

    if (orderId) {
      q = q.where("orderId", "==", orderId);
    }

    const snapshot = await q.get();

    if (snapshot.empty) return { success: true };

    const batch = dbAdmin.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    revalidatePath("/mis-pedidos");
    if (orderId) revalidatePath(`/perfil/pedidos/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return { success: false };
  }
}

// --- ACCIÓN 14: CONTAR NOTIFICACIONES NO LEÍDAS (Optimizado) ---
export async function getUnreadNotificationsCount(userId: string) {
  if (!userId) return 0;

  try {
    const dbAdmin = getAdminDb();
    const snapshot = await dbAdmin.collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false)
      .count()
      .get();

    return snapshot.data().count;
  } catch (error) {
    return 0;
  }
}

// --- ACCIÓN 15: TOGGLE NOTIFICACIONES (Opt-in) ---
export async function toggleNotificationOptIn(userId: string, enabled: boolean) {
  if (!userId) return { success: false, message: "Debes iniciar sesión." };

  try {
    const db = getAdminDb();
    await db.collection("users").doc(userId).set({
      notificationsOptIn: enabled,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    revalidatePath("/perfil");
    return { success: true, message: `Notificaciones ${enabled ? 'activadas' : 'desactivadas'}.` };
  } catch (error) {
    console.error("Error toggling notifications:", error);
    return { success: false, message: "Error al actualizar preferencias." };
  }
}
