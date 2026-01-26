import { getAdminAuth } from "../src/lib/firebase-admin";
import * as dotenv from "dotenv";

// Cargar variables de entorno locales
dotenv.config({ path: ".env.local" });

const email = process.argv[2];

if (!email) {
  console.error("❌ Error: Debes indicar el email del usuario.");
  console.error("👉 Uso: npx ts-node scripts/set-admin.ts tu@email.com");
  process.exit(1);
}

async function setAdmin() {
  try {
    const auth = getAdminAuth();
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role: "admin" });
    console.log(`✅ ¡Listo! El usuario ${email} ahora es ADMIN.`);
    console.log("⚠️  IMPORTANTE: Cierra sesión y vuelve a entrar para que surta efecto.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setAdmin();