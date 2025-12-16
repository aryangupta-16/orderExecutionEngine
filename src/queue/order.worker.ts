import { Worker, Job } from "bullmq";
import { wsManager } from "../ws/ws.manager";
import { OrderJobData } from "./order.queue";
import { OrderRepository } from "../db/order.repository";
import { DexRouter } from "../dex/router";

const dexRouter = new DexRouter();

async function processOrder(job: Job<OrderJobData>) {
  const { orderId, inputToken, outputToken, amount, slippage } = job.data;

  try {
    // =========================
    // 1️⃣ ROUTING
    // =========================
    await OrderRepository.updateStatus(orderId, "ROUTING");
    wsManager.send(orderId, { status: "ROUTING" });

    const bestQuote = await dexRouter.findBestRoute({
      inputToken,
      outputToken,
      amount,
      slippage,
    });

    // Save selected DEX
    await OrderRepository.updateStatus(orderId, "ROUTING", {
      dex: bestQuote.dex,
    });

    // =========================
    // 2️⃣ BUILDING
    // =========================
    await OrderRepository.updateStatus(orderId, "BUILDING");
    wsManager.send(orderId, {
      status: "BUILDING",
      dex: bestQuote.dex,
    });

    const builtTx = await dexRouter.buildTransaction(bestQuote);

    // =========================
    // 3️⃣ SUBMITTING
    // =========================
    await OrderRepository.updateStatus(orderId, "SUBMITTED");
    wsManager.send(orderId, {
      status: "SUBMITTED",
      dex: bestQuote.dex,
    });

    const executionResult = await dexRouter.executeTransaction(builtTx);

    // =========================
    // 4️⃣ CONFIRMED
    // =========================
    await OrderRepository.updateStatus(orderId, "CONFIRMED", {
      txHash: executionResult.txHash,
      executionPrice: executionResult.executionPrice,
    });

    wsManager.send(orderId, {
      status: "CONFIRMED",
      txHash: executionResult.txHash,
      executionPrice: executionResult.executionPrice,
      dex: bestQuote.dex,
    });
  } catch (error: any) {
    console.error("Worker error:", error);

    // =========================
    // ❌ FAILED
    // =========================
    await OrderRepository.updateStatus(orderId, "FAILED", {
      error: error.message,
    });

    wsManager.send(orderId, {
      status: "FAILED",
      error: error.message,
    });

    throw error; // Important for BullMQ retries
  }
}

// =========================
// Worker setup
// =========================
export const orderWorker = new Worker<OrderJobData>(
  "order-execution",
  processOrder,
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
    concurrency: 5,
  }
);
