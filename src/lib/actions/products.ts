"use server";

import { revalidatePath } from "next/cache";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { Product } from "@/lib/types";
import { requireAdmin } from "@/lib/auth-server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { FieldValue, DocumentSnapshot, Query } from "firebase-admin/firestore";
import { productSchema } from "@/lib/schemas";

// --- HELPER: MAPEO SEGURO DE FIRESTORE (TYPE-001) ---
function mapFirestoreDocToProduct(doc: DocumentSnapshot): Product {
  const data = doc.data();
  if (!data) throw new Error("Documento vacío");
  
  return {
    id: doc.id,
    name: data.name ?? "",
    price: Number(data.price) || 0,
    images: Array.isArray(data.images) ? data.images : [],
    category: data.category ?? "",
    stock: Number(data.stock) || 0,
    sku: data.sku ?? undefined,
    originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
    imageUrl: data.imageUrl ?? undefined,
    subCategory: data.subCategory ?? undefined,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
    attributes: data.attributes ?? undefined,
    isVisible: data.isVisible ?? true,
    description: data.description ?? undefined,
  };
}

// --- HELPER: GUARDAR CATEGORÍA CUSTOM ---
async function saveCustomCategory(category: string) {
  // Si ya está en las constantes, no hacemos nada
  if (PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) return;

  try {
    const dbAdmin = getAdminDb();
    const settingsRef = dbAdmin.collection("settings").doc("categories");
    await settingsRef.set({ list: FieldValue.arrayUnion(category) }, { merge: true });
  } catch (error) {
    console.error("Error guardando categoría:", error);
  }
}

