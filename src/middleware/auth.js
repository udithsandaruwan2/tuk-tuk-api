import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHttpError } from "./error-handler.js";
import { TrackerDevice, Vehicle } from "../models/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-week3-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim();
}

export function signUserToken(user) {
  return jwt.sign(
    {
      sub: String(user.id || user._id),
      role: user.role,
      provinceId: user.provinceId ? String(user.provinceId) : null,
      stationId: user.stationId ? String(user.stationId) : null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function requireAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw createHttpError(401, "UNAUTHORIZED", "Missing Bearer token.");
    }
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      provinceId: payload.provinceId ?? null,
      stationId: payload.stationId ?? null,
    };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(createHttpError(401, "UNAUTHORIZED", "Invalid or expired token."));
      return;
    }
    next(error);
  }
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.auth) {
      next(createHttpError(500, "AUTH_STATE_ERROR", "Auth middleware not applied."));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(createHttpError(403, "FORBIDDEN", "Insufficient role for this action."));
      return;
    }
    next();
  };
}

export async function requireDeviceKey(req, _res, next) {
  try {
    const rawKey = req.headers["x-device-key"];
    if (!rawKey || typeof rawKey !== "string") {
      throw createHttpError(401, "UNAUTHORIZED", "Missing x-device-key header.");
    }

    const device = await TrackerDevice.findById(req.params.deviceId).lean();
    if (!device || !device.isActive) {
      throw createHttpError(401, "UNAUTHORIZED", "Invalid or inactive device.");
    }

    const ok = await bcrypt.compare(rawKey, device.apiKeyHash);
    if (!ok) {
      throw createHttpError(401, "UNAUTHORIZED", "Invalid or inactive device.");
    }

    const vehicle = await Vehicle.findById(device.vehicleId)
      .select("_id registrationNumber")
      .lean();
    if (!vehicle) {
      throw createHttpError(401, "UNAUTHORIZED", "Invalid or inactive device.");
    }

    req.device = {
      id: String(device._id),
      vehicleId: String(device.vehicleId),
      vehicle: { id: String(vehicle._id), registrationNumber: vehicle.registrationNumber },
    };
    next();
  } catch (error) {
    next(error);
  }
}
