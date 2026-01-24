export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number; // <--- AGREGAR ESTO (El signo ? es porque es opcional)
  images: string[]; 
  /** @deprecated Usar getProductImage() o getProductImages() en su lugar */
  imageUrl?: string;
  category: string;
  subCategory?: string; // Nueva jerarquía
  tags?: string[]; // Sistema de etiquetas
  stock: number;
  attributes?: Record<string, string>; 
  isVisible?: boolean;
  description?: string;
}