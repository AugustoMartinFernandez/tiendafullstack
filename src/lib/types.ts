export const ORDER_STATUSES = ['pending', 'payment_review', 'approved', 'shipped', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// --- OBSERVABILIDAD (PASO 3) ---
export type OrderEventType = 'STATUS_CHANGE' | 'PAYMENT_ADDED' | 'CANCELLED' | 'ADMIN_MESSAGE';

export interface OrderEvent {
  id?: string;
  orderId: string;
  type: OrderEventType;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy: string; // email o 'system'
}

// --- NOTIFICACIONES (PASO 4) ---
export interface UserNotification {
  id: string;
  userId: string | null;
  orderId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// --- COMPROBANTES DE PAGO ---
export interface PaymentProof {
  id: string;
  url: string;
  type: 'image' | 'pdf';
  uploadedAt: string;
  uploadedBy: string; // userId o 'guest'
  status: 'pending_review' | 'approved' | 'rejected';
  amountClaimed?: number;
}

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
  notificationsOptIn?: boolean; // Flag para WhatsApp/Push
  internalNote?: string; // Notas internas del admin (CRM)
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
  clientOrderId?: string; // ID de idempotencia
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

  // --- COMPROBANTES ---
  paymentProofs?: PaymentProof[]; // Array oficial
  
  // Legacy (Mantener para no romper UI vieja si existe)
  receiptUrl?: string; 
  receiptStatus?: string;
  paymentProofUrl?: string; 
  paymentProofType?: 'image' | 'pdf';
}

export interface ShopBanner {
  isActive: boolean;
  title: string;
  description: string;
  backgroundColor: string; // Hex color o clase tailwind
  textColor: string;       // Hex color
  buttonText?: string;     // Opcional: Texto del botón (Ej: "Ver Oferta")
  buttonLink?: string;     // Opcional: Link (Ej: "/tienda?category=Ofertas")
}