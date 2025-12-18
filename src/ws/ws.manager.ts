// src/ws/ws.manager.ts
import { WebSocket } from "ws";
import { logger } from "../utils/logger";

class WebSocketManager {
  private connections = new Map<string, WebSocket>();

  add(orderId: string, socket: WebSocket) {
    this.connections.set(orderId, socket);
    logger.debug({ orderId }, "WebSocket connection added");
  }

  remove(orderId: string) {
    this.connections.delete(orderId);
    logger.debug({ orderId }, "WebSocket connection removed");
  }

  send(orderId: string, payload: any) {
    const socket = this.connections.get(orderId);
    if (!socket) return;

    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
    logger.debug({ orderId, payload }, "WebSocket update sent");
  }
}

export const wsManager = new WebSocketManager();
