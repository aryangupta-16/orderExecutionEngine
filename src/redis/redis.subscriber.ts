import Redis from "ioredis";
import { wsManager } from "../ws/ws.manager";

// Create a separate Redis connection for subscribing
const subscriber = new Redis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

// Subscribe to the channel
subscriber.subscribe("order_updates", (err) => {
  if (err) {
    console.error("❌ Failed to subscribe to Redis channel", err);
  } else {
    console.log("✅ Subscribed to Redis channel: order_updates");
  }
});

// Listen for messages
subscriber.on("message", (channel, message) => {
  try {
    const data = JSON.parse(message);
    // console.log(data,"data in redis.subscriber");   
    const { orderId, ...payload } = data;

    if (!orderId) return;

    console.log("📥 Redis event received:", data);

    wsManager.send(orderId, payload);
  } catch (err) {
    console.error("❌ Error handling Redis message", err);
  }
});
