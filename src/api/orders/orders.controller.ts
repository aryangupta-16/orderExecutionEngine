import { FastifyRequest, FastifyReply } from "fastify";
import { orderQueue } from "../../queue/order.queue";
import { OrderRepository } from "../../db/order.repository";
// import { OrderStatus } from "@prisma/client";

interface CreateOrderBody {
    inputToken: string;
    outputToken: string;
    amount: number;
    slippage: number;
}

export async function createOrderController(
    request: FastifyRequest<{ Body: CreateOrderBody }>,
    reply: FastifyReply
) {
    const { inputToken, outputToken, amount, slippage } = request.body;

    const idempotencyKey = request.headers["idempotency-key"] as string;

    if (!idempotencyKey) {
        throw new Error("Idempotency-Key header is required");
    }

    const existingOrder =
        await OrderRepository.findByIdempotencyKey(idempotencyKey);

    if (existingOrder) {
        return reply.send(existingOrder);
    }

    // 1️⃣ Basic validation
    if (!inputToken || !outputToken) {
        return reply.status(400).send({ error: "Invalid tokens" });
    }

    if (!amount || amount <= 0) {
        return reply.status(400).send({ error: "Amount must be greater than 0" });
    }

    if (slippage < 0 || slippage > 5) {
        return reply.status(400).send({ error: "Invalid slippage" });
    }

    try {
        // 2️⃣ Save order in DB with status PENDING
        const order = await OrderRepository.create({
            idempotencyKey,
            inputToken,
            outputToken,
            amount,
            slippage,
            orderType: "MARKET",
        });

        const orderId = order.id;

        await orderQueue.add(
            "execute-order",
            { orderId, inputToken, outputToken, amount, slippage, orderType: "MARKET" },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
            }
        );

        request.log.info({ orderId }, "Job added to queue");

        return reply.status(201).send({ orderId });
    } catch (err: any) {
        request.log.error(err, "Error creating order");
        return reply.status(500).send({ error: "Failed to create order" });
    }
}
