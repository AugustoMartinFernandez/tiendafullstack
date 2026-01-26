import admin from "firebase-admin";

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
  });

  console.log("✅ Firebase Admin inicializado correctamente.");
}

export const getAdminAuth = () => admin.auth();
export const getAdminDb = () => admin.firestore();
export const getAdminStorage = () => admin.storage();
