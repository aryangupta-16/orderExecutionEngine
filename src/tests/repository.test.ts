
import { OrderRepository } from '../db/order.repository';
import { prisma } from '../config/db';
import { OrderStatus } from '../../generated/prisma/client';

// Mock Prisma
jest.mock('../config/db', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('OrderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByIdempotencyKey', () => {
    it('should find an order by idempotency key', async () => {
      const mockOrder = { id: 'order-1', idempotencyKey: 'key-1' };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await OrderRepository.findByIdempotencyKey('key-1');

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey: 'key-1' },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should return null if not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await OrderRepository.findByIdempotencyKey('key-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const orderData = {
        idempotencyKey: 'key-1',
        inputToken: 'SOL',
        outputToken: 'USDC',
        amount: 1,
        slippage: 0.5,
        orderType: 'MARKET',
      };

      const mockCreatedOrder = {
        id: 'order-1',
        ...orderData,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.order.create as jest.Mock).mockResolvedValue(mockCreatedOrder);

      const result = await OrderRepository.create(orderData);

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          ...orderData,
          status: OrderStatus.PENDING,
        },
      });
      expect(result).toEqual(mockCreatedOrder);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockUpdatedOrder = { id: 'order-1', status: OrderStatus.ROUTING };
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await OrderRepository.updateStatus('order-1', OrderStatus.ROUTING);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.ROUTING },
      });
      expect(result).toEqual(mockUpdatedOrder);
    });

    it('should update order status with extra fields', async () => {
      const extra = { txHash: 'tx-123' };
      const mockUpdatedOrder = { id: 'order-1', status: OrderStatus.CONFIRMED, ...extra };
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await OrderRepository.updateStatus('order-1', OrderStatus.CONFIRMED, extra);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.CONFIRMED, ...extra },
      });
      expect(result).toEqual(mockUpdatedOrder);
    });
  });

  describe('findById', () => {
    it('should find an order by ID', async () => {
      const mockOrder = { id: 'order-1' };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await OrderRepository.findById('order-1');

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
      });
      expect(result).toEqual(mockOrder);
    });
  });
});
