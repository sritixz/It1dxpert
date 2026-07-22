// scopeToHospital — third link in the RBAC chain, and the one it's easiest
// to forget (flagged earlier as the piece that actually enforces multi-
// tenancy, not just role checks).
//
// Job: attach req.hospitalId so every controller downstream builds its
// Prisma queries with `where: { hospitalId: req.hospitalId, ... }` instead
// of trusting a hospitalId the client might pass in a query param or body
// (which a malicious or buggy client could set to someone else's hospital).
//
// SUPER_ADMIN is the one role allowed to bypass this — they're platform-
// wide by design. Every other role gets hospitalId forced from their OWN
// token claim, never from the request.

import { AppError } from "../utils/AppError.js";

export function scopeToHospital(req, res, next) {
  if (!req.auth) {
    return next(new AppError("scopeToHospital() used without authenticate()", 500));
  }

  if (req.auth.role === "SUPER_ADMIN") {
    // Super admin can optionally filter by a hospitalId passed as a query
    // param (e.g. /api/admin/patients?hospitalId=xyz), but it's optional —
    // omitting it means "all hospitals".
    req.hospitalId = req.query.hospitalId || null;
    return next();
  }

  if (!req.auth.hospitalId) {
    // Every non-super-admin user MUST have a hospitalId on their token.
    // If this fires, it means a user record was created without one —
    // a data problem, not a normal auth failure.
    return next(new AppError("User is not associated with a hospital", 403));
  }

  req.hospitalId = req.auth.hospitalId;
  next();
}
