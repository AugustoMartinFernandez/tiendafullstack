// src/lib/actions.ts
"use server";

import { db, storage } from "./firebase";
import { 
  doc, updateDoc, collection, addDoc, deleteDoc, getDoc, query, where, getDocs,
  limit, startAfter, endBefore, limitToLast, orderBy, startAt, endAt, setDoc, arrayUnion, arrayRemove, writeBatch, getCountFromServer
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

// --- MOCK DE SEGURIDAD ---
async function requireAdmin() {
  // TODO: Conectar con sistema de autenticación real (ej: Firebase Auth / NextAuth)
  // Por ahora, permitimos el paso para no bloquear el desarrollo.
  return true;
}

// --- HELPER: GUARDAR CATEGORÍA CUSTOM ---
async function saveCustomCategory(category: string) {
  // Si ya está en las constantes, no hacemos nada
  if (PRODUCT_CATEGORIES.includes(category as any)) return;

  try {
    const settingsRef = doc(db, "settings", "categories");
    // Usamos arrayUnion para agregar sin duplicar
    await setDoc(settingsRef, { list: arrayUnion(category) }, { merge: true });
  } catch (error) {
    console.error("Error guardando categoría:", error);
  }
}

// --- HELPER: GUARDAR TAGS CUSTOM ---
async function saveCustomTags(tags: string[]) {
  if (!tags || tags.length === 0) return;
  try {
    const settingsRef = doc(db, "settings", "tags");
    await setDoc(settingsRef, { list: arrayUnion(...tags) }, { merge: true });
  } catch (error) {
    console.error("Error guardando tags:", error);
  }
}

// --- HELPER: GENERAR SKU AUTOMÁTICO ---
function generateAutoSku(name: string) {
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  
  const prefix = cleanName.substring(0, 6) || "PROD";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

const forbiddenWords = ["prohibido", "ofensivo", "spam", "groseria"];

// --- ESQUEMA DE VALIDACIÓN (ZOD) ---
const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  sku: z.string().optional(),
  description: z.string().max(500, "La descripción no puede superar los 500 caracteres.").optional().refine((val) => {
    if (!val) return true;
    const lowerVal = val.toLowerCase();
    return !forbiddenWords.some(word => lowerVal.includes(word));
  }, { message: "La descripción contiene palabras prohibidas u ofensivas." }),
  price: z.number().min(0, "El precio no puede ser negativo."),
  originalPrice: z.number().min(0).optional(),
  category: z.string().min(1, "La categoría es obligatoria."),
  subCategory: z.string().optional(),
  stock: z.number().int("El stock debe ser entero").min(0, "El stock no puede ser negativo.").max(1000, "El stock no puede ser mayor a 1000 unidades."),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, "El producto debe tener al menos una imagen."),
  attributes: z.record(z.string(), z.string()).optional(),
}).refine((data) => {
  if (data.originalPrice && data.originalPrice > 0) {
    return data.originalPrice > data.price;
  }
  return true;
}, { message: "El precio original debe ser mayor al precio de venta.", path: ["originalPrice"] });

// --- ACCIÓN 1: ACTUALIZAR EL HOME (Admin) ---
export async function updateHomeConfig(formData: FormData) {
  // Nota: También podríamos proteger esto, pero el requerimiento pedía create/update/delete product.
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
    const docRef = doc(db, "settings", "home_config");
    await updateDoc(docRef, heroData);
    revalidatePath("/");
    return { success: true, message: "¡Home actualizado correctamente!" };
  } catch (error) {
    console.error("Error guardando Home:", error);
    return { success: false, message: "Error al guardar configuración del Home." };
  }
}

