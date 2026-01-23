import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";
import { EditProductForm } from "@/components/admin/edit-product-form";

// Esta función busca los datos viejos en el servidor antes de mostrar la página
async function getProduct(id: string) {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
}

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return <div>Producto no encontrado</div>;
  }

  return <EditProductForm key={product.id} product={product} />;
}