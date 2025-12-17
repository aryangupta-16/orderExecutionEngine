import Fastify, { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { buildApp } from '../app';
import { OrderRepository } from '../db/order.repository';
import { orderQueue } from '../queue/order.queue';

// Mock dependencies
jest.mock('../db/order.repository');
jest.mock('../queue/order.queue');
jest.mock('../redis/redis.subscriber', () => ({})); // Mock subscriber to avoid connecting
jest.mock('ioredis', () => require('ioredis-mock')); // Mock Redis for Fastify session/etc if needed

describe('API Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock behavior: no existing order
    (OrderRepository.findByIdempotencyKey as jest.Mock).mockResolvedValue(null);
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await supertest(app.server).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /api/orders/execute', () => {
    const validOrder = {
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 1,
      slippage: 0.5,
      orderType: 'MARKET'
    };

    it('should create an order successfully', async () => {
      // Mock DB response
      (OrderRepository.create as jest.Mock).mockResolvedValue({
        id: 'order-123',
        ...validOrder,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock Queue response
      (orderQueue.add as jest.Mock).mockResolvedValue({ id: 'job-123' });

      const response = await supertest(app.server)
        .post('/api/orders/execute')
        .send(validOrder)
        .set('Idempotency-Key', 'unique-key-1');

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        orderId: 'order-123',
      }));
      expect(OrderRepository.create).toHaveBeenCalled();
      expect(orderQueue.add).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidOrder = {
        inputToken: 'SOL',
        // Missing outputToken and amount
      };

      const response = await supertest(app.server)
        .post('/api/orders/execute')
        .send(invalidOrder)
        .set('Idempotency-Key', 'unique-key-2');

      expect(response.status).toBe(400);
    });

    it('should handle idempotency key', async () => {
      // Logic for idempotency might be in the controller or middleware.
      // If the controller checks for existing order with same idempotency key:
      
      // Mock finding existing order
      (OrderRepository.findByIdempotencyKey as jest.Mock).mockResolvedValue({
        id: 'existing-order',
        status: 'PENDING'
      });

      const response = await supertest(app.server)
        .post('/api/orders/execute')
        .send(validOrder)
        .set('Idempotency-Key', 'duplicate-key');

      expect(response.status).toBe(200); // Should return existing order
      expect(response.body.id).toBe('existing-order');
      expect(OrderRepository.create).not.toHaveBeenCalled();
    });
    it('should return 500 if Idempotency-Key header is missing', async () => {
      const response = await supertest(app.server)
        .post('/api/orders/execute')
        .send(validOrder);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Idempotency-Key header is required");
    });

    it('should return 400 for invalid amount', async () => {
      const response = await supertest(app.server)
        .post('/api/orders/execute')
        .send({ ...validOrder, amount: -1 })
        .set('Idempotency-Key', 'key-amount');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Amount must be greater than 0");
    });

    it('should return 400 for invalid slippage', async () => {
      const response = await supertest(app.server)
        .post('/api/orders/execute')
        .send({ ...validOrder, slippage: 6 })
        .set('Idempotency-Key', 'key-slippage');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid slippage");
    });

    it('should handle internal server errors', async () => {
      (OrderRepository.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await supertest(app.server)
        .post('/api/orders/execute')
        .send(validOrder)
        .set('Idempotency-Key', 'key-error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to create order");
    });
  });
});
