// Bootstraps just enough data to test the auth/RBAC chain locally:
// one hospital (standing in for PGI Chandigarh) + one SUPER_ADMIN account.
// Run with: npm run seed

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/db.js";

async function main() {
  const hospital = await prisma.hospital.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "PGI Chandigarh (seed)",
      contactEmail: "contact@pgichandigarh.example",
    },
  });

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@it1dxpert.example" },
    update: {},
    create: {
      email: "superadmin@it1dxpert.example",
      passwordHash,
      role: "SUPER_ADMIN",
      // SUPER_ADMIN intentionally has no hospitalId — platform-wide.
    },
  });

  console.log("Seeded hospital:", hospital.name, hospital.id);
  console.log("Seeded super admin login: superadmin@it1dxpert.example / ChangeMe123!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
