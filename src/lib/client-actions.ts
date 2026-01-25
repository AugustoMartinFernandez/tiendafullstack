import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

// Helper para parsear FormData a objeto plano
const parseProductFormData = (formData: FormData) => {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const category = formData.get("category") as string;
  const subCategory = formData.get("subCategory") as string;
  const sku = formData.get("sku") as string;
  const originalPrice = formData.get("originalPrice") ? Number(formData.get("originalPrice")) : 0;
  
  const images = formData.getAll("images") as string[];
  const tags = formData.getAll("tags") as string[];

  // Parsear atributos dinámicos (attr_Key)
  const attributes: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("attr_")) {
      const attrName = key.replace("attr_", "");
      attributes[attrName] = value as string;
    }
  }

  return {
    name,
    description,
    price,
    stock,
    category,
    subCategory,
    sku,
    originalPrice,
    images,
    tags,
    attributes,
    isVisible: true,
  };
};

export async function createProductClient(formData: FormData) {
  try {
    const productData = parseProductFormData(formData);
    
    await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating product:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function updateProductClient(id: string, formData: FormData) {
  try {
    const productRef = doc(db, "products", id);
    const updateData = parseProductFormData(formData);

    // 1. Obtener datos actuales para comparar imágenes y borrar las viejas
    const docSnap = await getDoc(productRef);
    if (docSnap.exists()) {
      const oldData = docSnap.data();
      const oldImages = (oldData.images as string[]) || [];
      const newImages = updateData.images;

      // Encontrar imágenes que estaban antes pero ya no están
      const imagesToDelete = oldImages.filter(url => !newImages.includes(url));

      // Borrar imágenes huérfanas de Storage (Best Practice)
      // Nota: Esto asume que la URL es de Firebase Storage y contiene el path
      await Promise.all(imagesToDelete.map(async (url) => {
        try {
          // Extraer referencia básica si es de nuestro storage
          if (url.includes("firebasestorage")) {
            const storageRef = ref(storage, url);
            await deleteObject(storageRef).catch(e => console.warn("No se pudo borrar imagen antigua:", e));
          }
        } catch (e) {
          console.warn("Error intentando borrar imagen:", url);
        }
      }));
    }

    // 2. Actualizar documento
    await updateDoc(productRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating product:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function deleteProductClient(id: string) {
  try {
    const productRef = doc(db, "products", id);
    
    // Opcional: Leer documento para borrar todas sus imágenes asociadas antes de borrar el doc
    const docSnap = await getDoc(productRef);
    if (docSnap.exists()) {
       const data = docSnap.data();
       if (data.images && Array.isArray(data.images)) {
         await Promise.all(data.images.map(async (url: string) => {
            if (url.includes("firebasestorage")) {
               const imgRef = ref(storage, url);
               await deleteObject(imgRef).catch(() => null);
            }
         }));
       }
    }

    await deleteDoc(productRef);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting product:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function toggleProductVisibilityClient(id: string, currentStatus: boolean) {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, {
      isVisible: !currentStatus 
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating visibility:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function duplicateProductClient(id: string) {
  try {
    const originalRef = doc(db, "products", id);
    const originalSnap = await getDoc(originalRef);
    if (!originalSnap.exists()) return { success: false, message: "Producto no encontrado." };
    
    const originalData = originalSnap.data();
    await addDoc(collection(db, "products"), {
      ...originalData,
      name: `${originalData.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error duplicating product:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" };
  }
}
