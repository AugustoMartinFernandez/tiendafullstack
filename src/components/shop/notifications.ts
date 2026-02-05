"use server";

import { requireUser } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function markNotificationAsRead(notificationId: string) {
  const user = await requireUser();
  if (!user) return { success: false, message: "No autorizado" };

  try {
    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("notifications").doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) return { success: false, message: "Notificación no encontrada" };
    if (doc.data()?.userId !== user.uid) return { success: false, message: "No autorizado" };

    await docRef.update({ read: true });
    revalidatePath("/mis-pedidos"); 
    return { success: true };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false };
  }
}