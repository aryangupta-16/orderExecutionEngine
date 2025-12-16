// src/ws/ws.manager.ts
import { WebSocket } from "ws";

class WebSocketManager {
  private connections = new Map<string, WebSocket>();

  add(orderId: string, socket: WebSocket) {
    this.connections.set(orderId, socket);
  }

  remove(orderId: string) {
    this.connections.delete(orderId);
  }

  send(orderId: string, payload: any) {
    console.log("📤 Sending WS update", orderId, payload);
    const socket = this.connections.get(orderId);
    // console.log(socket);
    if (!socket) return;

    // ✅ Correct check
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
  }
}

export const wsManager = new WebSocketManager();
