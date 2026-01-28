export const ORDER_STATUSES = ['pending', 'payment_review', 'approved', 'shipped', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface PaymentTransaction {
  id: string;
  amount: number;
  date: string;
  note?: string;
  recordedBy: string;
}

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
  // Datos del usuario registrado (opcional, para visualización híbrida)
  user?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  // Campos Financieros y de Auditoría
  paymentProofUrl?: string;
  paymentProofType?: 'image' | 'pdf';
  paymentProof?: {
    url: string;
    type: string;
    amountClaimed: number;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  };
  adminNote?: string;
  amountPaid: number;      // Obligatorio para cuenta corriente
  balance: number;         // Obligatorio: total - amountPaid
  paymentStatus: PaymentStatus;
  payments?: PaymentTransaction[];
}