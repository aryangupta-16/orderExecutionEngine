// src/api/orders/orders.routes.ts
import { FastifyInstance } from "fastify";
import { createOrderController } from "./orders.controller";
import { orderWebSocketHandler } from "./orders.ws";

export async function ordersRoutes(app: FastifyInstance) {
  app.post("/execute", createOrderController);

  app.get(
    "/execute",
    { websocket: true },
    orderWebSocketHandler
  );
}
