// Auth controller — deliberately thin: validate the request shape with
// Zod, call the service, shape the response. No business logic lives here
// (that's auth.service.js) so the controller stays easy to scan.

import { z } from "zod";
import * as authService from "../services/auth.service.js";
import { verifyRefreshToken, signAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1),
  hospitalId: z.string().uuid(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerPatientController(req, res) {
  const parsed = registerSchema.parse(req.body); // throws ZodError on bad input, caught by errorHandler
  const result = await authService.registerPatient(parsed);
  res.status(201).json({ success: true, data: result });
}

export async function loginController(req, res) {
  const parsed = loginSchema.parse(req.body);
  const result = await authService.login(parsed);
  res.status(200).json({ success: true, data: result });
}

export async function refreshController(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError("refreshToken is required", 400);
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Re-fetch the user rather than trusting stale claims — role or
  // hospitalId may have changed since the refresh token was issued
  // (e.g. a hospital admin reassigning the user).
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) {
    throw new AppError("Account no longer active", 401);
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    hospitalId: user.hospitalId,
  });

  res.status(200).json({ success: true, data: { accessToken } });
}

// Simple "who am I" endpoint — useful for the frontend to hydrate auth
// state on page load without re-decoding the JWT client-side.
export async function meController(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.auth.userId },
    select: {
      id: true,
      email: true,
      role: true,
      hospitalId: true,
      patientProfile: true,
      doctorProfile: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({ success: true, data: user });
}
