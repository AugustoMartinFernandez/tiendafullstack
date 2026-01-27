import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { CartItem } from "@/context/cart-context";

/**
 * Obtiene el carrito de un usuario desde una subcolección en Firestore.
 * @param userId - El ID del usuario.
 * @returns Una promesa que se resuelve con un array de CartItem.
 */
export async function getUserCart(userId: string): Promise<CartItem[]> {
  try {
    const cartRef = collection(db, 'users', userId, 'cart');
    const snapshot = await getDocs(cartRef);
    if (snapshot.empty) {
      return [];
    }
    // Mapea los documentos a objetos CartItem
    return snapshot.docs.map(doc => doc.data() as CartItem);
  } catch (error) {
    console.error("Error al obtener el carrito de Firestore:", error);
    return [];
  }
}

/**
 * Guarda el carrito de un usuario en Firestore, sobreescribiendo el anterior.
 * @param userId - El ID del usuario.
 * @param items - El array de CartItem a guardar.
 */
export async function saveUserCart(userId: string, items: CartItem[]): Promise<void> {
  const cartRef = collection(db, 'users', userId, 'cart');
  const batch = writeBatch(db);

  try {
    // 1. Obtiene todos los documentos actuales para borrarlos
    const existingDocs = await getDocs(cartRef);
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Añade los nuevos items al batch
    items.forEach(item => {
      const docRef = doc(cartRef, item.id); // Usa el ID del producto como ID del documento
      batch.set(docRef, JSON.parse(JSON.stringify(item))); // Limpia el objeto de valores `undefined`
    });

    // 3. Ejecuta todas las operaciones en una sola transacción
    await batch.commit();
  } catch (error) {
    console.error("Error al guardar el carrito en Firestore:", error);
    throw error;
  }
}

export function mergeCarts(localCart: CartItem[], remoteCart: CartItem[]): CartItem[] {
  const mergedMap = new Map<string, CartItem>();

  remoteCart.forEach(item => mergedMap.set(item.id, { ...item }));

  localCart.forEach(localItem => {
    const existingItem = mergedMap.get(localItem.id);
    if (existingItem) {
      existingItem.quantity += localItem.quantity;
    } else {
      mergedMap.set(localItem.id, { ...localItem });
    }
  });

  return Array.from(mergedMap.values());
}