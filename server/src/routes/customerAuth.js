import { Router } from "express";
import rateLimit from "express-rate-limit";

import { requireCustomer } from "../middleware/customerAuth.js";
import { CustomerSession } from "../models/CustomerSession.js";
import {
  createFirebaseCustomerSession,
  createGuestCustomerSession,
  createWalletChallenge,
  createWalletCustomerSession,
  serializeCustomer,
} from "../services/customerAuthService.js";

export const customerAuthRouter = Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again later." },
});

customerAuthRouter.post("/firebase", authLimiter, async (request, response, next) => {
  try {
    const session = await createFirebaseCustomerSession(request.body?.idToken);
    response.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

customerAuthRouter.post("/guest", authLimiter, async (request, response, next) => {
  try {
    const session = await createGuestCustomerSession(request.body?.guestId);
    response.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

customerAuthRouter.post(
  "/wallet/challenge",
  authLimiter,
  async (request, response, next) => {
    try {
      const challenge = await createWalletChallenge(request.body?.address);
      response.status(201).json({ challenge });
    } catch (error) {
      next(error);
    }
  },
);

customerAuthRouter.post("/wallet", authLimiter, async (request, response, next) => {
  try {
    const session = await createWalletCustomerSession({
      address: request.body?.address,
      challengeId: request.body?.challengeId,
      signature: request.body?.signature,
    });
    response.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

customerAuthRouter.get("/session", requireCustomer, (request, response) => {
  response.json({
    session: {
      provider: request.customer.provider,
      providerId: request.customer.providerId,
      expiresAt: request.customerSession.expiresAt,
      customer: serializeCustomer(request.customer),
    },
  });
});

customerAuthRouter.post("/logout", requireCustomer, async (request, response, next) => {
  try {
    await CustomerSession.deleteOne({ _id: request.customerSession._id });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
