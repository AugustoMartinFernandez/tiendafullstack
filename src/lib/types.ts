export const ORDER_STATUSES = ['pending', 'approved', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

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
  dni?: string;
  age?: number;
}

export interface Order {
  id: string;
  userId: string | null; // Null para invitados
  date: string;
  total: number;
  status: OrderStatus;
  items: Record<string, unknown>[];
  guestInfo?: { // Datos para contacto si es invitado
    email: string;
    name: string;
    phone: string;
  };
  receiptUrl?: string;
  receiptStatus?: string;
}