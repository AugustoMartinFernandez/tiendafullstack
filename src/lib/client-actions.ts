import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductVisibility, 
  duplicateProduct 
} from "@/lib/actions/products";

// --- BRIDGE PATTERN IMPLEMENTATION ---
// Este archivo actúa como un puente hacia las Server Actions.
// Ya no usa el SDK de Cliente de Firebase directamente.
// Esto asegura que Next.js revalide la caché (revalidatePath) correctamente.

export async function createProductClient(formData: FormData) {
  // Llamada directa al Server Action
  return await createProduct(formData);
}

export async function updateProductClient(id: string, formData: FormData) {
  // Inyectamos el ID en el FormData para que la Server Action lo reciba
  // ya que updateProduct espera el ID dentro del FormData
  formData.set("id", id);
  return await updateProduct(formData);
}

export async function deleteProductClient(id: string) {
  // Convertimos el argumento simple a FormData
  const formData = new FormData();
  formData.append("id", id);
  return await deleteProduct(formData);
}

export async function toggleProductVisibilityClient(id: string, currentStatus: boolean) {
  const formData = new FormData();
  formData.append("id", id);
  // Convertimos el booleano a string para FormData
  formData.append("currentStatus", String(currentStatus));
  return await toggleProductVisibility(formData);
}

export async function duplicateProductClient(id: string) {
  const formData = new FormData();
  formData.append("id", id);
  return await duplicateProduct(formData);
}
