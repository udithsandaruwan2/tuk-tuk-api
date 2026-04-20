import { createHttpError } from "../middleware/error-handler.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query) {
  const page = Number(query.page ?? DEFAULT_PAGE);
  const limit = Number(query.limit ?? DEFAULT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw createHttpError(400, "VALIDATION_ERROR", "`page` must be an integer >= 1.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw createHttpError(400, "VALIDATION_ERROR", "`limit` must be an integer between 1 and 100.");
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function parseDateRange(query, maxDays = 31) {
  const { from, to } = query;
  if (!from || !to) {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      "`from` and `to` are required ISO-8601 datetimes.",
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      "`from` and `to` must be valid ISO-8601 datetimes.",
    );
  }
  if (fromDate >= toDate) {
    throw createHttpError(400, "VALIDATION_ERROR", "`from` must be earlier than `to`.");
  }

  const days = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (days > maxDays) {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      `Requested date range exceeds ${maxDays} days. Narrow the time window.`,
    );
  }

  return { fromDate, toDate };
}
