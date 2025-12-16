// import { OrderRepository } from "../db/order.repository";
// import { orderQueue } from "../queue/order.queue";

// export async function createOrder(payload: {
//   inputToken: string;
//   outputToken: string;
//   amount: number;
// }) {
//   const order = await OrderRepository.create({
//     ...payload,
//     orderType: "MARKET",
//   });

//   await orderQueue.add("execute-order", {
//     orderId: order.id,
//   });

//   return order;
// }
