import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Definimos qué datos tiene tu Home
export interface HomeConfig {
  hero: {
    title: string;
    subtitle: string;
    badgeText: string;
    buttonText: string;
    buttonUrl: string;
    imageUrl: string;
  };
  // Acá agregaremos más secciones después (FAQ, Nosotros, etc.)
}

// Configuración por defecto (por si la base de datos está vacía)
const DEFAULT_CONFIG: HomeConfig = {
  hero: {
    title: "Título de tu Tienda",
    subtitle: "Descripción corta de tu negocio para atraer clientes.",
    badgeText: "Nueva Colección",
    buttonText: "Ver Productos",
    buttonUrl: "/tienda",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
  },
};

// Función para obtener la configuración
export async function getHomeConfig(): Promise<HomeConfig> {
  try {
    const docRef = doc(db, "settings", "home_config"); // Colección: settings, Documento: home_config
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as HomeConfig;
    } else {
      // Si no existe, creamos la configuración por defecto automáticamente
      await setDoc(docRef, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error("Error leyendo configuración:", error);
    return DEFAULT_CONFIG;
  }
}