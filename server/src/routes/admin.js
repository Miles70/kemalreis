import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import {
  createAdminToken,
  verifyAdminCredentials,
} from "../utils/adminAuth.js";

export const adminRouter = Router();

const orderStatuses = ["pending", "processing", "shipped", "completed", "cancelled"];
const paymentStatuses = ["unpaid", "pending", "paid", "failed", "refunded"];
const paymentMethods = ["not_selected", "card", "crypto"];
const productBadges = ["sale", "new", "stock", null];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

adminRouter.post("/login", loginLimiter, (request, response, next) => {
  try {
    const { email, password } = request.body || {};

    if (!email || !password) {
      return response.status(400).json({ message: "Email and password are required." });
    }

    if (!verifyAdminCredentials(email, password)) {
      return response.status(401).json({ message: "Email or password is incorrect." });
    }

    const token = createAdminToken();
    return response.json({
      token,
      admin: { email: String(email).trim().toLowerCase() },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.use(requireAdmin);

adminRouter.get("/session", (request, response) => {
  response.json({ admin: { email: request.admin.email } });
});

adminRouter.get("/dashboard", async (request, response, next) => {
  try {
    const lowStockThreshold = 10;
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      revenueByCurrency,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: { $lte: lowStockThreshold } }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ["pending", "processing"] } }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: "$currency",
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    response.json({
      summary: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        revenueByCurrency: revenueByCurrency.map((item) => ({
          currency: item._id || "USD",
          total: item.total,
          count: item.count,
        })),
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/orders", async (request, response, next) => {
  try {
    const status = String(request.query.status || "").trim();
    const search = String(request.query.search || "").trim();
    const requestedLimit = Number(request.query.limit) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 200);
    const filter = {};

    if (status && orderStatuses.includes(status)) {
      filter.status = status;
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { orderNumber: pattern },
        { "customer.fullName": pattern },
        { "customer.email": pattern },
        { "customer.phone": pattern },
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    response.json({ orders });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/orders/:orderNumber", async (request, response, next) => {
  try {
    const updates = {};

    if (request.body?.status !== undefined) {
      if (!orderStatuses.includes(request.body.status)) {
        throw createHttpError("Invalid order status.", 400);
      }
      updates.status = request.body.status;
    }

    if (request.body?.paymentStatus !== undefined) {
      if (!paymentStatuses.includes(request.body.paymentStatus)) {
        throw createHttpError("Invalid payment status.", 400);
      }
      updates.paymentStatus = request.body.paymentStatus;
    }

    if (request.body?.paymentMethod !== undefined) {
      if (!paymentMethods.includes(request.body.paymentMethod)) {
        throw createHttpError("Invalid payment method.", 400);
      }
      updates.paymentMethod = request.body.paymentMethod;
    }

    if (Object.keys(updates).length === 0) {
      throw createHttpError("No valid order fields were provided.", 400);
    }

    const order = await Order.findOneAndUpdate(
      { orderNumber: request.params.orderNumber },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return response.status(404).json({ message: "Order not found." });
    }

    return response.json({ order });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/products", async (request, response, next) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 }).lean();
    response.json({ products });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/products/:productKey", async (request, response, next) => {
  try {
    const updates = {};
    const body = request.body || {};

    for (const field of ["title", "categoryKey", "image", "imageUrl"]) {
      if (body[field] !== undefined) {
        updates[field] = String(body[field]).trim();
      }
    }

    if (body.images !== undefined) {
      if (!Array.isArray(body.images)) {
        throw createHttpError("Product images must be an array.", 400);
      }
      updates.images = body.images.map((item) => String(item).trim()).filter(Boolean);
    }

    for (const field of ["price", "stock"]) {
      if (body[field] !== undefined) {
        const value = Number(body[field]);
        if (!Number.isFinite(value) || value < 0) {
          throw createHttpError(`${field} must be a non-negative number.`, 400);
        }
        updates[field] = value;
      }
    }

    if (body.oldPrice !== undefined) {
      if (body.oldPrice === null || body.oldPrice === "") {
        updates.oldPrice = null;
      } else {
        const oldPrice = Number(body.oldPrice);
        if (!Number.isFinite(oldPrice) || oldPrice < 0) {
          throw createHttpError("oldPrice must be a non-negative number.", 400);
        }
        updates.oldPrice = oldPrice;
      }
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (body.badge !== undefined) {
      const badge = body.badge === "" ? null : body.badge;
      if (!productBadges.includes(badge)) {
        throw createHttpError("Invalid product badge.", 400);
      }
      updates.badge = badge;
    }

    if (Object.keys(updates).length === 0) {
      throw createHttpError("No valid product fields were provided.", 400);
    }

    const product = await Product.findOneAndUpdate(
      { key: request.params.productKey },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      return response.status(404).json({ message: "Product not found." });
    }

    return response.json({ product });
  } catch (error) {
    return next(error);
  }
});
