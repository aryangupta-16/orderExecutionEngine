// src/api/orders/orders.ws.ts
import { WebSocket } from "ws";
import { FastifyRequest } from "fastify";
import { wsManager } from "../../ws/ws.manager";
import { OrderRepository } from "../../db/order.repository";

export async function orderWebSocketHandler(
  connection: WebSocket,
  request: FastifyRequest
) {
  const { orderId } = request.query as { orderId?: string };

  if (!orderId) return;

  const socket = connection;
  if (!socket) return;

  // Register socket
  wsManager.add(orderId, socket);

  // Fetch latest order status from DB
  const order = await OrderRepository.findById(orderId);
  if (order) {
    wsManager.send(orderId, {
      status: order.status,
      txHash: order.txHash,
      executionPrice: order.executionPrice,
      error: order.error,
    });
  } else {
    // If order not found, send initial pending message
    wsManager.send(orderId, {
      status: "pending",
      message: "Order received and queued",
    });
  }

  // Cleanup on disconnect
  socket.on("close", () => {
    wsManager.remove(orderId);
  });
}
