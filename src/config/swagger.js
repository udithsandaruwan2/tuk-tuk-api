import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tuk-Tuk Tracking API",
      version: "1.0.0",
      description: "REST API for tuk-tuk tracking and policing operations."
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/health": { get: { tags: ["System"], summary: "Health check", responses: { 200: { description: "OK" } } } },
      "/": { get: { tags: ["System"], summary: "Root endpoint", responses: { 200: { description: "API info" } } } },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Authenticate and get JWT",
          security: [],
          responses: { 200: { description: "Authenticated" } }
        }
      },
      "/api/provinces": { get: { tags: ["Master Data"], summary: "List provinces", responses: { 200: { description: "OK" } } } },
      "/api/districts": { get: { tags: ["Master Data"], summary: "List districts", responses: { 200: { description: "OK" } } } },
      "/api/stations": { get: { tags: ["Master Data"], summary: "List police stations", responses: { 200: { description: "OK" } } } },
      "/api/vehicles": {
        get: { tags: ["Vehicles"], summary: "List vehicles", responses: { 200: { description: "OK" } } },
        post: { tags: ["Vehicles"], summary: "Register vehicle", responses: { 201: { description: "Created" } } }
      },
      "/api/location/ping": {
        post: { tags: ["Location"], summary: "Submit location ping", responses: { 201: { description: "Created" } } }
      },
      "/api/location/live": {
        get: { tags: ["Location"], summary: "Latest location per vehicle", responses: { 200: { description: "OK" } } }
      },
      "/api/location/history/{vehicleId}": {
        get: {
          tags: ["Location"],
          summary: "Vehicle movement history",
          parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "OK" } }
        }
      }
    }
  },
  apis: ["src/routes/*.js", "src/routes/**/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec };
