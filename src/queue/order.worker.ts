import { Worker, Job } from "bullmq";
import { OrderJobData } from "./order.queue";
import { OrderRepository } from "../db/order.repository";
import { DexRouter } from "../dex/router";
import { redis } from "../config/redis";
import { logger } from "../utils/logger";

export const dexRouter = new DexRouter();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processOrder(job: Job<OrderJobData>) {
  const { orderId, inputToken, outputToken, amount, slippage } = job.data;
  
  logger.info({ orderId }, "Starting order processing");

  try {
    await OrderRepository.updateStatus(orderId, "ROUTING");
    await redis.publish("order_updates", JSON.stringify({ orderId, status: "ROUTING" }));
    
    await delay(2000); // Simulate routing delay

    logger.info({ orderId }, "Finding best route");
    const bestQuote = await dexRouter.findBestRoute({
      inputToken,
      outputToken,
      amount,
      slippage,
    });
    logger.info({ orderId, dex: bestQuote.dex, price: bestQuote.price }, "Route found");

    await OrderRepository.updateStatus(orderId, "ROUTING", { dex: bestQuote.dex });

    await OrderRepository.updateStatus(orderId, "BUILDING");
    await redis.publish("order_updates", JSON.stringify({
        orderId,
        status: "BUILDING",
        dex: bestQuote.dex,
    }));

    await delay(2000); // Simulate transaction building delay

    logger.info({ orderId }, "Building transaction");
    const builtTx = await dexRouter.buildTransaction(bestQuote);
    
    await OrderRepository.updateStatus(orderId, "SUBMITTED");
    await redis.publish("order_updates", JSON.stringify({
        orderId,
        status: "SUBMITTED",
        dex: bestQuote.dex,
    }));

    await delay(2000); // Simulate network submission delay

    logger.info({ orderId }, "Executing transaction");
    const executionResult = await dexRouter.executeTransaction(builtTx);

    await OrderRepository.updateStatus(orderId, "CONFIRMED", {
      txHash: executionResult.txHash,
      executionPrice: executionResult.executionPrice,
    });

    await redis.publish("order_updates", JSON.stringify({
        orderId,
        status: "CONFIRMED",
        txHash: executionResult.txHash,
        executionPrice: executionResult.executionPrice,
        dex: bestQuote.dex,
    }));

    logger.info({ orderId, txHash: executionResult.txHash }, "Order successfully executed");

  } catch (error: any) {
    logger.error({ orderId, error: error.message }, "Order processing failed");

    await OrderRepository.updateStatus(orderId, "FAILED", {
      error: error.message,
    });

    await redis.publish("order_updates", JSON.stringify({
        orderId,
        status: "FAILED",
        error: error.message,
    }));

    throw error;
  }
}

export const orderWorker = new Worker<OrderJobData>(
  "order-execution",
  processOrder,
  {
    connection: {
      url: process.env.REDIS_URL!,
      tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
    },
    concurrency: 10,
  }
);
