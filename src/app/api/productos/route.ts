// src/app/api/productos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { productSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { PRODUCT_CATEGORIES } from "@/lib/constants";



// Helper para generar SKU (Replicado para la API)
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

// --- POST: CREAR PRODUCTO ---
export async function POST(req: NextRequest) {
  try {
    // 1. Seguridad: Solo Admins
    await requireAdmin();

    const formData = await req.formData();
    
    // 2. Procesar Atributos Dinámicos
    const attributes: Record<string, string> = {};
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("attr_") && value) {
        const attrName = key.replace("attr_", "").trim();
        attributes[attrName] = value as string;
      }
    }

    // 3. Generar/Validar SKU
    let sku = formData.get("sku") ? (formData.get("sku") as string).trim() : "";
    if (!sku) {
      const name = formData.get("name") as string;
      if (name) sku = generateAutoSku(name);
    }

    const dbAdmin = getAdminDb();
    
    // Verificar SKU duplicado
    if (sku) {
      const querySnapshot = await dbAdmin.collection("products").where("sku", "==", sku).get();
      if (!querySnapshot.empty) {
        return NextResponse.json({ success: false, message: `El SKU "${sku}" ya existe.` }, { status: 400 });
      }
    }

    // 4. Preparar Datos
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
      attributes,
    };

    // 5. Validar con Zod
    const validation = productSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    // 6. Guardar en Firestore (Admin SDK)
    // Guardar categoría custom si aplica
    if (!PRODUCT_CATEGORIES.includes(validation.data.category as any)) {
       await dbAdmin.collection("settings").doc("categories").set({ 
         list: FieldValue.arrayUnion(validation.data.category) 
       }, { merge: true });
    }

    // Guardar tags
    if (validation.data.tags && validation.data.tags.length > 0) {
      await dbAdmin.collection("settings").doc("tags").set({ 
        list: FieldValue.arrayUnion(...validation.data.tags) 
      }, { merge: true });
    }

    const docRef = await dbAdmin.collection("products").add({
      ...validation.data,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 7. Revalidar caché
    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");

    return NextResponse.json({ success: true, id: docRef.id, message: "Producto creado correctamente." });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: "Error interno del servidor." }, { status: 500 });
  }
}

// --- PUT: ACTUALIZAR PRODUCTO ---
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const id = formData.get("id") as string;

    if (!id) return NextResponse.json({ success: false, message: "ID requerido." }, { status: 400 });

    // Procesar atributos y datos (similar a POST)
    const attributes: Record<string, string> = {};
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("attr_") && value) {
        attributes[key.replace("attr_", "").trim()] = value as string;
      }
    }

    const rawData = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      originalPrice: Number(formData.get("originalPrice")) || 0,
      category: formData.get("category"),
      subCategory: formData.get("subCategory"),
      stock: Number(formData.get("stock")),
      tags: formData.getAll("tags"),
      images: formData.getAll("images"),
      attributes,
    };

    const validation = productSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const dbAdmin = getAdminDb();
    await dbAdmin.collection("products").doc(id).update({
      ...validation.data,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");

    return NextResponse.json({ success: true, message: "Producto actualizado." });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al actualizar." }, { status: 500 });
  }
}

// --- DELETE: ELIMINAR PRODUCTO ---
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "ID requerido." }, { status: 400 });

    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("products").doc(id);
    
    // Opcional: Borrar imágenes asociadas (Lógica simplificada)
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data?.images && Array.isArray(data.images)) {
        const bucket = getAdminStorage().bucket();
        // Intentar borrar imágenes en background sin bloquear respuesta
        Promise.allSettled(data.images.map((url: string) => {
            try {
                if(url.includes(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!)) {
                    const path = decodeURIComponent(new URL(url).pathname.split('/o/')[1]);
                    return bucket.file(path).delete();
                }
            } catch {}
        }));
      }
    }

    await docRef.delete();

    revalidatePath("/");
    revalidatePath("/tienda");
    revalidatePath("/admin/productos");

    return NextResponse.json({ success: true, message: "Producto eliminado." });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al eliminar." }, { status: 500 });
  }
}
