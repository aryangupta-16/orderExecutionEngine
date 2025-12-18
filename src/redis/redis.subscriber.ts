import Redis from "ioredis";
import { wsManager } from "../ws/ws.manager";
import { logger } from "../utils/logger";

// Create a separate Redis connection for subscribing
const subscriber = new Redis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

// Subscribe to the channel
subscriber.subscribe("order_updates", (err) => {
  if (err) {
    logger.error({ err }, "Failed to subscribe to Redis channel");
  } else {
    logger.info("Subscribed to Redis channel: order_updates");
  }
});

// Listen for messages
subscriber.on("message", (channel, message) => {
  try {
    const data = JSON.parse(message);
    const { orderId, ...payload } = data;

    if (!orderId) return;

    logger.debug({ orderId, payload }, "Redis event received");

    wsManager.send(orderId, payload);
  } catch (err) {
    logger.error({ err }, "Error handling Redis message");
  }
});
