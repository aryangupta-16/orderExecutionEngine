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
    host: "localhost",
    port: 6379,
  },
});
