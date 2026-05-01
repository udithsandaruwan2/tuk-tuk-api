import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createHttpError } from "../../middleware/error-handler.js";
import { signUserToken } from "../../middleware/auth.js";
import { PoliceStation, Province, User } from "../../models/index.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.post("/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      throw createHttpError(400, "VALIDATION_ERROR", "`email` and `password` are required.");
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
    if (!user) {
      throw createHttpError(401, "UNAUTHORIZED", "Invalid credentials.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw createHttpError(401, "UNAUTHORIZED", "Invalid credentials.");
    }

    const [province, station] = await Promise.all([
      user.provinceId ? Province.findById(user.provinceId).select("_id code name").lean() : null,
      user.stationId ? PoliceStation.findById(user.stationId).select("_id code name").lean() : null,
    ]);

    const token = signUserToken(user);
    res.json({
      data: {
        tokenType: "Bearer",
        accessToken: token,
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        user: {
          id: String(user._id),
          email: user.email,
          role: user.role,
          province: province
            ? { id: String(province._id), code: province.code, name: province.name }
            : null,
          station: station
            ? { id: String(station._id), code: station.code, name: station.name }
            : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
