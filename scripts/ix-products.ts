import { getAdminDb } from "../src/lib/firebase-admin";
import * as dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

async function fixProducts() {
  console.log("🔧 Iniciando reparación de productos...");
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("products").get();
    
    if (snapshot.empty) {
      console.log("⚠️ No hay productos en la base de datos.");
      return;
    }

    console.log(`📦 Encontrados ${snapshot.size} productos. Verificando...`);
    
    const batch = db.batch();
    let updates = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      let needsUpdate = false;
      const updateData: any = {};

      // 1. Asegurar que sea visible
      if (data.isVisible === undefined) {
        updateData.isVisible = true;
        needsUpdate = true;
      }

      // 2. Asegurar que tenga fecha (para el ordenamiento)
      if (!data.createdAt) {
        updateData.createdAt = new Date().toISOString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(doc.ref, updateData);
        updates++;
      }
    });

    if (updates > 0) {
      await batch.commit();
      console.log(`✅ Se repararon ${updates} productos correctamente.`);
    } else {
      console.log("✨ Todos los productos ya estaban correctos.");
    }
    process.exit(0);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixProducts();
