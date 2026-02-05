import * as admin from "firebase-admin";

// Inicializar Admin SDK si no está inicializado
if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!serviceAccountBase64) {
    throw new Error("❌ Variable FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 no definida en .env.local");
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, 
  });

  console.log("✅ Firebase Admin inicializado correctamente.");
}

// Exportamos la instancia directa (existente)
export const authAdmin = admin.auth();

// 👇 ESTA ES LA LÍNEA NUEVA QUE NECESITAS PARA CORREGIR EL ERROR DEL BUILD
export const getAdminAuth = () => admin.auth(); 

// Exportaciones existentes
export const getAdminDb = () => admin.firestore();
export const getAdminStorage = () => admin.storage();

export default admin;