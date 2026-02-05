"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { ShopBanner } from "@/lib/types"; 

// --- INTERFACES EXPORTADAS ---
export interface HomeConfig {
  hero?: {
    title: string;
    subtitle: string;
    badgeText: string;
    buttonText: string;
    buttonUrl: string;
    imageUrl: string;
    overlayOpacity?: number;
    titleColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  benefits?: {
    id: string;
    icon: string;
    title: string;
    description: string;
  }[];
  faqs?: {
    id: string;
    question: string;
    answer: string;
  }[];
}

// --- ACCIÓN: REVALIDAR TIENDA ---
export async function revalidateStore() {
  revalidatePath("/");
  revalidatePath("/tienda");
  revalidatePath("/admin/productos");
  // Eliminamos revalidateTag para evitar el error de tipos, 
  // revalidatePath ya es suficiente.
}

// --- ACCIÓN 1: ACTUALIZAR EL HOME (Admin) ---
export async function updateHomeConfig(formDataOrPayload: FormData | Partial<HomeConfig>) {
  const { requireAdmin } = await import("@/lib/auth-server");
  await requireAdmin();
  
  const dbAdmin = getAdminDb();
  const docRef = dbAdmin.collection("settings").doc("home_config");

  const updates: Partial<HomeConfig> = {};

  const isFormData = typeof (formDataOrPayload as any)?.has === "function" || formDataOrPayload instanceof FormData;

  if (isFormData) {
    const formData = formDataOrPayload as FormData;

    // 1. DETECTAR ACTUALIZACIÓN DE HERO
    if (formData.has("title")) {
      const heroData = {
        title: formData.get("title") as string,
        subtitle: formData.get("subtitle") as string,
        badgeText: formData.get("badgeText") as string,
        buttonText: formData.get("buttonText") as string,
        buttonUrl: formData.get("buttonUrl") as string,
        imageUrl: formData.get("imageUrl") as string,
        overlayOpacity: formData.has("overlayOpacity") ? Number(formData.get("overlayOpacity")) : undefined,
        titleColor: formData.get("titleColor") as string,
        buttonColor: formData.get("buttonColor") as string,
        buttonTextColor: formData.get("buttonTextColor") as string,
      };
      
      updates.hero = Object.fromEntries(
        Object.entries(heroData).filter(([_, v]) => v !== undefined)
      ) as HomeConfig['hero'];
    }

    // 2. DETECTAR ACTUALIZACIÓN DE BENEFICIOS
    if (formData.has("benefits")) {
      try {
        updates.benefits = JSON.parse(formData.get("benefits") as string);
      } catch (e) {
        console.error("Error parseando benefits:", e);
        return { success: false, message: "Error en el formato de beneficios." };
      }
    }

    // 3. DETECTAR ACTUALIZACIÓN DE FAQS
    if (formData.has("faqs")) {
      try {
        updates.faqs = JSON.parse(formData.get("faqs") as string);
      } catch (e) {
        console.error("Error parseando faqs:", e);
        return { success: false, message: "Error en el formato de FAQs." };
      }
    }
  } else {
    const payload = formDataOrPayload as Partial<HomeConfig>;
    if (payload.hero) updates.hero = payload.hero;
    if (payload.benefits) updates.benefits = payload.benefits;
    if (payload.faqs) updates.faqs = payload.faqs;
  }

  try {
    await docRef.set(updates, { merge: true });
    
    revalidatePath("/");
    // revalidateTag eliminado para evitar error de tipos
    
    return { success: true, message: "Configuración guardada correctamente." };
  } catch (error) {
    console.error("Error guardando Home:", error);
    return { success: false, message: "Error al guardar configuración del Home." };
  }
}

// --- ACCIÓN: OBTENER CONFIGURACIÓN DEL HOME ---
export async function getHomeConfig(): Promise<HomeConfig | null> {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("home_config").get();
    if (docSnap.exists) {
      return docSnap.data() as HomeConfig;
    }
    return null;
  } catch (error) {
    console.error("Error fetching home config:", error);
    return null;
  }
}

