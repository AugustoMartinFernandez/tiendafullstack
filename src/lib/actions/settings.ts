"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

// --- NUEVA ACCIÓN: REVALIDAR TIENDA ---
export async function revalidateStore() {
  revalidatePath("/");
  revalidatePath("/tienda");
  revalidatePath("/admin/productos");
}

// --- ACCIÓN 1: ACTUALIZAR EL HOME (Admin) ---
export async function updateHomeConfig(formData: FormData) {
  // Nota: requireAdmin se importa de auth-server. Como no queremos referencias circulares
  // complejas, podés importarlo aquí si es necesario, o asegurarte de que quien llame
  // a esto maneje la seguridad. En el original estaba dentro.
  // Para mantener la fidelidad 100% al original, importamos la validación.
  const { requireAdmin } = await import("@/lib/auth-server");
  await requireAdmin();
  
  const heroData = {
    hero: {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      badgeText: formData.get("badgeText") as string,
      buttonText: formData.get("buttonText") as string,
      buttonUrl: formData.get("buttonUrl") as string,
      imageUrl: formData.get("imageUrl") as string,
    },
  };

  try {
    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("settings").doc("home_config");
    await docRef.update(heroData);
    revalidatePath("/");
    return { success: true, message: "¡Home actualizado correctamente!" };
  } catch (error) {
    console.error("Error guardando Home:", error);
    return { success: false, message: "Error al guardar configuración del Home." };
  }
}

// --- ACCIÓN 7: OBTENER CONFIGURACIÓN DE TIENDA ---
export async function getStoreConfig() {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("store_config").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (!data) return null;
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// --- ACCIÓN 11: OBTENER TODAS LAS CATEGORÍAS (Fijas + Dinámicas) ---
export async function getCategories() {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("categories").get();
    const customCategories = docSnap.exists ? (docSnap.data()?.list || []) : [];
    
    // Unimos y ordenamos alfabéticamente
    const allCategories = Array.from(new Set([...PRODUCT_CATEGORIES, ...customCategories])).sort();
    return allCategories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [...PRODUCT_CATEGORIES];
  }
}

// --- ACCIÓN 14: OBTENER TODOS LOS TAGS ---
export async function getTags() {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("tags").get();
    return docSnap.exists ? (docSnap.data()?.list || []) : [];
  } catch {
    return [];
  }
}

// --- ACCIÓN 12: ELIMINAR CATEGORÍA CUSTOM ---
export async function deleteCustomCategory(category: string) {
  const { requireAdmin } = await import("@/lib/auth-server");
  await requireAdmin();
  try {
    const dbAdmin = getAdminDb();
    const settingsRef = dbAdmin.collection("settings").doc("categories");
    await settingsRef.update({
      list: FieldValue.arrayRemove(category)
    });
    revalidatePath("/admin/productos");
    return { success: true, message: "Categoría eliminada de la lista." };
  } catch {
    return { success: false, message: "Error al eliminar categoría." };
  }
}

// --- ACCIÓN 13: RENOMBRAR CATEGORÍA (Y MIGRAR PRODUCTOS) ---
export async function renameCustomCategory(oldName: string, newName: string) {
  const { requireAdmin } = await import("@/lib/auth-server");
  await requireAdmin();
  
  if (!newName.trim()) return { success: false, message: "El nombre no puede estar vacío." };
  if (oldName === newName) return { success: false, message: "El nombre es igual." };

  try {
    const dbAdmin = getAdminDb();
    const settingsRef = dbAdmin.collection("settings").doc("categories");
    const batch = dbAdmin.batch();

    // 1. Actualizar lista de categorías (Quitamos la vieja)
    await settingsRef.update({ list: FieldValue.arrayRemove(oldName) });
    
    // Si la nueva NO es fija, la agregamos (si es fija, solo migramos productos)
    if (!PRODUCT_CATEGORIES.includes(newName as (typeof PRODUCT_CATEGORIES)[number])) {
       await settingsRef.update({ list: FieldValue.arrayUnion(newName) });
    }

    // 2. Migrar productos en lote (Batch)
    const snapshot = await dbAdmin.collection("products").where("category", "==", oldName).get();
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { category: newName, updatedAt: new Date().toISOString() });
    });

    await batch.commit();

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    
    return { success: true, message: `Categoría renombrada y ${snapshot.size} productos migrados.` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error al renombrar." };
  }
}