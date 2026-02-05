import { getAdminDb } from "@/lib/firebase-admin";
import { unstable_cache } from "next/cache";
import { HomeConfig } from "@/lib/actions/settings";

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
export async function fetchHomeConfig(): Promise<HomeConfig | null> {
  try {
    const dbAdmin = getAdminDb();
    const docRef = dbAdmin.collection("settings").doc("home_config");
    const docSnap = await docRef.get();

    // CORRECCIÓN: .exists es una propiedad, no una función
    if (docSnap.exists) {
      return docSnap.data() as HomeConfig;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching home config:", error);
    return null;
  }
}

// --- CACHING LAYER ---
// Envolvemos la llamada a DB con unstable_cache para deduplicar y cachear entre requests.
export const getHomeConfig = unstable_cache(
  fetchHomeConfig,
  ["home-config"], // Key única para el cache
  { tags: ["home-config"] } // Tag para revalidación bajo demanda
);