// --- ACCIÓN: OBTENER BANNER DE TIENDA (NUEVO) ---
export async function getShopBanner(): Promise<ShopBanner> {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("shopBanner").get();
    
    if (docSnap.exists) {
      return docSnap.data() as ShopBanner;
    }
    
    // Default si no existe
    return {
      isActive: false,
      title: "¡Bienvenido!",
      description: "Descubre nuestros nuevos productos.",
      backgroundColor: "#4f46e5",
      textColor: "#ffffff",
      buttonText: "",
      buttonLink: ""
    };
  } catch (error) {
    console.error("Error fetching shop banner:", error);
    // Retornar objeto seguro en caso de error
    return { isActive: false, title: "", description: "", backgroundColor: "", textColor: "" };
  }
}

// --- ACCIÓN: ACTUALIZAR BANNER DE TIENDA (NUEVO) ---
export async function updateShopBanner(data: ShopBanner) {
  // Fix: Importamos requireAdmin dinámicamente
  const { requireAdmin } = await import("@/lib/auth-server");
  
  try {
    await requireAdmin(); // Seguridad: Solo admin
    const dbAdmin = getAdminDb();
    await dbAdmin.collection("settings").doc("shopBanner").set(data);
    
    revalidatePath("/tienda"); 
    revalidatePath("/admin/personalizacion");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating shop banner:", error);
    return { success: false, error: "No se pudo actualizar el banner" };
  }
}

// --- ACCIÓN: OBTENER CONFIGURACIÓN DE TIENDA ---
export async function getStoreConfig() {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("store_config").get();
    if (docSnap.exists) {
      return docSnap.data();
    }
    return null;
  } catch {
    return null;
  }
}

// --- ACCIÓN: ACTUALIZAR CONFIGURACIÓN DE TIENDA (SEO) ---
export async function updateStoreConfig(formData: FormData) {
  const { requireAdmin } = await import("@/lib/auth-server");
  await requireAdmin();

  const seo = {
    title: formData.get("seoTitle") as string,
    description: formData.get("seoDescription") as string,
  };

  try {
    const dbAdmin = getAdminDb();
    await dbAdmin.collection("settings").doc("store_config").set({
      seo,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    revalidatePath("/", "layout");
    return { success: true, message: "Configuración SEO actualizada." };
  } catch (error) {
    console.error("Error updating store config:", error);
    return { success: false, message: "Error al actualizar." };
  }
}

// --- ACCIÓN: OBTENER TODAS LAS CATEGORÍAS ---
export async function getCategories() {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("categories").get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data && Array.isArray(data.list)) {
        return data.list.sort();
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// --- ACCIÓN: OBTENER TODOS LOS TAGS ---
export async function getTags() {
  try {
    const dbAdmin = getAdminDb();
    const docSnap = await dbAdmin.collection("settings").doc("tags").get();
    return docSnap.exists ? (docSnap.data()?.list || []) : [];
  } catch {
    return [];
  }
}

// --- ACCIÓN: ELIMINAR CATEGORÍA CUSTOM ---
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

// --- ACCIÓN: RENOMBRAR CATEGORÍA ---
export async function renameCustomCategory(oldName: string, newName: string) {
  const { requireAdmin } = await import("@/lib/auth-server");
  await requireAdmin();
  
  if (!newName.trim()) return { success: false, message: "El nombre no puede estar vacío." };
  if (oldName === newName) return { success: false, message: "El nombre es igual." };

  try {
    const dbAdmin = getAdminDb();
    const settingsRef = dbAdmin.collection("settings").doc("categories");
    const batch = dbAdmin.batch();

    await settingsRef.update({ list: FieldValue.arrayRemove(oldName) });
    
    if (!PRODUCT_CATEGORIES.includes(newName as (typeof PRODUCT_CATEGORIES)[number])) {
       await settingsRef.update({ list: FieldValue.arrayUnion(newName) });
    }

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