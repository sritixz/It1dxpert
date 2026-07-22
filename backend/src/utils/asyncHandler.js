// Wraps an async Express route handler so thrown errors (or rejected
// promises) are forwarded to next(err) automatically, instead of every
// controller needing its own try/catch that calls next(err) manually.
//
// Usage: router.post("/login", asyncHandler(loginController))

export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
