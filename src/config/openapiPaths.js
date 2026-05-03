/**
 * OpenAPI paths — kept separate for maintainability.
 * Every POST/PATCH includes `application/json.example` for Swagger "Try it out".
 */

const pg = { name: "page", in: "query", schema: { type: "integer", default: 1 } };
const lm = { name: "limit", in: "query", schema: { type: "integer", default: 20 } };

export const apiPaths = {
  "/health": {
    get: { tags: ["System"], summary: "Health", security: [], responses: { 200: { description: "OK" } } }
  },
  "/": {
    get: { tags: ["System"], summary: "Root", security: [], responses: { 200: { description: "OK" } } }
  },
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
            example: { email: "hq.admin@example.com", password: "Password123!" }
          }
        }
      },
      responses: { 200: { description: "OK" }, 400: { description: "Bad request" }, 401: { description: "Unauthorized" } }
    }
  },

  "/api/provinces": {
    get: {
      tags: ["Master Data"],
      summary: "List provinces (paginated)",
      parameters: [pg, lm, { name: "search", in: "query", schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } }
    },
    post: {
      tags: ["Master Data"],
      summary: "Create province (HQ_ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            example: { name: "Demo Province", code: "LK-DEMO" }
          }
        }
      },
      responses: { 201: { description: "Created" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" } }
    }
  },
  "/api/provinces/{id}": {
    get: {
      tags: ["Master Data"],
      summary: "Get province by id",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" } }
    },
    patch: {
      tags: ["Master Data"],
      summary: "Update province (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { example: { name: "Updated Name", code: "LK-1" } } }
      },
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    },
    delete: {
      tags: ["Master Data"],
      summary: "Delete province (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    }
  },

  "/api/districts": {
    get: {
      tags: ["Master Data"],
      summary: "List districts (paginated)",
      parameters: [
        pg,
        lm,
        { name: "provinceId", in: "query", schema: { type: "string" } },
        { name: "search", in: "query", schema: { type: "string" } }
      ],
      responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } }
    },
    post: {
      tags: ["Master Data"],
      summary: "Create district (HQ_ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            example: { name: "Demo District", code: "DEM", provinceId: "PASTE_PROVINCE_ID" }
          }
        }
      },
      responses: { 201: { description: "Created" }, 403: { description: "Forbidden" } }
    }
  },
  "/api/districts/{id}": {
    get: {
      tags: ["Master Data"],
      summary: "Get district by id",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 404: { description: "Not found" } }
    },
    patch: {
      tags: ["Master Data"],
      summary: "Update district (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { example: { name: "Renamed District" } } }
      },
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    },
    delete: {
      tags: ["Master Data"],
      summary: "Delete district (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    }
  },

  "/api/stations": {
    get: {
      tags: ["Master Data"],
      summary: "List stations (paginated)",
      parameters: [
        pg,
        lm,
        { name: "districtId", in: "query", schema: { type: "string" } },
        { name: "search", in: "query", schema: { type: "string" } }
      ],
      responses: { 200: { description: "OK" } }
    },
    post: {
      tags: ["Master Data"],
      summary: "Create station (HQ_ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            example: {
              name: "Demo Station",
              code: "ST-DEMO-01",
              districtId: "PASTE_DISTRICT_ID",
              lat: 6.93,
              lng: 79.85
            }
          }
        }
      },
      responses: { 201: { description: "Created" }, 403: { description: "Forbidden" } }
    }
  },
  "/api/stations/{id}": {
    get: {
      tags: ["Master Data"],
      summary: "Get station by id",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 404: { description: "Not found" } }
    },
    patch: {
      tags: ["Master Data"],
      summary: "Update station (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { example: { name: "Renamed Station", lat: 6.94, lng: 79.86 } } }
      },
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    },
    delete: {
      tags: ["Master Data"],
      summary: "Delete station (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    }
  },

  "/api/users": {
    get: {
      tags: ["Users"],
      summary: "List users (HQ_ADMIN, paginated)",
      parameters: [
        pg,
        lm,
        { name: "search", in: "query", schema: { type: "string" } },
        {
          name: "role",
          in: "query",
          schema: { type: "string", enum: ["HQ_ADMIN", "PROVINCIAL_ADMIN", "STATION_USER", "DEVICE_CLIENT"] }
        }
      ],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" } }
    },
    post: {
      tags: ["Users"],
      summary: "Create user (HQ_ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            example: {
              name: "New Officer",
              email: "officer@example.com",
              password: "Password123!",
              role: "STATION_USER",
              stationId: null,
              provinceId: null,
              vehicleId: null
            }
          }
        }
      },
      responses: { 201: { description: "Created" }, 403: { description: "Forbidden" } }
    }
  },
  "/api/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Get user by id (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 404: { description: "Not found" } }
    },
    patch: {
      tags: ["Users"],
      summary: "Update user (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { example: { name: "Updated Name", role: "PROVINCIAL_ADMIN" } } }
      },
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    },
    delete: {
      tags: ["Users"],
      summary: "Delete user (HQ_ADMIN, not self)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 400: { description: "Cannot delete self" }, 403: { description: "Forbidden" } }
    }
  },

  "/api/vehicles": {
    get: {
      tags: ["Vehicles"],
      summary: "List vehicles",
      parameters: [
        pg,
        lm,
        { name: "districtId", in: "query", schema: { type: "string" } },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"] }
        },
        { name: "search", in: "query", schema: { type: "string" }, description: "regNumber / deviceId / driverName" }
      ],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" } }
    },
    post: {
      tags: ["Vehicles"],
      summary: "Create vehicle (HQ_ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/VehicleCreate" },
            example: {
              regNumber: "WP-CA-7777",
              deviceId: "device-swagger-7777",
              driverName: "Swagger Demo"
            }
          }
        }
      },
      responses: { 201: { description: "Created" }, 403: { description: "Forbidden" } }
    }
  },
  "/api/vehicles/{id}": {
    get: {
      tags: ["Vehicles"],
      summary: "Get vehicle by id",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 404: { description: "Not found" } }
    },
    patch: {
      tags: ["Vehicles"],
      summary: "Update vehicle (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            example: { status: "MAINTENANCE", driverName: "Updated Driver" }
          }
        }
      },
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    },
    delete: {
      tags: ["Vehicles"],
      summary: "Delete vehicle (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    }
  },

  "/api/location/ping": {
    post: {
      tags: ["Location"],
      summary: "Submit ping (DEVICE_CLIENT)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LocationPing" },
            example: {
              vehicleId: "PASTE_VEHICLE_ID",
              lat: 6.91,
              lng: 79.85,
              speed: 25,
              heading: 180,
              timestamp: "2026-05-01T12:00:00.000Z"
            }
          }
        }
      },
      responses: { 201: { description: "Created" }, 403: { description: "Forbidden" } }
    }
  },
  "/api/location/pings": {
    get: {
      tags: ["Location"],
      summary: "List pings (scoped; optional date range — both dates required together)",
      parameters: [
        pg,
        lm,
        { name: "vehicleId", in: "query", schema: { type: "string" } },
        { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
        { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } }
      ],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" } }
    }
  },
  "/api/location/pings/{id}": {
    get: {
      tags: ["Location"],
      summary: "Get ping by id (scoped)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    },
    patch: {
      tags: ["Location"],
      summary: "Update ping (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { example: { lat: 6.92, lng: 79.86, speed: 40 } } }
      },
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    },
    delete: {
      tags: ["Location"],
      summary: "Delete ping (HQ_ADMIN)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } }
    }
  },
  "/api/location/live": {
    get: {
      tags: ["Location"],
      summary: "Live locations",
      parameters: [
        pg,
        lm,
        { name: "provinceId", in: "query", schema: { type: "string" } },
        { name: "districtId", in: "query", schema: { type: "string" } }
      ],
      responses: { 200: { description: "OK" } }
    }
  },
  "/api/location/history/{vehicleId}": {
    get: {
      tags: ["Location"],
      summary: "Vehicle history (max 7 days)",
      parameters: [
        { name: "vehicleId", in: "path", required: true, schema: { type: "string" } },
        {
          name: "startDate",
          in: "query",
          required: true,
          schema: { type: "string", format: "date-time" }
        },
        {
          name: "endDate",
          in: "query",
          required: true,
          schema: { type: "string", format: "date-time" }
        },
        pg,
        lm
      ],
      responses: { 200: { description: "OK" }, 400: { description: "Bad window" }, 403: { description: "Forbidden" } }
    }
  }
};
