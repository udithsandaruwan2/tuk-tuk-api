import { ApiError } from "../utils/ApiError.js";

const validate = ({ body, query, params } = {}) => (req, _res, next) => {
  const errors = [];
  const validated = {};

  if (body) {
    const parsed = body.safeParse(req.body);
    if (!parsed.success) errors.push(...parsed.error.errors);
    else validated.body = parsed.data;
  }

  if (query) {
    const parsed = query.safeParse(req.query);
    if (!parsed.success) errors.push(...parsed.error.errors);
    else validated.query = parsed.data;
  }

  if (params) {
    const parsed = params.safeParse(req.params);
    if (!parsed.success) errors.push(...parsed.error.errors);
    else validated.params = parsed.data;
  }

  if (errors.length > 0) {
    const message = errors.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    return next(new ApiError(400, message || "Validation failed"));
  }

  req.validated = { ...(req.validated || {}), ...validated };
  return next();
};

export { validate };
