// src/ws/ws.manager.ts
import { WebSocket } from "ws";

class WebSocketManager {
  private connections = new Map<string, WebSocket>();

  add(orderId: string, socket: WebSocket) {
    // console.log(socket,"socket in ws.manager add");
    this.connections.set(orderId, socket);
  }

  remove(orderId: string) {
    this.connections.delete(orderId);
  }

  send(orderId: string, payload: any) {
    // console.log("📤 Sending WS update", orderId, payload);
    const socket = this.connections.get(orderId);
    // console.log(socket,"socket in worker");
    if (!socket) return;

    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
  }
}

export const wsManager = new WebSocketManager();
