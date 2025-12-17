import { wsManager } from '../ws/ws.manager';
import { WebSocket } from 'ws';
import { orderWebSocketHandler } from '../api/orders/orders.ws';
import { FastifyRequest } from 'fastify';
import { OrderRepository } from '../db/order.repository';

// Mock WebSocket
const mockWs = {
  readyState: WebSocket.OPEN,
  send: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
} as unknown as WebSocket;

// Mock OrderRepository
jest.mock('../db/order.repository');

describe('WebSocket Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset manager state
    (wsManager as any).connections.clear();
  });

  it('should add a connection', () => {
    wsManager.add('order-1', mockWs);
    expect((wsManager as any).connections.get('order-1')).toBe(mockWs);
  });

  it('should remove a connection', () => {
    wsManager.add('order-1', mockWs);
    wsManager.remove('order-1');
    expect((wsManager as any).connections.has('order-1')).toBe(false);
  });

  it('should send a message to an active connection', () => {
    wsManager.add('order-1', mockWs);
    const payload = { status: 'ROUTING' };
    wsManager.send('order-1', payload);

    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(payload));
  });

  it('should not send if connection does not exist', () => {
    wsManager.send('non-existent', { status: 'test' });
    expect(mockWs.send).not.toHaveBeenCalled();
  });

  it('should not send if socket is not OPEN', () => {
    const closedWs = {
      ...mockWs,
      readyState: WebSocket.CLOSED
    } as unknown as WebSocket;

    wsManager.add('order-closed', closedWs);
    wsManager.send('order-closed', { status: 'test' });
    expect(closedWs.send).not.toHaveBeenCalled();
  });
});

describe('Order WebSocket Handler', () => {
  let mockRequest: FastifyRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    (wsManager as any).connections.clear();
    mockRequest = {
      query: { orderId: 'order-1' }
    } as unknown as FastifyRequest;
  });

  it('should register connection and send current status if order exists', async () => {
    const mockOrder = {
      id: 'order-1',
      status: 'PENDING',
      txHash: null,
      executionPrice: null,
      error: null
    };
    (OrderRepository.findById as jest.Mock).mockResolvedValue(mockOrder);
    
    // Spy on wsManager.add
    const addSpy = jest.spyOn(wsManager, 'add');
    const sendSpy = jest.spyOn(wsManager, 'send');

    await orderWebSocketHandler(mockWs, mockRequest);

    expect(addSpy).toHaveBeenCalledWith('order-1', mockWs);
    expect(OrderRepository.findById).toHaveBeenCalledWith('order-1');
    expect(sendSpy).toHaveBeenCalledWith('order-1', {
      status: 'PENDING',
      txHash: null,
      executionPrice: null,
      error: null
    });
  });

  it('should not register if orderId is missing', async () => {
    mockRequest.query = {};
    const addSpy = jest.spyOn(wsManager, 'add');

    await orderWebSocketHandler(mockWs, mockRequest);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('should handle socket close', async () => {
    (OrderRepository.findById as jest.Mock).mockResolvedValue({ id: 'order-1', status: 'PENDING' });
    
    await orderWebSocketHandler(mockWs, mockRequest);

    expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));

    // Simulate close
    const closeCallback = (mockWs.on as jest.Mock).mock.calls.find(call => call[0] === 'close')[1];
    
    const removeSpy = jest.spyOn(wsManager, 'remove');
    closeCallback();

    expect(removeSpy).toHaveBeenCalledWith('order-1');
  });
});
