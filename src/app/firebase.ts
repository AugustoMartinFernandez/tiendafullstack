import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase (Singleton para evitar reinicializaciones en hot-reload)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function getHomeConfig() {
  try {
    const docRef = doc(db, "config", "home");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as any;
    } else {
      // Configuración por defecto si no existe el documento en la DB
      const defaultConfig = {
        hero: {
          badgeText: "Nueva Colección",
          title: "Mi Tienda Pro",
          subtitle: "Descubrí las últimas tendencias con la mejor calidad.",
          buttonText: "Ver Productos",
          buttonUrl: "/tienda",
          imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80",
        },
      };
      // Guardamos estos datos por defecto para que la próxima vez se lean de la DB
      await setDoc(docRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error("Error al obtener config:", error);
    throw error;
  }
}