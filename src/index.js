import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { notFoundHandler, errorHandler } from "./middleware/error-handler.js";
import { connectDatabase, disconnectDatabase } from "./services/db.js";
import v1Router from "./routes/v1/index.js";
import { openApiSpec } from "./openapi.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((v) => v.trim()) : "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-device-key"],
  }),
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false }));

if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
}

app.use((req, _res, next) => {
  req.requestStartedAt = Date.now();
  next();
});

app.use((req, res, next) => {
  res.on("finish", () => {
    const durationMs = Date.now() - req.requestStartedAt;
    console.info(
      JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      }),
    );
  });
  next();
});

app.get("/", (_req, res) => {
  res.json({
    service: "tuk-tuk-api",
    version: "1.0.0",
    message: "API is running. Use the links below to explore.",
    links: {
      health: "/health",
      apiDocs: "/api-docs",
      provinces: "/v1/provinces",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "tuk-tuk-api", version: "1.0.0" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use("/v1", v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

let server;
connectDatabase()
  .then(() => {
    server = app.listen(port, () => {
      console.info(`tuk-tuk-api listening on http://localhost:${port}`);
      console.info(`swagger docs at http://localhost:${port}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect database", error);
    process.exit(1);
  });

async function gracefulShutdown(signal) {
  console.info(`${signal} received. Shutting down gracefully...`);
  if (!server) {
    await disconnectDatabase();
    process.exit(0);
    return;
  }
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
