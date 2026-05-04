import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { access } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile as execFileCb } from "node:child_process";
import swaggerUi from "swagger-ui-express";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

// Behind Traefik / another reverse proxy: set TRUST_PROXY=true so req.secure, req.ip, and
// absolute URLs (e.g. /) respect X-Forwarded-* headers.
if (process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const origins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = origins.includes("*");
const generatedDataDir = path.resolve("data/generated");
const execFile = promisify(execFileCb);

const ensureFileExists = async (filePath, generatorScript) => {
  try {
    await access(filePath);
    return;
  } catch {
    await execFile(process.execPath, [path.resolve(generatorScript)]);
    await access(filePath);
  }
};

const absoluteUrl = (req, routePath) => `${req.protocol}://${req.get("host")}${routePath}`;

app.use(
  helmet({
    // Swagger UI uses inline assets that are blocked by Helmet's default CSP.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(
  cors({
    origin: allowAllOrigins || origins.length === 0 ? true : origins
  })
);
app.use(hpp());
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/location/ping",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

app.get("/", (_req, res) => {
  const req = _req;
  res.status(200).json({
    success: true,
    message: "Tuk-Tuk API is running",
    data: {
      health: "/health",
      docs: "/docs",
      apiDocs: "/api-docs",
      openapiJson: "/openapi.json",
      downloadable: {
        swaggerJson: absoluteUrl(req, "/downloads/swagger.json"),
        masterDataJson: absoluteUrl(req, "/downloads/master-data.json"),
        sampleSimulationJson: absoluteUrl(req, "/downloads/sim-seed-sample.json")
      },
      apiBase: "/api"
    }
  });
});

const sendOpenApiJson = (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
};

app.get("/openapi.json", sendOpenApiJson);
app.get("/docs/openapi.json", sendOpenApiJson);
app.get("/api-docs/openapi.json", sendOpenApiJson);
app.get("/swagger.json", sendOpenApiJson);

app.get("/downloads/swagger.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=\"swagger.json\"");
  res.json(swaggerSpec);
});

app.get("/downloads/master-data.json", async (_req, res, next) => {
  const filePath = path.join(generatedDataDir, "master-data.json");
  try {
    await ensureFileExists(filePath, "scripts/generate-master-data.js");
    res.download(filePath, "master-data.json");
  } catch (error) {
    next(error);
  }
});

app.get("/downloads/sim-seed-sample.json", async (_req, res, next) => {
  const filePath = path.join(generatedDataDir, "sim-seed-sample.json");
  try {
    await ensureFileExists(filePath, "scripts/generate-sim-data.js");
    res.download(filePath, "sim-seed-sample.json");
  } catch (error) {
    next(error);
  }
});

const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "list",
    filter: true,
    tryItOutEnabled: true,
    syntaxHighlight: false
  },
  customSiteTitle: "Tuk-Tuk API Docs"
};

// `swaggerUi.serve` is an array of static middlewares; spread it so CSS/JS assets load.
// Mount without a trailing slash; `/docs` → `/docs/` is handled by the UI stack (301).
app.use("/docs", ...swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use("/api-docs", ...swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
