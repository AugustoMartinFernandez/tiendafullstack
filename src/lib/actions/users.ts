"use server";

import { requireAdmin, requireUser } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { UserProfile, Order } from "@/lib/types";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { logActivity } from "@/lib/loggers";

// Tipo extendido para el panel de clientes
export interface ClientWithOrders extends UserProfile {
  orders: Order[];
  totalSpent: number;
  totalDebt: number;
  lastOrderDate?: string;
  ordersCount: number;
}

export async function getClientsWithOrders(): Promise<ClientWithOrders[]> {
  noStore();
  await requireAdmin();
  
  try {
    const db = getAdminDb();

    // 1. Obtener todos los usuarios registrados
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));

    // 2. Obtener todos los pedidos (Optimización: Traemos solo campos necesarios si fuera muy grande, 
    // pero para un panel admin completo necesitamos todo para filtrar en cliente)
    const ordersSnap = await db.collection("orders").orderBy("createdAt", "desc").get();
    
    // Mapeo manual para asegurar tipos y sanitización básica
    const allOrders = ordersSnap.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Order;
    });

    // 3. Cruzar datos (Aggregation)
    const clients: ClientWithOrders[] = users.map(user => {
      // Filtramos pedidos de este usuario
      const userOrders = allOrders.filter(o => o.userId === user.uid);
      
      // Cálculos financieros
      const totalSpent = userOrders.reduce((acc, o) => acc + (o.amountPaid || 0), 0);
      const totalDebt = userOrders.reduce((acc, o) => acc + (o.balance || 0), 0);
      const lastOrderDate = userOrders.length > 0 ? userOrders[0].createdAt : undefined;

      return {
        ...user,
        orders: userOrders,
        totalSpent,
        totalDebt,
        ordersCount: userOrders.length,
        lastOrderDate
      };
    });

    // Ordenar por actividad reciente (los que compraron último primero)
    return clients.sort((a, b) => (b.lastOrderDate || "").localeCompare(a.lastOrderDate || ""));

  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

// --- DETALLE DE CLIENTE (CRM) ---
export async function getClientDetails(uid: string) {
  noStore();
  await requireAdmin();
  
  // Validación de seguridad: Si no hay UID, retornamos null antes de llamar a Firebase
  if (!uid) return null;

  const db = getAdminDb();
  
  // 1. Perfil
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;
  const user = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
  
  // 2. Pedidos
  const ordersSnap = await db.collection("orders")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();
    
  const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  
  return { user, orders };
}

// --- ACTUALIZAR NOTA INTERNA ---
export async function updateClientNote(uid: string, note: string) {
  const claims = await requireAdmin();
  try {
    const db = getAdminDb();
    await db.collection("users").doc(uid).set({
      internalNote: note,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    logActivity("INFO", "update_user_note", {
      actorUid: claims.uid,
      actorRole: "admin",
      targetId: uid,
      metadata: { note_length: note.length }
    });

    revalidatePath(`/admin/clientes/${uid}`);
    return { success: true, message: "Nota guardada." };
  } catch (error) {
    return { success: false, message: "Error al guardar nota." };
  }
}

// --- ACCIONES DE USUARIO (BRIDGE SEGURO) ---

export async function syncUser(userData: UserProfile) {
  // 1. Seguridad: Verificar que la sesión del servidor coincida con el UID solicitado
  const session = await requireUser();
  if (!session || session.uid !== userData.uid) {
    console.error("Security: Intento de syncUser con UID no coincidente o sin sesión.");
    return null;
  }

  try {
    const db = getAdminDb();
    const userRef = db.collection("users").doc(userData.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      // Si el usuario ya existe, retornamos los datos de la DB (Source of Truth)
      // Esto evita que un cliente malintencionado sobrescriba datos enviando un objeto modificado.
      return userSnap.data() as UserProfile;
    }

    // 2. Creación: Forzamos rol 'user' (Anti-hack)
    // Ignoramos cualquier rol que venga del cliente.
    const safeData = {
      ...userData,
      role: "user", 
      createdAt: new Date().toISOString()
    };

    await userRef.set(safeData);
    return safeData as UserProfile;
  } catch (error) {
    console.error("Error syncing user:", error);
    return null;
  }
}

export async function updateUser(uid: string, data: Partial<UserProfile>) {
  // 1. Seguridad: Verificar propiedad
  const session = await requireUser();
  if (!session || session.uid !== uid) {
    return { success: false, message: "No autorizado." };
  }

  try {
    const db = getAdminDb();
    
    // 2. Sanitización: Eliminar campos sensibles del payload
    // El usuario NO puede cambiar su propio rol, uid o email directamente aquí.
    const { role, uid: id, email, ...safeData } = data as any;

    await db.collection("users").doc(uid).update({
      ...safeData,
      updatedAt: new Date().toISOString()
    });
    
    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, message: "Error al actualizar perfil." };
  }
}