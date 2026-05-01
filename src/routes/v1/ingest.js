import { Router } from "express";
import { requireDeviceKey } from "../../middleware/auth.js";
import { createHttpError } from "../../middleware/error-handler.js";
import { LocationPing, TrackerDevice } from "../../models/index.js";

const router = Router();
const DEVICE_PING_MIN_INTERVAL_SECONDS = 10;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MAX_PAST_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

router.post("/devices/:deviceId/pings", requireDeviceKey, async (req, res, next) => {
  try {
    const { latitude, longitude, recordedAt, speedKmh, headingDeg } = req.body ?? {};
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      throw createHttpError(400, "VALIDATION_ERROR", "`latitude` and `longitude` must be numbers.");
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw createHttpError(400, "VALIDATION_ERROR", "Coordinates are out of range.");
    }

    const timestamp = recordedAt ? new Date(recordedAt) : new Date();
    if (Number.isNaN(timestamp.getTime())) {
      throw createHttpError(400, "VALIDATION_ERROR", "`recordedAt` must be an ISO-8601 datetime.");
    }

    const now = Date.now();
    if (timestamp.getTime() > now + MAX_FUTURE_SKEW_MS) {
      throw createHttpError(400, "VALIDATION_ERROR", "recordedAt is too far in the future.");
    }
    if (timestamp.getTime() < now - MAX_PAST_WINDOW_MS) {
      throw createHttpError(400, "VALIDATION_ERROR", "recordedAt is older than 14 days.");
    }

    const latest = await LocationPing.findOne({ vehicleId: req.device.vehicleId })
      .sort({ recordedAt: -1 })
      .select("recordedAt")
      .lean();
    if (latest) {
      const deltaSeconds = Math.abs((timestamp.getTime() - latest.recordedAt.getTime()) / 1000);
      if (deltaSeconds < DEVICE_PING_MIN_INTERVAL_SECONDS) {
        throw createHttpError(
          429,
          "RATE_LIMITED",
          `Device ping rate too high. Minimum interval is ${DEVICE_PING_MIN_INTERVAL_SECONDS} seconds.`,
        );
      }
    }

    const ping = await LocationPing.create({
      vehicleId: req.device.vehicleId,
      recordedAt: timestamp,
      latitude,
      longitude,
      speedKmh: typeof speedKmh === "number" ? speedKmh : null,
      headingDeg: typeof headingDeg === "number" ? headingDeg : null,
    });
    await TrackerDevice.findByIdAndUpdate(req.device.id, { lastSeenAt: new Date() });

    res.status(201).json({
      data: {
        accepted: true,
        deviceId: req.device.id,
        vehicle: req.device.vehicle,
        ping: {
          id: String(ping._id),
          vehicleId: String(ping.vehicleId),
          recordedAt: ping.recordedAt,
          latitude: ping.latitude,
          longitude: ping.longitude,
          speedKmh: ping.speedKmh,
          headingDeg: ping.headingDeg,
          createdAt: ping.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
