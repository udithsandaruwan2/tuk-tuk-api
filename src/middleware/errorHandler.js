const errorHandler = (error, _req, res, next) => {
  void next;
  const statusCode = error.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
    ...(isProd ? {} : { stack: error.stack })
  });
};

export { errorHandler };
