import { verifyAdminToken } from "../utils/adminAuth.js";

export function requireAdmin(request, response, next) {
  try {
    const authorization = String(request.headers.authorization || "");
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return response.status(401).json({ message: "Admin login is required." });
    }

    request.admin = verifyAdminToken(match[1]);
    return next();
  } catch (error) {
    return next(error);
  }
}
