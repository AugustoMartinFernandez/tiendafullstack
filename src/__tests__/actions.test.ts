import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { updateOrderStatus } from '../lib/actions';
import { getAdminDb } from '../lib/firebase-admin';
import { requireAdmin } from '../lib/auth-server';

// Mocks
vi.mock('../lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
  getAdminStorage: vi.fn(),
}));

vi.mock('../lib/auth-server', () => ({
  requireAdmin: vi.fn(),
}));

// Mock de revalidatePath para que no rompa
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Server Actions - updateOrderStatus', () => {
  const mockUpdate = vi.fn();
  const mockGet = vi.fn();
  const mockDoc = vi.fn(() => ({
    get: mockGet,
    update: mockUpdate,
  }));
  const mockCollection = vi.fn(() => ({
    doc: mockDoc,
  }));
  const mockDb = {
    collection: mockCollection,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getAdminDb as Mock).mockReturnValue(mockDb);
    (requireAdmin as Mock).mockResolvedValue({ email: 'admin@test.com', role: 'admin' });
  });

  it('should update status successfully when order exists and transition is valid', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: 'pending' }),
    });

    const result = await updateOrderStatus('order-123', 'approved');

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'approved',
      updatedBy: 'admin@test.com'
    }));
  });

  it('should return false when order does not exist', async () => {
    mockGet.mockResolvedValue({
      exists: false,
    });

    const result = await updateOrderStatus('order-123', 'approved');

    expect(result.success).toBe(false);
    expect(result.message).toContain('no existe');
  });

  it('should return false when transition is invalid (approved -> cancelled)', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: 'approved' }),
    });

    const result = await updateOrderStatus('order-123', 'cancelled');

    expect(result.success).toBe(false);
    expect(result.message).toContain('No se puede modificar');
  });
});
