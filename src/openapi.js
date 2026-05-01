const apiTags = [
  { name: "Auth" },
  { name: "Boundaries" },
  { name: "Vehicles" },
  { name: "Analytics" },
  { name: "Ingest" },
];

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Tuk-Tuk Tracking API",
    version: "0.3.0",
    description:
      "Week 3 includes JWT user auth, role-scoped reads, admin writes, and secured device ping ingest.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local development" }],
  tags: apiTags,
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      deviceApiKey: { type: "apiKey", in: "header", name: "x-device-key" },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["Auth"],
        summary: "Service root",
      },
    },
    "/health": {
      get: {
        tags: ["Auth"],
        summary: "Health check",
      },
    },
    "/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User login to obtain JWT",
      },
    },
    "/v1/provinces": {
      get: { tags: ["Boundaries"], summary: "List provinces", security: [{ bearerAuth: [] }] },
    },
    "/v1/districts": {
      get: { tags: ["Boundaries"], summary: "List districts", security: [{ bearerAuth: [] }] },
    },
    "/v1/stations": {
      get: { tags: ["Boundaries"], summary: "List stations", security: [{ bearerAuth: [] }] },
    },
    "/v1/vehicles": {
      get: { tags: ["Vehicles"], summary: "List vehicles", security: [{ bearerAuth: [] }] },
      post: { tags: ["Vehicles"], summary: "Create vehicle", security: [{ bearerAuth: [] }] },
    },
    "/v1/vehicles/{vehicleId}": {
      get: {
        tags: ["Vehicles"],
        summary: "Get vehicle detail",
        parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
      },
      patch: {
        tags: ["Vehicles"],
        summary: "Update vehicle",
        parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
      },
    },
    "/v1/vehicles/{vehicleId}/location/latest": {
      get: {
        tags: ["Vehicles"],
        summary: "Get latest location ping",
        parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
      },
    },
    "/v1/vehicles/{vehicleId}/locations": {
      get: {
        tags: ["Vehicles"],
        summary: "Get historical location pings",
        parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
      },
    },
    "/v1/analytics/vehicles-by-district": {
      get: {
        tags: ["Analytics"],
        summary: "Active vehicles by district",
        security: [{ bearerAuth: [] }],
      },
    },
    "/v1/analytics/active-vehicles": {
      get: {
        tags: ["Analytics"],
        summary: "Recently active vehicles",
        security: [{ bearerAuth: [] }],
      },
    },
    "/v1/devices/{deviceId}/pings": {
      post: {
        tags: ["Ingest"],
        summary: "Device location ingest",
        parameters: [{ in: "path", name: "deviceId", required: true, schema: { type: "string" } }],
        security: [{ deviceApiKey: [] }],
      },
    },
  },
};