// --- ACCIÓN 2: CREAR PRODUCTO NUEVO ---
export async function createProduct(formData: FormData) {
  await requireAdmin(); // Seguridad

  // 1. Extraer atributos dinámicos
  const attributes: Record<string, string> = {};
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith("attr_") && value) {
      const attributeName = key.replace("attr_", "").trim();
      if (attributeName) {
        const isDuplicate = Object.keys(attributes).some((k) => k.toLowerCase() === attributeName.toLowerCase());

        if (isDuplicate) {
          return { success: false, message: `El atributo "${attributeName}" está duplicado.` };
        }
        attributes[attributeName] = value as string;
      }
    }
  }

  // VALIDACIÓN DE SKU ÚNICO
  let sku = formData.get("sku") ? (formData.get("sku") as string).trim() : "";
  
  if (!sku) {
    const name = formData.get("name") as string;
    if (name) sku = generateAutoSku(name);
  }

  if (sku) {
    const q = query(collection(db, "products"), where("sku", "==", sku));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: `El SKU "${sku}" ya está en uso por otro producto.` };
    }
  }

  const sortedAttributes = Object.keys(attributes)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = attributes[key];
      return acc;
    }, {} as Record<string, string>);

  // 2. Preparar objeto
  const rawData = {
    name: formData.get("name") ?? "",
    sku,
    description: formData.get("description") ?? "",
    price: Number(formData.get("price")),
    originalPrice: formData.get("originalPrice") ? Number(formData.get("originalPrice")) : 0,
    category: formData.get("category") ?? "",
    subCategory: formData.get("subCategory") ?? "",
    stock: Number(formData.get("stock")),
    tags: formData.getAll("tags"),
    images: formData.getAll("images"),
    attributes: sortedAttributes,
  };

  // 3. Validar con Zod
  const validation = productSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  try {
    // Guardamos la categoría si es nueva
    await saveCustomCategory(validation.data.category);
    
    // Guardamos los tags nuevos para sugerencias futuras
    if (validation.data.tags) await saveCustomTags(validation.data.tags);

    await addDoc(collection(db, "products"), {
      ...validation.data,
      isVisible: true,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");
    
    return { success: true, message: "Producto creado con éxito" };
  } catch (error) {
    console.error("Error creando producto:", error);
    return { success: false, message: "Error al guardar producto" };
  }
}

// --- ACCIÓN 3: BORRAR PRODUCTO ---
export async function deleteProduct(formData: FormData) {
  await requireAdmin(); // Seguridad

  const id = formData.get("id") as string;
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const imagesToDelete: string[] = [];
      if (Array.isArray(data.images)) imagesToDelete.push(...data.images);
      if (data.imageUrl) imagesToDelete.push(data.imageUrl);

      await Promise.allSettled(
        imagesToDelete.map((url) => {
          const fileRef = ref(storage, url);
          return deleteObject(fileRef);
        })
      );
    }

    await deleteDoc(docRef);
    
    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");
    return { success: true, message: "Producto eliminado correctamente." };
  } catch (error) {
    console.error("Error eliminando:", error);
    return { success: false, message: "Error al eliminar." };
  }
}

// --- ACCIÓN 4: CAMBIAR VISIBILIDAD ---
export async function toggleProductVisibility(formData: FormData) {
  // Opcional: Proteger también
  const id = formData.get("id") as string;
  const currentStatus = formData.get("currentStatus") === "true";
  
  try {
    await updateDoc(doc(db, "products", id), {
      isVisible: !currentStatus 
    });
    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");
    return { success: true, message: "Visibilidad actualizada." };
  } catch (error) {
    console.error("Error actualizando visibilidad:", error);
    return { success: false, message: "Error al actualizar." };
  }
}

// --- ACCIÓN 5: DUPLICAR PRODUCTO ---
export async function duplicateProduct(formData: FormData) {
  // Opcional: Proteger también
  const id = formData.get("id") as string;
  try {
    const originalRef = doc(db, "products", id);
    const originalSnap = await getDoc(originalRef);
    if (!originalSnap.exists()) return { success: false, message: "Producto no encontrado." };
    
    const originalData = originalSnap.data();
    await addDoc(collection(db, "products"), {
      ...originalData,
      name: `${originalData.name} (Copia)`,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");
    return { success: true, message: "Producto duplicado con éxito." };
  } catch (error) {
    console.error("Error duplicando:", error);
    return { success: false, message: "Error al duplicar." };
  }
}

// --- ACCIÓN 6: EDITAR PRODUCTO EXISTENTE ---
export async function updateProduct(formData: FormData) {
  await requireAdmin(); // Seguridad

  const id = formData.get("id") as string;
  if (!id) return { success: false, message: "ID del producto no encontrado." };

  const attributes: Record<string, string> = {};
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith("attr_") && value) {
      const attributeName = key.replace("attr_", "").trim();
      if (attributeName) {
        const isDuplicate = Object.keys(attributes).some((k) => k.toLowerCase() === attributeName.toLowerCase());

        if (isDuplicate) {
          return { success: false, message: `El atributo "${attributeName}" está duplicado.` };
        }
        attributes[attributeName] = value as string;
      }
    }
  }

  let sku = formData.get("sku") ? (formData.get("sku") as string).trim() : "";
  
  if (!sku) {
    const name = formData.get("name") as string;
    if (name) sku = generateAutoSku(name);
  }

  if (sku) {
    const q = query(collection(db, "products"), where("sku", "==", sku));
    const querySnapshot = await getDocs(q);
    const isDuplicate = querySnapshot.docs.some(doc => doc.id !== id);
    if (isDuplicate) {
      return { success: false, message: `El SKU "${sku}" ya está en uso por otro producto.` };
    }
  }

  const sortedAttributes = Object.keys(attributes)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = attributes[key];
      return acc;
    }, {} as Record<string, string>);

  const rawData = {
    name: formData.get("name") ?? "",
    sku,
    description: formData.get("description") ?? "",
    price: Number(formData.get("price")),
    originalPrice: formData.get("originalPrice") ? Number(formData.get("originalPrice")) : 0,
    category: formData.get("category") ?? "",
    subCategory: formData.get("subCategory") ?? "",
    stock: Number(formData.get("stock")),
    tags: formData.getAll("tags"),
    images: formData.getAll("images"),
    attributes: sortedAttributes,
  };

  const validation = productSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  try {
    // Guardamos la categoría si es nueva
    await saveCustomCategory(validation.data.category);

    // Guardamos los tags nuevos
    if (validation.data.tags) await saveCustomTags(validation.data.tags);

    const docRef = doc(db, "products", id);
    await updateDoc(docRef, validation.data);

    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");
    revalidatePath(`/producto/${id}`);

    return { success: true, message: "Producto actualizado." };
  } catch (error) {
    console.error("Error editando:", error);
    return { success: false, message: "Error al actualizar." };
  }
}

