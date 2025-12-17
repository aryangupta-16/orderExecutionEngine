import { processOrder, dexRouter } from '../queue/order.worker';
import { OrderRepository } from '../db/order.repository';
import { redis } from '../config/redis';
import { Job } from 'bullmq';

// Mock dependencies
jest.mock('bullmq');
jest.mock('../db/order.repository');
jest.mock('../dex/router'); // Automatic mock is fine if we just want the methods to be spies

jest.mock('../config/redis', () => ({
  redis: {
    publish: jest.fn(),
  },
}));

describe('Order Worker', () => {
  let mockJob: Partial<Job>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJob = {
      data: {
        orderId: 'order-123',
        inputToken: 'SOL',
        outputToken: 'USDC',
        amount: 1,
        slippage: 0.5,
        orderType: 'MARKET'
      }
    };
  });

  it('should process a successful order lifecycle', async () => {
    // Setup Router Mocks
    // Since dexRouter is a mock instance (because DexRouter class is mocked), its methods are jest.fn()
    (dexRouter.findBestRoute as jest.Mock).mockResolvedValue({
      dex: 'raydium',
      expectedOutput: 100,
      price: 100,
      fee: 0.003
    });
    (dexRouter.buildTransaction as jest.Mock).mockResolvedValue({
      dex: 'raydium',
      txPayload: 'tx-data'
    });
    (dexRouter.executeTransaction as jest.Mock).mockResolvedValue({
      txHash: 'tx-hash-123',
      executionPrice: 100
    });

    // Run the worker process
    await processOrder(mockJob as Job);

    // Verify Steps
    
    // 1. Routing
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'ROUTING');
    expect(redis.publish).toHaveBeenCalledWith('order_updates', expect.stringContaining('"status":"ROUTING"'));
    expect(dexRouter.findBestRoute).toHaveBeenCalled();

    // 2. Building
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'ROUTING', { dex: 'raydium' });
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'BUILDING');
    expect(redis.publish).toHaveBeenCalledWith('order_updates', expect.stringContaining('"status":"BUILDING"'));
    expect(dexRouter.buildTransaction).toHaveBeenCalled();

    // 3. Submitted
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'SUBMITTED');
    expect(redis.publish).toHaveBeenCalledWith('order_updates', expect.stringContaining('"status":"SUBMITTED"'));
    expect(dexRouter.executeTransaction).toHaveBeenCalled();

    // 4. Confirmed
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'CONFIRMED', expect.any(Object));
    expect(redis.publish).toHaveBeenCalledWith('order_updates', expect.stringContaining('"status":"CONFIRMED"'));
  });

  it('should handle errors and update status to FAILED', async () => {
    const error = new Error('Routing failed');
    (dexRouter.findBestRoute as jest.Mock).mockRejectedValue(error);

    await expect(processOrder(mockJob as Job)).rejects.toThrow('Routing failed');

    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'FAILED', { error: 'Routing failed' });
    expect(redis.publish).toHaveBeenCalledWith('order_updates', expect.stringContaining('"status":"FAILED"'));
  });
});
