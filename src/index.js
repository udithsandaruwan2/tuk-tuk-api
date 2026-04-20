import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { notFoundHandler, errorHandler } from "./middleware/error-handler.js";
import { prisma } from "./services/prisma.js";
import v1Router from "./routes/v1/index.js";
import { openApiSpec } from "./openapi.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "256kb" }));

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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "tuk-tuk-api", version: "0.2.0" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use("/v1", v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.info(`tuk-tuk-api listening on http://localhost:${port}`);
  console.info(`swagger docs at http://localhost:${port}/api-docs`);
});

async function gracefulShutdown(signal) {
  console.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
