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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  profilePhoto?: string;
  defaultAddress?: string;
}

export interface Order {
  id: string;
  userId: string | null; // Null para invitados
  date: string;
  total: number;
  status: 'pending' | 'approved' | 'cancelled';
  items: Record<string, unknown>[];
  guestInfo?: { // Datos para contacto si es invitado
    email: string;
    name: string;
    phone: string;
  };
}