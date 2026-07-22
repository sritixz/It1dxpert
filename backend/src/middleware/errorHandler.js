// Centralized error handler — the last middleware in the chain (see app.js).
// Every asyncHandler-wrapped controller and every next(err) call from other
// middleware ends up here, so this is the ONE place response shape for
// errors is decided.

export function errorHandler(err, req, res, next) {
  // Zod throws a ZodError (not an AppError) when req.body fails schema
  // validation. Handled here, in one place, so every controller can just
  // call schema.parse(req.body) and not worry about catching it.
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }

  const statusCode = err.statusCode || 500;

  // Operational errors (AppError instances) are safe to show to the client
  // verbatim — we wrote that message on purpose. Anything else is an
  // unexpected bug, so we log the real message server-side but send a
  // generic one to the client to avoid leaking internals (stack traces,
  // DB error text, etc.).
  const message = err.isOperational ? err.message : "Internal Server Error";

  if (!err.isOperational) {
    console.error("Unexpected error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
