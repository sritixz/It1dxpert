// Bootstraps just enough data to test the auth/RBAC chain locally:
// one hospital (standing in for PGI Chandigarh) + one SUPER_ADMIN,
// one DOCTOR, and one PATIENT account.
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

  // 1. Seed Super Admin
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

  // 2. Seed Doctor
  const existingDoctor = await prisma.user.findUnique({
    where: { email: "doctor@it1dxpert.example" },
    include: { doctorProfile: true },
  });

  let doctorProfileId;
  if (!existingDoctor) {
    const createdDoctor = await prisma.user.create({
      data: {
        email: "doctor@it1dxpert.example",
        passwordHash,
        role: "DOCTOR",
        hospitalId: hospital.id,
        doctorProfile: {
          create: {
            fullName: "Dr. Jane Smith (seed)",
            specialization: "Endocrinology",
            licenseNumber: "LIC123456",
            hospitalId: hospital.id,
          },
        },
      },
      include: { doctorProfile: true },
    });
    doctorProfileId = createdDoctor.doctorProfile.id;
  } else {
    doctorProfileId = existingDoctor.doctorProfile?.id;
  }

  // 3. Seed Patient (assigned to the doctor)
  const existingPatient = await prisma.user.findUnique({
    where: { email: "patient@it1dxpert.example" },
  });

  if (!existingPatient) {
    await prisma.user.create({
      data: {
        email: "patient@it1dxpert.example",
        passwordHash,
        role: "PATIENT",
        hospitalId: hospital.id,
        patientProfile: {
          create: {
            fullName: "John Doe (seed)",
            diabetesType: "TYPE_1",
            hospitalId: hospital.id,
            assignedDoctorId: doctorProfileId,
          },
        },
      },
    });
  }

  console.log("Seeded hospital:", hospital.name, hospital.id);
  console.log("Seeded super admin login: superadmin@it1dxpert.example / ChangeMe123!");
  console.log("Seeded doctor login:      doctor@it1dxpert.example / ChangeMe123!");
  console.log("Seeded patient login:     patient@it1dxpert.example / ChangeMe123!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
