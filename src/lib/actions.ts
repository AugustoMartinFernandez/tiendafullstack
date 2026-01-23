"use server";

import { db, storage } from "./firebase";
import { doc, updateDoc, collection, addDoc, deleteDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- HELPER: GENERAR SKU AUTOMÁTICO ---
function generateAutoSku(name: string) {
  const cleanName = name
    .normalize("NFD") // Descompone caracteres (ej: é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .replace(/[^a-zA-Z0-9]/g, "") // Elimina símbolos raros
    .toUpperCase();
  
  const prefix = cleanName.substring(0, 6) || "PROD";
  const random = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
  return `${prefix}-${random}`;
}

const forbiddenWords = ["prohibido", "ofensivo", "spam", "groseria"]; // Lista de palabras prohibidas

// --- ESQUEMA DE VALIDACIÓN (ZOD) ---
const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  sku: z.string().optional(),
  description: z.string().max(500, "La descripción no puede superar los 500 caracteres.").optional().refine((val) => {
    if (!val) return true; // Si no hay descripción, es válido
    const lowerVal = val.toLowerCase();
    return !forbiddenWords.some(word => lowerVal.includes(word));
  }, { message: "La descripción contiene palabras prohibidas u ofensivas." }),
  price: z.number().min(0, "El precio no puede ser negativo."),
  originalPrice: z.number().min(0).optional(),
  category: z.string().min(1, "La categoría es obligatoria."),
  subCategory: z.string().optional(),
  stock: z.number().int("El stock debe ser entero").min(0, "El stock no puede ser negativo.").max(1000, "El stock no puede ser mayor a 1000 unidades."),
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

// --- ACCIÓN 2: CREAR PRODUCTO NUEVO (Soporta Galería) ---
export async function createProduct(formData: FormData) {
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
  
  // Si está vacío, generamos uno automáticamente
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

  // Ordenar atributos alfabéticamente
  const sortedAttributes = Object.keys(attributes)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = attributes[key];
      return acc;
    }, {} as Record<string, string>);

  // 2. Preparar objeto para validación
  const rawData = {
    name: formData.get("name") ?? "",
    sku,
    description: formData.get("description") ?? "",
    price: Number(formData.get("price")),
    originalPrice: formData.get("originalPrice") ? Number(formData.get("originalPrice")) : 0,
    category: formData.get("category") ?? "",
    subCategory: formData.get("subCategory") ?? "",
    stock: Number(formData.get("stock")),
    images: formData.getAll("images"),
    attributes: sortedAttributes,
  };

  // 3. Validar con Zod
  const validation = productSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  try {
    await addDoc(collection(db, "products"), {
      ...validation.data, // Usamos los datos ya validados y limpios
      isVisible: true,
      createdAt: new Date().toISOString(),
    });

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
  const id = formData.get("id") as string;
  try {
    // 1. Obtener datos del producto antes de borrar para saber qué imágenes eliminar
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Recopilamos todas las imágenes (array nuevo y string viejo por compatibilidad)
      const imagesToDelete: string[] = [];
      if (Array.isArray(data.images)) imagesToDelete.push(...data.images);
      if (data.imageUrl) imagesToDelete.push(data.imageUrl);

      // 2. Eliminar archivos de Storage en paralelo
      // Usamos allSettled para que si una falla (ej: ya no existe), no detenga el resto del proceso
      await Promise.allSettled(
        imagesToDelete.map((url) => {
          // ref() acepta la URL completa de descarga de Firebase
          const fileRef = ref(storage, url);
          return deleteObject(fileRef);
        })
      );
    }

    // 3. Eliminar el documento de la base de datos
    await deleteDoc(docRef);
    
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");
    return { success: true, message: "Producto eliminado correctamente." };
  } catch (error) {
    console.error("Error eliminando:", error);
    return { success: false, message: "Error al eliminar." };
  }
}

// --- ACCIÓN 4: CAMBIAR VISIBILIDAD (Ocultar/Mostrar) ---
export async function toggleProductVisibility(formData: FormData) {
  const id = formData.get("id") as string;
  const currentStatus = formData.get("currentStatus") === "true";
  
  try {
    await updateDoc(doc(db, "products", id), {
      isVisible: !currentStatus 
    });
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

    revalidatePath("/tienda");
    revalidatePath("/admin/productos");
    return { success: true, message: "Producto duplicado con éxito." };
  } catch (error) {
    console.error("Error duplicando:", error);
    return { success: false, message: "Error al duplicar." };
  }
}

// --- ACCIÓN 6: EDITAR PRODUCTO EXISTENTE (Soporta Galería) ---
export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { success: false, message: "ID del producto no encontrado." };

  // 1. Extraer atributos
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

  // VALIDACIÓN DE SKU ÚNICO (Excluyendo el producto actual)
  let sku = formData.get("sku") ? (formData.get("sku") as string).trim() : "";
  
  // Si está vacío, generamos uno automáticamente
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

  // Ordenar atributos alfabéticamente
  const sortedAttributes = Object.keys(attributes)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = attributes[key];
      return acc;
    }, {} as Record<string, string>);

  // 2. Preparar datos
  const rawData = {
    name: formData.get("name") ?? "",
    sku,
    description: formData.get("description") ?? "",
    price: Number(formData.get("price")),
    originalPrice: formData.get("originalPrice") ? Number(formData.get("originalPrice")) : 0,
    category: formData.get("category") ?? "",
    subCategory: formData.get("subCategory") ?? "",
    stock: Number(formData.get("stock")),
    images: formData.getAll("images"),
    attributes: sortedAttributes,
  };

  // 3. Validar
  const validation = productSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, validation.data);

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