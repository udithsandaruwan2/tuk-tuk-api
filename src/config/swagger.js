/**
 * OpenAPI 3 document for Swagger UI + `/openapi.json`.
 * - Paths: `openapiPaths.js`
 * - Security: no global bearer; `openapiEnrich.js` sets per-operation (login stays public).
 * - Servers: optional `PUBLIC_BASE_URL` (e.g. https://api.example.com) for correct Try it out behind proxies.
 */
import { apiPaths } from "./openapiPaths.js";
import { buildServers, enrichOpenApiPaths } from "./openapiEnrich.js";

const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Paste only the JWT from `POST /api/auth/login` (no `Bearer ` prefix)."
    }
  },
  schemas: {
    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", example: "hq.admin@example.com" },
        password: { type: "string", example: "Password123!" }
      }
    },
    ProvinceCreate: {
      type: "object",
      required: ["name", "code"],
      properties: {
        name: { type: "string", example: "Western" },
        code: { type: "string", example: "LK-1" }
      }
    },
    ProvincePatch: {
      type: "object",
      properties: {
        name: { type: "string" },
        code: { type: "string" }
      },
      minProperties: 1
    },
    DistrictCreate: {
      type: "object",
      required: ["name", "code", "provinceId"],
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        provinceId: { type: "string" }
      }
    },
    DistrictPatch: {
      type: "object",
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        provinceId: { type: "string" }
      },
      minProperties: 1
    },
    StationCreate: {
      type: "object",
      required: ["name", "code", "districtId", "lat", "lng"],
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        districtId: { type: "string" },
        lat: { type: "number" },
        lng: { type: "number" }
      }
    },
    StationPatch: {
      type: "object",
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        districtId: { type: "string" },
        lat: { type: "number" },
        lng: { type: "number" }
      },
      minProperties: 1
    },
    UserCreate: {
      type: "object",
      required: ["name", "email", "password", "role"],
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 },
        role: { type: "string", enum: ["HQ_ADMIN", "PROVINCIAL_ADMIN", "STATION_USER", "DEVICE_CLIENT"] },
        stationId: { type: "string", nullable: true },
        provinceId: { type: "string", nullable: true },
        vehicleId: { type: "string", nullable: true }
      }
    },
    UserPatch: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        password: { type: "string", minLength: 8 },
        role: { type: "string", enum: ["HQ_ADMIN", "PROVINCIAL_ADMIN", "STATION_USER", "DEVICE_CLIENT"] },
        stationId: { type: "string", nullable: true },
        provinceId: { type: "string", nullable: true },
        vehicleId: { type: "string", nullable: true }
      },
      minProperties: 1
    },
    VehicleCreate: {
      type: "object",
      required: ["regNumber", "deviceId"],
      properties: {
        regNumber: { type: "string", example: "WP-CA-7777" },
        deviceId: { type: "string", example: "device-swagger-7777" },
        driverName: { type: "string", example: "Demo" },
        currentDistrictId: { type: "string", nullable: true }
      }
    },
    VehiclePatch: {
      type: "object",
      properties: {
        regNumber: { type: "string" },
        deviceId: { type: "string" },
        driverName: { type: "string", nullable: true },
        status: { type: "string", enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"] },
        currentDistrictId: { type: "string", nullable: true }
      },
      minProperties: 1
    },
    LocationPing: {
      type: "object",
      required: ["vehicleId", "lat", "lng", "timestamp"],
      properties: {
        vehicleId: { type: "string" },
        lat: { type: "number" },
        lng: { type: "number" },
        speed: { type: "number" },
        heading: { type: "number" },
        timestamp: { type: "string", format: "date-time" }
      }
    },
    LocationPingPatch: {
      type: "object",
      properties: {
        lat: { type: "number" },
        lng: { type: "number" },
        speed: { type: "number", nullable: true },
        heading: { type: "number", nullable: true },
        timestamp: { type: "string", format: "date-time" }
      },
      minProperties: 1
    }
  }
};

const openapiDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Tuk-Tuk Tracking API",
    version: "1.0.0",
    description: [
      "### Interactive docs",
      "- **`/docs`** or **`/api-docs`** — Swagger UI (canonical URL is `/docs/` with trailing slash)",
      "- **`/openapi.json`** — raw OpenAPI (also `/docs/openapi.json`)",
      "",
      "### Try it out",
      "1. `POST /api/auth/login` → **Execute** (no Authorize).",
      "2. Copy **`data.accessToken`**.",
      "3. **Authorize** → paste **only the JWT**.",
      "4. Call other operations.",
      "",
      "### `PUBLIC_BASE_URL`",
      "Set in `.env` if Try it out must hit a public URL (e.g. `https://api.yourdomain.com`).",
      "",
      "### Test users",
      "`hq.admin@example.com` … password **`Password123!`**"
    ].join("\n")
  },
  servers: buildServers(),
  tags: [
    { name: "Auth", description: "Login" },
    { name: "Master Data", description: "Provinces, districts, stations" },
    { name: "Users", description: "Users (HQ)" },
    { name: "Vehicles", description: "Vehicles" },
    { name: "Location", description: "Pings, live, history" },
    { name: "System", description: "Health" }
  ],
  components,
  paths: enrichOpenApiPaths(apiPaths)
};

const swaggerSpec = structuredClone(openapiDefinition);

export { swaggerSpec, openapiDefinition };