// --- ACCIÓN 7: OBTENER CONFIGURACIÓN DE TIENDA ---
export async function getStoreConfig() {
  try {
    const docRef = doc(db, "settings", "store_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    return null;
  }
}

// --- ACCIÓN 8: VALIDAR CARRITO (Sanitización de Precios y Stock) ---
export async function validateCartItems(items: { id: string; quantity: number }[]) {
  if (!items || items.length === 0) return [];

  try {
    // Consultamos todos los productos en paralelo para máxima velocidad
    const docsSnap = await Promise.all(
      items.map((item) => getDoc(doc(db, "products", item.id)))
    );

    const validatedItems = docsSnap
      .map((snap) => {
        if (!snap.exists()) return null; // Si no existe, lo marcamos para borrar
        const data = snap.data();
        
        // Devolvemos solo los datos frescos necesarios para el carrito
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
      .filter((item) => item !== null); // Filtramos los nulos (eliminados)

    return validatedItems;
  } catch (error) {
    console.error("Error validando carrito:", error);
    return [];
  }
}

// --- ACCIÓN 16: CONTAR TOTAL DE PRODUCTOS ---
export async function getProductsCount() {
  try {
    const coll = collection(db, "products");
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  } catch (error) {
    return 0;
  }
}

// --- ACCIÓN 11: OBTENER TODAS LAS CATEGORÍAS (Fijas + Dinámicas) ---
export async function getCategories() {
  try {
    const docRef = doc(db, "settings", "categories");
    const docSnap = await getDoc(docRef);
    const customCategories = docSnap.exists() ? (docSnap.data().list || []) : [];
    
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
    const docRef = doc(db, "settings", "tags");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data().list || []) : [];
  } catch (error) {
    return [];
  }
}

// --- ACCIÓN 12: ELIMINAR CATEGORÍA CUSTOM ---
export async function deleteCustomCategory(category: string) {
  await requireAdmin();
  try {
    const settingsRef = doc(db, "settings", "categories");
    await updateDoc(settingsRef, {
      list: arrayRemove(category)
    });
    revalidatePath("/admin/productos");
    return { success: true, message: "Categoría eliminada de la lista." };
  } catch (error) {
    return { success: false, message: "Error al eliminar categoría." };
  }
}

// --- ACCIÓN 13: RENOMBRAR CATEGORÍA (Y MIGRAR PRODUCTOS) ---
export async function renameCustomCategory(oldName: string, newName: string) {
  await requireAdmin();
  
  if (!newName.trim()) return { success: false, message: "El nombre no puede estar vacío." };
  if (oldName === newName) return { success: false, message: "El nombre es igual." };

  try {
    const settingsRef = doc(db, "settings", "categories");
    const batch = writeBatch(db);

    // 1. Actualizar lista de categorías (Quitamos la vieja)
    // Nota: Hacemos update separado para asegurar atomicidad en la lista
    await updateDoc(settingsRef, { list: arrayRemove(oldName) });
    
    // Si la nueva NO es fija, la agregamos (si es fija, solo migramos productos)
    if (!PRODUCT_CATEGORIES.includes(newName as any)) {
       await updateDoc(settingsRef, { list: arrayUnion(newName) });
    }

    // 2. Migrar productos en lote (Batch)
    const q = query(collection(db, "products"), where("category", "==", oldName));
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { category: newName });
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

// --- ACCIÓN 15: OBTENER PRODUCTOS TIENDA (Búsqueda Avanzada) ---
export async function getStoreProducts(filters: { 
  category?: string; 
  subCategory?: string; 
  tag?: string;
  search?: string;
  limitCount?: number;
} = {}) {
  try {
    const productsRef = collection(db, "products");
    const constraints: any[] = [where("isVisible", "==", true)];

    // Aplicamos filtros estrictos de base (Categoría, Subcategoría, Tag)
    // Esto optimiza la lectura en Firebase antes de filtrar en memoria
    if (filters.category) constraints.push(where("category", "==", filters.category));
    if (filters.subCategory) constraints.push(where("subCategory", "==", filters.subCategory));
    if (filters.tag) constraints.push(where("tags", "array-contains", filters.tag));

    // Si NO hay búsqueda, usamos el ordenamiento y límite de Firestore
    if (!filters.search) {
      constraints.push(orderBy("createdAt", "desc"));
      if (filters.limitCount) constraints.push(limit(filters.limitCount));
    }

    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // LÓGICA DE BÚSQUEDA PROFUNDA (In-Memory)
    // Filtramos por Nombre, SKU, Descripción, Categoría, Tags y Atributos (Color, Talle, etc.)
    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      
      products = products.filter((product: any) => {
        // Helper para verificar texto de forma segura
        const check = (val?: string) => val?.toLowerCase().includes(term);

        return (
          check(product.name) ||
          check(product.sku) ||
          check(product.description) ||
          check(product.category) ||
          check(product.subCategory) ||
          product.tags?.some((t: string) => check(t)) ||
          // Búsqueda en atributos dinámicos (ej: Color: Rojo, Talle: XL)
          (product.attributes && Object.values(product.attributes).some((v: any) => check(String(v))))
        );
      });
    }

    return products;
  } catch (error) {
    console.error("Error fetching store products:", error);
    
    // --- FALLBACK DE ORDENAMIENTO EN MEMORIA ---
    // Si falla el índice compuesto, traemos los productos filtrados (sin ordenar)
    // y los ordenamos aquí.
    try {
      const productsRef = collection(db, "products");
      const constraints: any[] = [where("isVisible", "==", true)];
      
      // Re-aplicamos filtros básicos que no requieren índice compuesto complejo
      if (filters.category) constraints.push(where("category", "==", filters.category));
      if (filters.subCategory) constraints.push(where("subCategory", "==", filters.subCategory));

      const q = query(productsRef, ...constraints);
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Ordenar por fecha (Más nuevo primero)
      return products.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch (fallbackError) {
      // Lanzamos el error para que error.tsx lo capture y muestre la UI de error
      throw new Error("Error crítico al cargar productos.");
    }
  }
}

// --- ACCIÓN 9: OBTENER PRODUCTOS ADMIN (Paginación y Búsqueda) ---
export async function getAdminProducts(
  cursorId?: string, 
  direction: 'next' | 'prev' = 'next', 
  searchTerm?: string,
  category?: string
) {
  try {
    const productsRef = collection(db, "products");
    let q;

    if (searchTerm) {
      // Búsqueda por nombre (Case sensitive en Firestore)
      // Ignoramos paginación compleja en búsqueda para simplificar UX
      const constraints: any[] = [
        orderBy("name"),
        startAt(searchTerm),
        endAt(searchTerm + "\uf8ff"),
        limit(50) // Límite de seguridad más amplio para búsquedas
      ];
      
      if (category) {
        constraints.unshift(where("category", "==", category));
      }
      
      q = query(productsRef, ...constraints);
    } else {
      // Consulta base por fecha
      const constraints: any[] = [orderBy("createdAt", "desc")];

      if (category) {
        constraints.unshift(where("category", "==", category));
      }

      if (cursorId) {
        const cursorDocRef = doc(db, "products", cursorId);
        const cursorSnap = await getDoc(cursorDocRef);

        if (cursorSnap.exists()) {
          if (direction === 'next') {
            constraints.push(startAfter(cursorSnap));
            constraints.push(limit(20));
          } else {
            // Para ir atrás, buscamos los que terminan antes del cursor actual
            constraints.push(endBefore(cursorSnap));
            constraints.push(limitToLast(20));
          }
        } else {
           constraints.push(limit(20)); // Fallback si el cursor no existe
        }
      } else {
        constraints.push(limit(20));
      }
      
      q = query(productsRef, ...constraints);
    }

    const snapshot = await getDocs(q);
    // Mapeamos los datos
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    return {
      products,
      firstId: products.length > 0 ? products[0].id : null,
      lastId: products.length > 0 ? products[products.length - 1].id : null
    };
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return { products: [], firstId: null, lastId: null };
  }
}

// --- ACCIÓN 10: VALIDAR FAVORITOS (Evitar Favoritos Fantasma) ---
export async function validateFavorites(ids: string[]) {
  if (!ids || ids.length === 0) return [];

  try {
    // Consultamos en paralelo para verificar existencia
    const docsSnap = await Promise.all(
      ids.map((id) => getDoc(doc(db, "products", id)))
    );

    const validProducts = docsSnap
      .map((snap) => {
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as any;
      })
      .filter((p) => p !== null);

    return validProducts;
  } catch (error) {
    console.error("Error validando favoritos:", error);
    return [];
  }
}
