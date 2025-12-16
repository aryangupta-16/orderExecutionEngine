// src/api/orders/orders.routes.ts
import { FastifyInstance } from "fastify";
import { createOrderController } from "./orders.controller";
import { orderWebSocketHandler } from "./orders.ws";

export async function ordersRoutes(app: FastifyInstance) {
  /**
   * HTTP: Submit order
   */
  app.post("/execute", createOrderController);

  /**
   * WebSocket: Stream order updates
   * Same endpoint, different protocol
   */
  app.get(
    "/execute",
    { websocket: true },
    orderWebSocketHandler
  );
}
