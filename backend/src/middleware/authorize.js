// authorize(...allowedRoles) — second link in the RBAC chain.
//
// Must run AFTER authenticate (needs req.auth.role to already be set).
// This only checks WHICH roles can hit a route at all — it does not check
// WHOSE data they can see within that role. That second, more granular
// check is scopeToHospital.js. Splitting them means a route like
// "GET /api/doctor/patients" reads as:
//
//   router.get(
//     "/patients",
//     authenticate,
//     authorize("DOCTOR", "HOSPITAL_ADMIN"),
//     scopeToHospital,
//     getPatientsController
//   );
//
// which is self-documenting about exactly who can call it and how their
// results get filtered.

import { AppError } from "../utils/AppError.js";

export function authorize(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!req.auth) {
      // Defensive check — indicates authorize was wired up without
      // authenticate running first, which is a bug in the route, not
      // the request.
      return next(new AppError("authorize() used without authenticate()", 500));
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
  };
}
