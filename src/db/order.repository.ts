// src/db/order.repository.ts
import { prisma } from "../config/db";
import { OrderStatus } from "../../generated/prisma/client";

export interface CreateOrderData {
  idempotencyKey: string;
  inputToken: string;
  outputToken: string;
  amount: number;
  slippage: number;
  orderType: string;
}

export const OrderRepository = {

  findByIdempotencyKey: async (key: string) => {
  return prisma.order.findUnique({
    where: { idempotencyKey: key },
  });
},

  // Create a new order
  create: async (data: CreateOrderData) => {
    return prisma.order.create({
      data: {
        ...data,
        status: OrderStatus.PENDING, // default initial status
      },
    });
  },

  // Update status and optional fields
  updateStatus: async (
    orderId: string,
    status: OrderStatus,
    extra?: {
      dex?: string;
      txHash?: string;
      executionPrice?: number;
      error?: string;
    }
  ) => {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...extra,
      },
    });
  },

  // Fetch order by ID
  findById: async (orderId: string) => {
    return prisma.order.findUnique({
      where: { id: orderId },
    });
  },
};
