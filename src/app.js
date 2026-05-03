import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

const origins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = origins.includes("*");

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
  res.status(200).json({
    success: true,
    message: "Tuk-Tuk API is running",
    data: {
      health: "/health",
      docs: "/docs",
      apiDocs: "/api-docs",
      openapiJson: "/openapi.json",
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
