// Auth service — the actual logic, kept separate from the controller so it
// can be unit-tested (or reused, e.g. by a future seed script or admin
// "create patient on behalf of" flow) without spinning up Express.

import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = 12;

/**
 * Registers a PATIENT. Kept deliberately narrow (patient-only) because
 * doctors and hospital admins should be created by an existing admin
 * (an "invite" flow), not via open self-signup — that's how hospital
 * scoping stays trustworthy. This function is the template that flow
 * will follow once it's built.
 */
export async function registerPatient({ email, password, fullName, hospitalId, dateOfBirth, gender }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital || !hospital.isActive) {
    throw new AppError("Invalid hospital", 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Single transaction: either both the User and PatientProfile rows are
  // created, or neither is — avoids ever ending up with a "ghost" user
  // that has no profile because the second insert failed.
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "PATIENT",
        hospitalId,
      },
    });

    await tx.patientProfile.create({
      data: {
        userId: createdUser.id,
        hospitalId,
        fullName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
      },
    });

    return createdUser;
  });

  return issueTokens(user);
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Same error message whether the email doesn't exist or the password is
  // wrong — prevents an attacker from using this endpoint to enumerate
  // which emails are registered.
  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  return issueTokens(user);
}

function issueTokens(user) {
  const claims = { userId: user.id, role: user.role, hospitalId: user.hospitalId };

  return {
    accessToken: signAccessToken(claims),
    refreshToken: signRefreshToken({ userId: user.id }),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    },
  };
}
