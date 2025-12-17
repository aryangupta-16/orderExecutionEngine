import { Worker, Job } from "bullmq";
import { OrderJobData } from "./order.queue";
import { OrderRepository } from "../db/order.repository";
import { DexRouter } from "../dex/router";
import { redis } from "../config/redis";

export const dexRouter = new DexRouter();

export async function processOrder(job: Job<OrderJobData>) {
  const { orderId, inputToken, outputToken, amount, slippage } = job.data;
  
  console.log(orderId,"orderId in worker");
  try {
    // ROUTING
    await OrderRepository.updateStatus(orderId, "ROUTING");

    await redis.publish(
      "order_updates",
      JSON.stringify({ orderId, status: "ROUTING" })
    );

    console.log("routing done");
    const bestQuote = await dexRouter.findBestRoute({
      inputToken,
      outputToken,
      amount,
      slippage,
    });

    // await new Promise((resolve) => setTimeout(resolve, 20000));

    await OrderRepository.updateStatus(orderId, "ROUTING", {
      dex: bestQuote.dex,
    });

    // BUILDING
    await OrderRepository.updateStatus(orderId, "BUILDING");

    await redis.publish(
      "order_updates",
      JSON.stringify({
        orderId,
        status: "BUILDING",
        dex: bestQuote.dex,
      })
    );

    console.log("building done");
    const builtTx = await dexRouter.buildTransaction(bestQuote);

    // await new Promise((resolve) => setTimeout(resolve, 20000));

    // SUBMITTED
    await OrderRepository.updateStatus(orderId, "SUBMITTED");

    await redis.publish(
      "order_updates",
      JSON.stringify({
        orderId,
        status: "SUBMITTED",
        dex: bestQuote.dex,
      })
    );

    console.log("submitted done");
    const executionResult = await dexRouter.executeTransaction(builtTx);

    console.log("execution done");
    // CONFIRMED
    await OrderRepository.updateStatus(orderId, "CONFIRMED", {
      txHash: executionResult.txHash,
      executionPrice: executionResult.executionPrice,
    });

    await redis.publish(
      "order_updates",
      JSON.stringify({
        orderId,
        status: "CONFIRMED",
        txHash: executionResult.txHash,
        executionPrice: executionResult.executionPrice,
        dex: bestQuote.dex,
      })
    );
  } catch (error: any) {
    console.error("Worker error:", error);

    await OrderRepository.updateStatus(orderId, "FAILED", {
      error: error.message,
    });

    await redis.publish(
      "order_updates",
      JSON.stringify({
        orderId,
        status: "FAILED",
        error: error.message,
      })
    );

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
    concurrency: 5,
  }
);
