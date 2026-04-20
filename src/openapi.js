const apiTag = [{ name: "Week2-Read" }];

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Tuk-Tuk Tracking API",
    version: "0.2.0",
    description:
      "Week 2 read endpoints for boundaries, vehicles, latest location, history and analytics.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
  tags: apiTag,
  paths: {
    "/health": {
      get: {
        tags: ["Week2-Read"],
        summary: "Health check",
        responses: {
          200: {
            description: "API is healthy",
          },
        },
      },
    },
    "/v1/provinces": {
      get: {
        tags: ["Week2-Read"],
        summary: "List provinces",
      },
    },
    "/v1/districts": {
      get: {
        tags: ["Week2-Read"],
        summary: "List districts with province filters",
      },
    },
    "/v1/stations": {
      get: {
        tags: ["Week2-Read"],
        summary: "List police stations with district/province filters",
      },
    },
    "/v1/vehicles": {
      get: {
        tags: ["Week2-Read"],
        summary: "List vehicles with scope filters",
      },
    },
    "/v1/vehicles/{vehicleId}": {
      get: {
        tags: ["Week2-Read"],
        summary: "Get vehicle detail",
        parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string" } }],
      },
    },
    "/v1/vehicles/{vehicleId}/location/latest": {
      get: {
        tags: ["Week2-Read"],
        summary: "Get latest location ping",
        parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string" } }],
      },
    },
    "/v1/vehicles/{vehicleId}/locations": {
      get: {
        tags: ["Week2-Read"],
        summary: "Get historical location pings by time window",
        parameters: [
          { in: "path", name: "vehicleId", required: true, schema: { type: "string" } },
          {
            in: "query",
            name: "from",
            required: true,
            schema: { type: "string", format: "date-time" },
          },
          {
            in: "query",
            name: "to",
            required: true,
            schema: { type: "string", format: "date-time" },
          },
        ],
      },
    },
    "/v1/analytics/vehicles-by-district": {
      get: {
        tags: ["Week2-Read"],
        summary: "Count active vehicles by district",
      },
    },
    "/v1/analytics/active-vehicles": {
      get: {
        tags: ["Week2-Read"],
        summary: "Vehicles active in recent minutes",
      },
    },
  },
};
