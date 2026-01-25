import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getAllOrders, updateOrderStatus } from '../lib/order-service';
import { getDocs, doc, updateDoc } from 'firebase/firestore';

// --- Mocks globales de Firebase ---
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    writeBatch: vi.fn(),
    where: vi.fn(),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
  };
});

// Mock de db vacío
vi.mock('@/lib/firebase', () => ({ db: {} }));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllOrders should return orders and pagination info', async () => {
    // Mock docs
    const mockDocs = [
      { id: '1', data: () => ({ total: 100, createdAt: '2026-01-24T00:00:00Z', userId: 'u1', items: [] }) },
      { id: '2', data: () => ({ total: 200, createdAt: '2026-01-24T01:00:00Z', userId: 'u2', items: [] }) },
    ];

    (getDocs as unknown as Mock).mockResolvedValue({ docs: mockDocs });

    const result = await getAllOrders();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].total).toBe(200);
  });

  it('updateOrderStatus should update document status', async () => {
    (updateDoc as unknown as Mock).mockResolvedValue(undefined);
    (doc as unknown as Mock).mockReturnValue({ id: 'mock-ref' });

    const result = await updateOrderStatus('order-123', 'approved');

    expect(result.success).toBe(true);
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'approved' });
  });

  it('getUserOrders should return only user orders', async () => {
    const mockDocs = [
      { id: 'o1', data: () => ({ total: 100, createdAt: '2026-01-24T00:00:00Z', userId: 'user123', items: [] }) },
      { id: 'o2', data: () => ({ total: 200, createdAt: '2026-01-24T01:00:00Z', userId: 'user123', items: [] }) },
    ];

    (getDocs as unknown as Mock).mockResolvedValue({ docs: mockDocs });

    const orders = await import('../lib/order-service').then(mod => mod.getUserOrders('user123'));

    expect(orders).toHaveLength(2);
    expect(orders[0].userId).toBe('user123');
  });
});
