// scripts/check-admin.ts
import "dotenv/config"; // Carga .env.local automáticamente
import { getAdminAuth } from "../src/lib/firebase-admin.js"; // Import correcto para ts-node

async function checkAdmin() {
  console.log("🔍 Verificando Firebase Admin SDK...");

  try {
    const auth = getAdminAuth();
    const listUsersResult = await auth.listUsers(1); // Solo 1 usuario para test
    console.log("✅ Conexión exitosa con Firebase Admin.");
    console.log(`Usuarios encontrados: ${listUsersResult.users.length > 0 ? "Sí" : "0"}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error conectando con Firebase Admin:", error);
    process.exit(1);
  }
}

checkAdmin();
