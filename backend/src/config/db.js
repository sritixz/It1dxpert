// Prisma client singleton.
//
// Why a singleton: with `node --watch` (used in the dev script), the module
// cache can reload on file changes. Without guarding against that, every
// reload would create a brand-new PrismaClient and open a fresh pool of DB
// connections, eventually exhausting Postgres's connection limit. Stashing
// the client on `globalThis` in dev sidesteps that.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
