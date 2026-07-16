import crypto from "node:crypto";
import { Router } from "express";

import { requireCustomer } from "../middleware/customerAuth.js";
import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import { getCompatibleOrderNumbers } from "../services/orderNumberMigration.js";
import { serializeOrder } from "../services/orderService.js";
import { serializeCustomer } from "../services/customerAuthService.js";

export const customerAccountRouter = Router();

const MAX_ADDRESSES = 20;
const MAX_FAVORITES = 100;

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function createAddressId(value) {
  const id = cleanText(value, 180);
  return /^[a-zA-Z0-9:_-]{8,180}$/.test(id)
    ? id
    : `address-${crypto.randomUUID()}`;
}

function sanitizeProfile(profile = {}) {
  const email = cleanText(profile.email, 180).toLowerCase();

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    const error = new Error("Please provide a valid profile email address.");
    error.statusCode = 400;
    throw error;
  }

  return {
    fullName: cleanText(profile.fullName, 120),
    email,
    phone: cleanText(profile.phone, 40),
  };
}

function sanitizeAddresses(addresses) {
  if (!Array.isArray(addresses)) return [];

  const seenIds = new Set();
  const sanitized = addresses.slice(0, MAX_ADDRESSES).map((address) => {
    let id = createAddressId(address?.id);
    while (seenIds.has(id)) id = `address-${crypto.randomUUID()}`;
    seenIds.add(id);

    return {
      id,
      label: cleanText(address?.label || "Address", 60),
      fullName: cleanText(address?.fullName, 120),
      phone: cleanText(address?.phone, 40),
      city: cleanText(address?.city, 100),
      country: cleanText(address?.country, 100),
      address: cleanText(address?.address, 500),
      isDefault: Boolean(address?.isDefault),
    };
  });

  if (sanitized.length > 0) {
    const defaultIndex = sanitized.findIndex((address) => address.isDefault);
    sanitized.forEach((address, index) => {
      address.isDefault = index === (defaultIndex >= 0 ? defaultIndex : 0);
    });
  }

  return sanitized;
}

function sanitizeFavorites(favorites) {
  if (!Array.isArray(favorites)) return [];

  const seenKeys = new Set();
  const sanitized = [];

  for (const favorite of favorites) {
    const key = cleanText(favorite?.key, 100);
    const title = cleanText(favorite?.title, 300);
    if (!key || !title || seenKeys.has(key)) continue;

    seenKeys.add(key);
    sanitized.push({
      key,
      title,
      price: Math.max(0, Number(favorite?.price || 0)),
      oldPrice:
        Number(favorite?.oldPrice || 0) > 0
          ? Number(favorite.oldPrice)
          : null,
      imageUrl: cleanText(favorite?.imageUrl, 1000),
      categoryKey: cleanText(favorite?.categoryKey, 100),
      category: cleanText(favorite?.category, 120),
      badge: cleanText(favorite?.badge, 60),
    });

    if (sanitized.length >= MAX_FAVORITES) break;
  }

  return sanitized;
}

async function linkVerifiedEmailOrders(customer) {
  if (!customer.emailVerified || !customer.email) return;

  await Order.updateMany(
    {
      customerAccount: null,
      "customer.email": customer.email,
    },
    { $set: { customerAccount: customer._id } },
  );
}

async function loadOrders(customerId) {
  const orders = await Order.find({ customerAccount: customerId })
    .sort({ createdAt: -1 })
    .limit(100);
  return orders.map(serializeOrder);
}

customerAccountRouter.use(requireCustomer);

customerAccountRouter.get("/", async (request, response, next) => {
  try {
    await linkVerifiedEmailOrders(request.customer);
    const orders = await loadOrders(request.customer._id);

    response.json({
      customer: serializeCustomer(request.customer),
      account: {
        profile: request.customer.profile || {},
        addresses: request.customer.addresses || [],
        favorites: request.customer.favorites || [],
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
});

customerAccountRouter.put("/", async (request, response, next) => {
  try {
    const profile = sanitizeProfile(request.body?.profile);
    const addresses = sanitizeAddresses(request.body?.addresses);
    const favorites = sanitizeFavorites(request.body?.favorites);

    const customer = await Customer.findOneAndUpdate(
      { _id: request.customer._id },
      {
        $set: {
          profile,
          addresses,
          favorites,
          displayName: profile.fullName || request.customer.displayName,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    response.json({
      customer: serializeCustomer(customer),
      account: {
        profile: customer.profile,
        addresses: customer.addresses,
        favorites: customer.favorites,
      },
    });
  } catch (error) {
    next(error);
  }
});

customerAccountRouter.post("/claim-orders", async (request, response, next) => {
  try {
    const claims = Array.isArray(request.body?.orders)
      ? request.body.orders.slice(0, 50)
      : [];
    let claimedCount = 0;

    if (!request.customer.emailVerified || !request.customer.email) {
      const orders = await loadOrders(request.customer._id);
      response.json({ claimedCount, orders });
      return;
    }

    for (const claim of claims) {
      const orderNumber = cleanText(
        claim?.orderNumber || claim?.orderId || claim?.id,
        80,
      );
      const email = cleanText(claim?.email, 180).toLowerCase();
      if (
        !orderNumber ||
        !email ||
        email !== request.customer.email
      ) {
        continue;
      }

      const result = await Order.updateOne(
        {
          orderNumber: { $in: getCompatibleOrderNumbers(orderNumber) },
          "customer.email": email,
          $or: [
            { customerAccount: null },
            { customerAccount: request.customer._id },
          ],
        },
        { $set: { customerAccount: request.customer._id } },
      );

      if (result.modifiedCount > 0 || result.matchedCount > 0) {
        claimedCount += 1;
      }
    }

    const orders = await loadOrders(request.customer._id);
    response.json({ claimedCount, orders });
  } catch (error) {
    next(error);
  }
});
