// JWT helpers.
//
// Two tokens, two purposes:
// - Access token: short-lived (default 15m), sent with every API request,
//   carries the claims RBAC middleware needs (userId, role, hospitalId).
// - Refresh token: long-lived (default 7d), used only to mint new access
//   tokens. Kept separate so a leaked access token expires quickly, while
//   the refresh token can be revoked server-side if needed later (e.g. by
//   checking it against a stored token version — not implemented yet, but
//   this split is what makes that possible without a redesign).

import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Payload shape is intentionally minimal — just what authorize/scopeToHospital
 * middleware need. Anything else should be fetched from the DB by id, not
 * trusted from the token, so a stale token can't leak stale profile data.
 */
export function signAccessToken({ userId, role, hospitalId }) {
  return jwt.sign({ userId, role, hospitalId }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken({ userId }) {
  return jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
