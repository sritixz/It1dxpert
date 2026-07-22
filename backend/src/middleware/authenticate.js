// authenticate — first link in the RBAC chain.
//
// Job: confirm the request carries a valid access token, and attach its
// claims to req.auth. Does NOT check roles or hospital scope — that's
// authorize.js and scopeToHospital.js. Keeping this step single-purpose
// makes each middleware easy to reason about and reuse independently
// (e.g. some public routes might skip authorize but still want to know
// "is this request from a logged-in user or not").

import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization; // expected: "Bearer <token>"

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Missing or malformed Authorization header", 401));
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    // payload = { userId, role, hospitalId, iat, exp }
    req.auth = payload;
    next();
  } catch (err) {
    // Covers both expired and tampered/invalid tokens — same response
    // either way, so we don't leak which case it was.
    return next(new AppError("Invalid or expired token", 401));
  }
}
