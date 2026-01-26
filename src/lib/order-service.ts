import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs, 
  where, 
  doc,        // <--- Faltaba esto
  updateDoc   // <--- Faltaba esto
} from "firebase/firestore";
import { Order } from "@/lib/types";

// Omitimos 'id' porque Firestore lo genera
type CreateOrderData = Omit<Order, "id">;

export async function createOrder(orderData: CreateOrderData) {
  try {
    const ordersRef = collection(db, "orders");
    
    // Limpiamos datos undefined para evitar errores de Firestore
    const cleanData = JSON.parse(JSON.stringify(orderData));

    const docRef = await addDoc(ordersRef, {
      ...cleanData,
      createdAt: new Date().toISOString(), // Timestamp del servidor
    });

    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Error creando pedido:", error);
    return { success: false, message: "No se pudo procesar el pedido." };
  }
}

// --- ADMIN: Obtener todos los pedidos ---
export async function getAllOrders() {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error("Error getting all orders:", error);
    return [];
  }
}

// --- CLIENTE: Obtener mis pedidos ---
export async function getUserOrders(userId: string) {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

// --- NUEVO: Actualizar Estado (Lo que faltaba) ---
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { 
      status: status,
      updatedAt: new Date().toISOString() // Opcional: para saber cuándo cambió
    });
    return { success: true };
  } catch (error) {
    console.error("Error actualizando estado:", error);
    return { success: false };
  }
}