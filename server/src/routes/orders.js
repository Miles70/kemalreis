import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Order } from "../models/Order.js";
import { createOrder, serializeOrder } from "../services/orderService.js";

export const ordersRouter = Router();

const createOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many order attempts. Please try again later." },
});

ordersRouter.post("/", createOrderLimiter, async (request, response, next) => {
  try {
    const order = await createOrder(request.body);
    response.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/:orderNumber", async (request, response, next) => {
  try {
    const email = String(request.query.email || "").trim().toLowerCase();

    if (!email) {
      return response.status(400).json({ message: "Email is required." });
    }

    const order = await Order.findOne({
      orderNumber: request.params.orderNumber,
      "customer.email": email,
    });

    if (!order) {
      return response.status(404).json({ message: "Order not found." });
    }

    return response.json({ order: serializeOrder(order) });
  } catch (error) {
    return next(error);
  }
});