// --- HELPER: GUARDAR TAGS CUSTOM ---
async function saveCustomTags(tags: string[]) {
  if (!tags || tags.length === 0) return;
  try {
    const dbAdmin = getAdminDb();
    const settingsRef = dbAdmin.collection("settings").doc("tags");
    await settingsRef.set({ list: FieldValue.arrayUnion(...tags) }, { merge: true });
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

// --- ACCIÓN 2: CREAR PRODUCTO NUEVO ---
export async function createProduct(formData: FormData) {
  try {
    await requireAdmin();
  } catch (error) {
    return { success: false, message: "No tienes permisos de administrador." };
  }

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
    const dbAdmin = getAdminDb();
    const querySnapshot = await dbAdmin.collection("products").where("sku", "==", sku).get();
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

    const dbAdmin = getAdminDb();
    await dbAdmin.collection("products").add({
      ...validation.data,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  await requireAdmin();

  const id = formData.get("id") as string;
  try {
    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("products").doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() || {};
      
      const imagesToDelete: string[] = [];
      if (Array.isArray(data.images)) imagesToDelete.push(...data.images);
      if (data.imageUrl) imagesToDelete.push(data.imageUrl);

      // Borrar imágenes usando Admin SDK Storage
      const bucket = getAdminStorage().bucket();
      
      await Promise.allSettled(
        imagesToDelete.map((url) => {
          try {
            // Extraer path de la URL de Firebase Storage
            // Formato: .../o/products%2Fcat%2Ffile.jpg?alt=...
            const urlObj = new URL(url);
            const path = decodeURIComponent(urlObj.pathname.split('/o/')[1]);
            return bucket.file(path).delete();
          } catch {
            return Promise.resolve();
          }
        })
      );
    }

    await docRef.delete();
    
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
  await requireAdmin();
  const id = formData.get("id") as string;
  const currentStatus = formData.get("currentStatus") === "true";
  
  try {
    const dbAdmin = getAdminDb();
    await dbAdmin.collection("products").doc(id).update({
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
  await requireAdmin();
  const id = formData.get("id") as string;
  try {
    const dbAdmin = getAdminDb();
    const originalRef = dbAdmin.collection("products").doc(id);
    const originalSnap = await originalRef.get();
    
    if (!originalSnap.exists) return { success: false, message: "Producto no encontrado." };
    
    const originalData = originalSnap.data() || {};
    await dbAdmin.collection("products").add({
      ...originalData,
      name: `${originalData.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  await requireAdmin();

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
    const dbAdmin = getAdminDb();
    const snapshot = await dbAdmin.collection("products").where("sku", "==", sku).get();
    const isDuplicate = snapshot.docs.some(doc => doc.id !== id);
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

    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("products").doc(id);
    await docRef.update({ ...validation.data, updatedAt: new Date().toISOString() });

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

// --- ACCIÓN 16: CONTAR TOTAL DE PRODUCTOS ---
export async function getProductsCount() {
  try {
    const dbAdmin = getAdminDb();
    const snapshot = await dbAdmin.collection("products").count().get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

// --- ACCIÓN 15: OBTENER PRODUCTOS TIENDA (Búsqueda Avanzada) ---
export async function getStoreProducts(filters: { 
  category?: string; 
  subCategory?: string; 
  tag?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  limitCount?: number;
} = {}) {
  try {
    const dbAdmin = getAdminDb();
    
    // Definimos el límite de lectura
    // Si limitCount es 0 o undefined, usamos un valor alto (ej: 200) para permitir paginación en memoria
    const dbReadLimit = filters.limitCount || 200;
    let products: Product[] = [];

    // ESTRATEGIA DE RECUPERACIÓN (FALLBACK)
    // Intentamos la consulta optimizada. Si falla por falta de índice, usamos una consulta simple.
    try {
      let q = dbAdmin.collection("products").where("isVisible", "==", true);

      // 1. Filtros Nativos
      if (filters.category) q = q.where("category", "==", filters.category);
      if (filters.subCategory) q = q.where("subCategory", "==", filters.subCategory);
      if (filters.tag) q = q.where("tags", "array-contains", filters.tag);

      // 2. Ordenamiento (Esto suele requerir índice compuesto)
      q = q.orderBy("createdAt", "desc");
      
      q = q.limit(dbReadLimit);

      const snapshot = await q.get();
      products = snapshot.docs.map(mapFirestoreDocToProduct);

    } catch (queryError: any) {
      // Si el error es por falta de índice (FAILED_PRECONDITION), usamos Plan B
      if (queryError.code === 9 || queryError.message?.includes("index")) {
        console.warn("⚠️ Índice faltante en Firestore. Usando ordenamiento en memoria (Plan B).");
        
        // Plan B: Consulta simple sin ordenamiento compuesto
        let q = dbAdmin.collection("products").where("isVisible", "==", true);
        if (filters.category) q = q.where("category", "==", filters.category);
        // Omitimos otros filtros complejos en DB para asegurar respuesta
        q = q.limit(dbReadLimit);
        
        const snapshot = await q.get();
        products = snapshot.docs.map(mapFirestoreDocToProduct);
        
        // Recuperamos las fechas reales del snapshot para ordenar correctamente
        const docsMap = new Map(snapshot.docs.map(d => [d.id, d.data().createdAt]));

        // Ordenamos manualmente en memoria (JavaScript)
        products.sort((a, b) => {
           const dateA = docsMap.get(a.id) || "1970-01-01";
           const dateB = docsMap.get(b.id) || "1970-01-01";
           return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
      } else {
        throw queryError; // Si es otro error (conexión, auth), lo lanzamos
      }
    }

    // Asegurar filtrado de subcategoría (necesario si se usó Plan B)
    if (filters.subCategory) {
      products = products.filter(p => p.subCategory === filters.subCategory);
    }

    // 3. Filtrado Profundo en Memoria (Búsqueda de texto y Precios)
    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      
      products = products.filter((product: Product) => {
        const check = (val?: string) => val?.toLowerCase().includes(term);

        return (
          check(product.name) ||
          check(product.sku) ||
          check(product.description) ||
          check(product.category) ||
          check(product.subCategory) ||
          product.tags?.some((t: string) => check(t)) ||
          (product.attributes && Object.values(product.attributes).some((v: string) => check(String(v))))
        );
      });
    }

    // Filtro de Precios
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      products = products.filter(p => p.price >= (filters.minPrice as number));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      products = products.filter(p => p.price <= (filters.maxPrice as number));
    }

    // Si se solicitó un límite de salida específico (ej: sugerencias), recortamos ahora
    if (filters.limitCount && products.length > filters.limitCount) {
      products = products.slice(0, filters.limitCount);
    }

    return products;
  } catch (error) {
    console.error("Error fetching store products:", error);
    // Fallback silencioso en caso de error crítico
    return [];
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
    const dbAdmin = getAdminDb();
    let q: Query = dbAdmin.collection("products");
    let needsInMemorySort = false;

    if (searchTerm) {
      // Búsqueda por nombre (Case sensitive en Firestore)
      // ESTRATEGIA: Priorizamos la búsqueda por índice 'name' y filtramos categoría en memoria
      // Esto evita necesitar un índice compuesto (category + name)
      q = q.orderBy("name")
           .startAt(searchTerm)
           .endAt(searchTerm + "\uf8ff")
           .limit(50);

      // Nota: No aplicamos .where("category") aquí para no romper el índice de búsqueda
    } else {
      // Sin búsqueda (Listado normal)
      if (category) {
        // Si hay categoría, filtramos por ella pero QUITAMOS el ordenamiento por fecha
        // Esto evita el error "The query requires an index" (category + createdAt)
        q = q.where("category", "==", category);
        needsInMemorySort = true; // Ordenaremos en JS
      } else {
        // Si no hay filtros, el ordenamiento por defecto funciona bien con el índice nativo
        q = q.orderBy("createdAt", "desc");
      }

      if (cursorId) {
        const cursorSnap = await dbAdmin.collection("products").doc(cursorId).get();

        if (cursorSnap.exists) {
          if (direction === 'next') {
            q = q.startAfter(cursorSnap).limit(20);
          } else {
            // Para ir atrás, buscamos los que terminan antes del cursor actual
            q = q.endBefore(cursorSnap).limitToLast(20);
          }
        } else {
           q = q.limit(20); // Fallback si el cursor no existe
        }
      } else {
        q = q.limit(20);
      }
    }

    const snapshot = await q.get();
    // Mapeamos los datos
    let products = snapshot.docs.map(mapFirestoreDocToProduct);

    // 1. FILTRADO EN MEMORIA (Solo si hay búsqueda + categoría)
    if (searchTerm && category) {
      products = products.filter(p => p.category === category);
    }

    // 2. ORDENAMIENTO EN MEMORIA (Solo si filtramos por categoría sin búsqueda)
    if (needsInMemorySort) {
      // Recuperamos la fecha del snapshot original ya que mapFirestoreDocToProduct no siempre la trae
      const docsMap = new Map(snapshot.docs.map(d => [d.id, d.data().createdAt]));
      
      products.sort((a, b) => {
        const dateA = docsMap.get(a.id) || "";
        const dateB = docsMap.get(b.id) || "";
        return dateB.localeCompare(dateA); // Descendente (más nuevo primero)
      });
    }

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
    const dbAdmin = getAdminDb();
    const docsSnap = await Promise.all(
      ids.map((id) => dbAdmin.collection("products").doc(id).get())
    );

    const validProducts = docsSnap
      .map((snap) => {
        if (!snap.exists) return null;
        return mapFirestoreDocToProduct(snap);
      })
      .filter((p): p is Product => p !== null);

    return validProducts;
  } catch (error) {
    console.error("Error validando favoritos:", error);
    return [];
  }
}