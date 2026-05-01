import { createHttpError } from "../middleware/error-handler.js";

export function getVehicleScopeWhere(auth) {
  if (!auth) {
    throw createHttpError(500, "AUTH_STATE_ERROR", "Missing auth context.");
  }
  if (auth.role === "HQ_ADMIN") return {};
  if (auth.role === "PROVINCIAL") {
    if (!auth.provinceId) {
      throw createHttpError(403, "FORBIDDEN", "Provincial user missing province scope.");
    }
    return { provinceId: String(auth.provinceId) };
  }
  if (auth.role === "STATION") {
    if (!auth.stationId) {
      throw createHttpError(403, "FORBIDDEN", "Station user missing station scope.");
    }
    return { stationId: String(auth.stationId) };
  }
  throw createHttpError(403, "FORBIDDEN", "Unknown role.");
}

export function combineWhereWithScope(where, scope) {
  const and = [];
  if (where && Object.keys(where).length) and.push(where);
  if (scope && Object.keys(scope).length) and.push(scope);
  if (!and.length) return {};
  if (and.length === 1) return and[0];
  return { AND: and };
}
