const HTTP = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

/** Operations that must NOT require JWT in Swagger (matches runtime). */
const PUBLIC_OPERATIONS = new Set(["GET /health", "GET /", "POST /api/auth/login"]);

const opKey = (method, pathTemplate) => `${method.toUpperCase()} ${pathTemplate}`;

const slugOpId = (method, pathTemplate) => {
  const tail = pathTemplate
    .replace(/^\//, "")
    .replace(/\{([^}]+)\}/g, "by_$1")
    .replace(/\//g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_");
  return `${method}_${tail || "root"}`.replace(/__+/g, "_");
};

/**
 * Ensures every operation has explicit security (fixes global bearer breaking login).
 * Adds operationId for Swagger grouping / codegen.
 * Ensures JSON request bodies have a schema object (editor + validation UX).
 */
const enrichOpenApiPaths = (paths) => {
  const out = structuredClone(paths);

  for (const [pathTemplate, pathItem] of Object.entries(out)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP.has(method)) continue;
      if (!operation || typeof operation !== "object") continue;

      const key = opKey(method, pathTemplate);
      if (PUBLIC_OPERATIONS.has(key)) {
        operation.security = [];
      } else if (!Array.isArray(operation.security)) {
        operation.security = [{ bearerAuth: [] }];
      }

      operation.operationId = operation.operationId || slugOpId(method, pathTemplate);

      const body = operation.requestBody?.content?.["application/json"];
      if (body && body.example !== undefined && !body.schema) {
        body.schema = {
          type: "object",
          example: body.example
        };
      }
    }
  }

  return out;
};

const buildServers = () => {
  const base = process.env.PUBLIC_BASE_URL?.trim();
  if (!base) {
    return [{ url: "/", description: "Same origin (default). Set PUBLIC_BASE_URL for an absolute public base." }];
  }
  const url = base.replace(/\/$/, "");
  return [{ url, description: "PUBLIC_BASE_URL (for Try it out behind proxies / HTTPS)" }];
};

export { enrichOpenApiPaths, buildServers, PUBLIC_OPERATIONS };
