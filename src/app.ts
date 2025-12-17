// src/app.ts
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import pino from "pino";
// import "./queue/order.worker";


// routes
import { ordersRoutes } from "./api/orders/orders.routes";

export function buildApp() {
  // Create Fastify instance with logger
  const app = Fastify({
    logger: {
      level: "info",
    },
  });

  // Register WebSocket plugin
  app.register(websocket);

  // Health check (very important for deployment)
  app.get("/health", async () => {
    return { status: "ok" };
  });

  // Register routes
  app.register(ordersRoutes, {
    prefix: "/api/orders",
  });

  return app;
}
