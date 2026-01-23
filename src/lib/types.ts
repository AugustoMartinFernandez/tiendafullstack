export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number; // <--- AGREGAR ESTO (El signo ? es porque es opcional)
  images: string[]; 
  imageUrl?: string;
  category: string;
  subCategory?: string; // Nueva jerarquía
  stock: number;
  attributes?: Record<string, string>; 
  isVisible?: boolean;
  description?: string;
}