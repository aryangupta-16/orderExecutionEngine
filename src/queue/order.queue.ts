// src/queue/order.queue.ts
import { Queue } from "bullmq";

export interface OrderJobData {
  orderId: string;
  inputToken: string;
  outputToken: string;
  amount: number;
  slippage: number;
  orderType: string;
}

export const orderQueue = new Queue<OrderJobData>("order-execution", {
  connection: {
    url: process.env.REDIS_URL!, 
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  },
});
