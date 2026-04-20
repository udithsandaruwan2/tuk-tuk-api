export function notFoundHandler(req, res) {
  res.status(404).json({
    code: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }

  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  res.status(status).json({
    code: err?.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
    message: err?.message || "Unexpected server error.",
    ...(err?.details ? { details: err.details } : {}),
  });
}

export function createHttpError(statusCode, code, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
}
