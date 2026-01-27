import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { Product } from "@/lib/types";

/**
 * Obtiene los favoritos de un usuario desde una subcolección en Firestore.
 * @param userId - El ID del usuario.
 * @returns Una promesa que se resuelve con un array de Product.
 */
export async function getUserFavorites(userId: string): Promise<Product[]> {
  try {
    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const snapshot = await getDocs(favoritesRef);
    if (snapshot.empty) {
      return [];
    }
    // Mapea los documentos a objetos Product
    return snapshot.docs.map(doc => doc.data() as Product);
  } catch (error) {
    console.error("Error al obtener los favoritos de Firestore:", error);
    return [];
  }
}

/**
 * Guarda los favoritos de un usuario en Firestore, sobreescribiendo los anteriores.
 * @param userId - El ID del usuario.
 * @param items - El array de Product a guardar.
 */
export async function saveUserFavorites(userId: string, items: Product[]): Promise<void> {
  const favoritesRef = collection(db, 'users', userId, 'favorites');
  const batch = writeBatch(db);

  try {
    // 1. Obtiene todos los documentos actuales para borrarlos
    const existingDocs = await getDocs(favoritesRef);
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Añade los nuevos items al batch
    items.forEach(item => {
      const docRef = doc(favoritesRef, item.id); // Usa el ID del producto como ID del documento
      batch.set(docRef, JSON.parse(JSON.stringify(item))); // Limpia el objeto de valores `undefined`
    });

    // 3. Ejecuta todas las operaciones en una sola transacción
    await batch.commit();
  } catch (error) {
    console.error("Error al guardar los favoritos en Firestore:", error);
    throw error;
  }
}

/**
 * Fusiona los favoritos locales y remotos, creando una lista única.
 * @param localFavorites - Favoritos de localStorage.
 * @param remoteFavorites - Favoritos de Firestore.
 * @returns Un array fusionado de productos favoritos únicos.
 */
export function mergeFavorites(localFavorites: Product[], remoteFavorites: Product[]): Product[] {
  const mergedMap = new Map<string, Product>();

  remoteFavorites.forEach(item => mergedMap.set(item.id, { ...item }));
  localFavorites.forEach(localItem => {
    if (!mergedMap.has(localItem.id)) {
      mergedMap.set(localItem.id, { ...localItem });
    }
  });

  return Array.from(mergedMap.values());
}