export const ORDER_STATUSES = ['pending', 'payment_review', 'approved', 'shipped', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// --- USUARIO (ESTO ES LO QUE FALTABA) ---
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  profilePhoto?: string | null;
  phone?: string;
  defaultAddress?: string;
  dni?: string;
  age?: number;
  role?: 'admin' | 'user';
  createdAt?: string;
}

// --- FINANZAS ---
export interface PaymentTransaction {
  id: string;
  amount: number;
  date: string;
  note?: string;
  recordedBy: string;
}

// --- PRODUCTOS ---
export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  imageUrl?: string;
  category: string;
  subCategory?: string;
  tags?: string[];
  stock: number;
  attributes?: Record<string, string>;
  isVisible?: boolean;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// --- PEDIDOS ---
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  createdAt: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  guestInfo?: {
    email: string;
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
  
  // Datos del usuario registrado
  user?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };

  // --- FINANZAS Y PAGOS ---
  
  amountPaid: number;      // Obligatorio
  balance: number;         // Obligatorio
  paymentStatus: PaymentStatus;
  payments?: PaymentTransaction[];
  adminNote?: string;

  // --- COMPROBANTES (NUEVO Y VIEJO) ---
  
  // 1. Estructura nueva (la PRO que agregaste)
  paymentProof?: {
    url: string;
    type: string;
    amountClaimed: number;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  };

  // 2. Estructura Legacy (Agregá esto para que Vercel deje de fallar)
  receiptUrl?: string; 
  receiptStatus?: string;
  paymentProofUrl?: string; 
  paymentProofType?: 'image' | 'pdf';
}