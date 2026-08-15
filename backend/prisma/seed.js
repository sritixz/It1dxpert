// Bootstraps full, realistic test data for all roles:
// One hospital, two doctors, four patients (with 7 days of glucose, meal, insulin, activity records),
// clinical alerts, badges, support tickets, and upcoming appointments.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/db.js";

async function main() {
  console.log("Starting database seeding...");

  // 0. Clean up existing clinical/transactional logs to allow clean re-seeding
  console.log("Cleaning up old logs, alerts, appointments, and tickets...");
  await prisma.glucoseLog.deleteMany();
  await prisma.insulinLog.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.patientNote.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.patientBadge.deleteMany();
  await prisma.streakRecord.deleteMany();

  // Clean up old profiles/users except the main accounts if possible, or recreate them
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany({ where: { email: { notIn: ["superadmin@it1dxpert.example", "doctor@it1dxpert.example", "patient@it1dxpert.example"] } } });

  // 1. Seed Hospital
  console.log("Seeding Hospital...");
  const hospital = await prisma.hospital.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: { name: "PGI Chandigarh Clinical Center" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "PGI Chandigarh Clinical Center",
      type: "Hospital",
      address: "Sector 12, Chandigarh, 160012",
      contactEmail: "contact@pgichandigarh.example",
      contactPhone: "+91-172-2747585",
    },
  });

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  // 2. Seed Super Admin
  console.log("Seeding Super Admin...");
  await prisma.user.upsert({
    where: { email: "superadmin@it1dxpert.example" },
    update: { isActive: true },
    create: {
      email: "superadmin@it1dxpert.example",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  // 3. Seed Doctors
  console.log("Seeding Doctors...");
  const docUser1 = await prisma.user.upsert({
    where: { email: "doctor@it1dxpert.example" },
    update: { isActive: true },
    create: {
      email: "doctor@it1dxpert.example",
      passwordHash,
      role: "DOCTOR",
      hospitalId: hospital.id,
    },
  });

  const docProfile1 = await prisma.doctorProfile.upsert({
    where: { userId: docUser1.id },
    update: { fullName: "Dr. Sarah Miller", specialization: "Pediatric Endocrinology" },
    create: {
      userId: docUser1.id,
      hospitalId: hospital.id,
      fullName: "Dr. Sarah Miller",
      specialization: "Pediatric Endocrinology",
      licenseNumber: "LIC-SARAH-9921",
    },
  });

  const docUser2 = await prisma.user.upsert({
    where: { email: "doctor2@it1dxpert.example" },
    update: { isActive: true },
    create: {
      email: "doctor2@it1dxpert.example",
      passwordHash,
      role: "DOCTOR",
      hospitalId: hospital.id,
    },
  });

  const docProfile2 = await prisma.doctorProfile.upsert({
    where: { userId: docUser2.id },
    update: { fullName: "Dr. Rohit Sharma", specialization: "General Endocrinology" },
    create: {
      userId: docUser2.id,
      hospitalId: hospital.id,
      fullName: "Dr. Rohit Sharma",
      specialization: "General Endocrinology",
      licenseNumber: "LIC-ROHIT-5582",
    },
  });

  // 4. Seed Patients
  console.log("Seeding Patients...");
  const patUser1 = await prisma.user.upsert({
    where: { email: "patient@it1dxpert.example" },
    update: { isActive: true },
    create: {
      email: "patient@it1dxpert.example",
      passwordHash,
      role: "PATIENT",
      hospitalId: hospital.id,
    },
  });

  const patProfile1 = await prisma.patientProfile.upsert({
    where: { userId: patUser1.id },
    update: { assignedDoctorId: docProfile1.id },
    create: {
      userId: patUser1.id,
      hospitalId: hospital.id,
      fullName: "Aarav Patel",
      dateOfBirth: new Date("2012-05-14"),
      gender: "Male",
      diabetesType: "TYPE_1",
      weeklyActivityGoalMins: 150,
      assignedDoctorId: docProfile1.id,
    },
  });

  // Additional mock patient 2
  const patUser2 = await prisma.user.create({
    data: {
      email: "patient2@it1dxpert.example",
      passwordHash,
      role: "PATIENT",
      hospitalId: hospital.id,
      patientProfile: {
        create: {
          hospitalId: hospital.id,
          fullName: "Diya Sen",
          dateOfBirth: new Date("2015-09-22"),
          gender: "Female",
          diabetesType: "TYPE_1",
          weeklyActivityGoalMins: 180,
          assignedDoctorId: docProfile1.id,
        },
      },
    },
    include: { patientProfile: true },
  });
  const patProfile2 = patUser2.patientProfile;

  // Additional mock patient 3
  const patUser3 = await prisma.user.create({
    data: {
      email: "patient3@it1dxpert.example",
      passwordHash,
      role: "PATIENT",
      hospitalId: hospital.id,
      patientProfile: {
        create: {
          hospitalId: hospital.id,
          fullName: "Kabir Singh",
          dateOfBirth: new Date("2008-01-30"),
          gender: "Male",
          diabetesType: "TYPE_1",
          weeklyActivityGoalMins: 200,
          assignedDoctorId: docProfile2.id,
        },
      },
    },
    include: { patientProfile: true },
  });
  const patProfile3 = patUser3.patientProfile;

  // 5. Seed Gamification Badges
  console.log("Seeding Badges...");
  const badgesData = [
    { code: "STREAK_3", name: "3-Day Streak", description: "Logged daily activities for 3 consecutive days", icon: "🔥" },
    { code: "STREAK_7", name: "7-Day Streak", description: "Logged daily activities for 7 consecutive days", icon: "🏆" },
    { code: "STREAK_30", name: "30-Day Streak", description: "Logged daily activities for 30 consecutive days", icon: "👑" },
    { code: "COMPLETE_DAY", name: "Full Log Hero", description: "Logged glucose, meals, insulin, and activity 4 times each in a single day", icon: "🌟" },
  ];

  const badgeIdsByCode = {};
  for (const b of badgesData) {
    const badge = await prisma.badge.upsert({
      where: { code: b.code },
      update: { name: b.name, description: b.description, icon: b.icon },
      create: b,
    });
    badgeIdsByCode[b.code] = badge.id;
  }

  // Award some badges to Aarav
  await prisma.patientBadge.createMany({
    data: [
      { patientId: patProfile1.id, badgeId: badgeIdsByCode.STREAK_3 },
      { patientId: patProfile1.id, badgeId: badgeIdsByCode.COMPLETE_DAY },
    ],
  });

  // Seed Streak Record for Aarav
  await prisma.streakRecord.create({
    data: {
      patientId: patProfile1.id,
      currentStreak: 5,
      longestStreak: 8,
      lastLoggedDate: new Date(),
    },
  });

  // 6. Seed 7 Days of Logging History for Patient 1 (Aarav Patel)
  console.log("Seeding 7 Days of Clinical Logs for Aarav Patel...");
  const now = new Date();

  // Generate logs for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const logDate = new Date();
    logDate.setDate(now.getDate() - i);

    // Baseline glucose values for different times of day (slight variance)
    const baseGlucose = [
      { hour: 8, min: 15, val: 95, context: "Fasting" },
      { hour: 13, min: 30, val: 145, context: "Post-Meal" },
      { hour: 19, min: 45, val: 120, context: "Pre-Meal" },
      { hour: 22, min: 30, val: 110, context: "Bedtime" },
    ];

    for (const g of baseGlucose) {
      const d = new Date(logDate);
      d.setHours(g.hour, g.min, 0, 0);

      // Add a high glucose anomaly on day -2 to trigger an alert demo
      let glucoseValue = g.val + (Math.floor(Math.random() * 20) - 10);
      if (i === 2 && g.hour === 13) {
        glucoseValue = 265; // Critical High
      }

      await prisma.glucoseLog.create({
        data: {
          patientId: patProfile1.id,
          hospitalId: hospital.id,
          value: glucoseValue,
          context: g.context,
          loggedAt: d,
        },
      });
    }

    // Insulin logs (Meal time rapid, bedtime long)
    const insulinDoses = [
      { hour: 8, min: 30, units: 4, type: "Lispro (Meal Time)", reason: "Meal Bolus" },
      { hour: 13, min: 45, units: 6, type: "Lispro (Meal Time)", reason: "Meal Bolus" },
      { hour: 22, min: 45, units: 12, type: "Glargine (Long-Acting)", reason: "Basal Dose" },
    ];

    for (const ins of insulinDoses) {
      const d = new Date(logDate);
      d.setHours(ins.hour, ins.min, 0, 0);

      await prisma.insulinLog.create({
        data: {
          patientId: patProfile1.id,
          hospitalId: hospital.id,
          units: ins.units,
          insulinType: ins.type,
          reason: ins.reason,
          loggedAt: d,
        },
      });
    }

    // Meal logs (Carbs intake)
    const meals = [
      { hour: 8, min: 0, carbs: 35, type: "Breakfast", notes: "Oatmeal and berries" },
      { hour: 13, min: 0, carbs: 65, type: "Lunch", notes: "Chicken sandwich and apple" },
      { hour: 19, min: 0, carbs: 50, type: "Dinner", notes: "Roti, dal, salad" },
    ];

    for (const m of meals) {
      const d = new Date(logDate);
      d.setHours(m.hour, m.min, 0, 0);

      await prisma.mealLog.create({
        data: {
          patientId: patProfile1.id,
          hospitalId: hospital.id,
          carbs: m.carbs,
          mealType: m.type,
          notes: m.notes,
          loggedAt: d,
        },
      });
    }

    // Activity logs
    const activities = [
      { hour: 17, min: 30, duration: 30, type: "Walking" },
    ];

    for (const act of activities) {
      const d = new Date(logDate);
      d.setHours(act.hour, act.min, 0, 0);

      await prisma.activityLog.create({
        data: {
          patientId: patProfile1.id,
          hospitalId: hospital.id,
          durationMins: act.duration,
          activityType: act.type,
          loggedAt: d,
        },
      });
    }
  }

  // 7. Seed Clinical Alerts
  console.log("Seeding Alerts...");
  await prisma.alert.createMany({
    data: [
      {
        patientId: patProfile1.id,
        hospitalId: hospital.id,
        type: "HIGH_GLUCOSE",
        severity: "CRITICAL",
        message: "Glucose spike detected: 265 mg/dL after lunch.",
        isRead: false,
        isResolved: false,
      },
      {
        patientId: patProfile2.id,
        hospitalId: hospital.id,
        type: "MISSED_LOG",
        severity: "WARNING",
        message: "No logs registered in the last 24 hours.",
        isRead: false,
        isResolved: false,
      },
    ],
  });

  // 8. Seed Appointments
  console.log("Seeding Appointments...");
  const aptTime1 = new Date();
  aptTime1.setDate(now.getDate() + 2);
  aptTime1.setHours(10, 30, 0, 0);

  const aptTime2 = new Date();
  aptTime2.setDate(now.getDate() + 5);
  aptTime2.setHours(14, 0, 0, 0);

  const aptTime3 = new Date();
  aptTime3.setDate(now.getDate() - 4);
  aptTime3.setHours(11, 0, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patProfile1.id,
        doctorId: docProfile1.id,
        hospitalId: hospital.id,
        providerName: docProfile1.fullName,
        providerType: docProfile1.specialization,
        scheduledAt: aptTime1,
        type: "Regular Checkup",
        purpose: "Routine clinical check on glucose averages.",
        mode: "IN_CLINIC",
        status: "CONFIRMED",
      },
      {
        patientId: patProfile2.id,
        doctorId: docProfile1.id,
        hospitalId: hospital.id,
        providerName: docProfile1.fullName,
        providerType: docProfile1.specialization,
        scheduledAt: aptTime2,
        type: "Consultation",
        purpose: "Insulin sliding scale dosage review.",
        mode: "VIDEO_CALL",
        status: "PENDING",
      },
      {
        patientId: patProfile1.id,
        doctorId: docProfile1.id,
        hospitalId: hospital.id,
        providerName: docProfile1.fullName,
        providerType: docProfile1.specialization,
        scheduledAt: aptTime3,
        type: "First Visit",
        purpose: "Onset diagnosis onboarding.",
        mode: "IN_CLINIC",
        status: "COMPLETED",
      },
    ],
  });

  // 9. Seed Support Tickets
  console.log("Seeding Support Tickets...");
  await prisma.supportTicket.createMany({
    data: [
      {
        userId: patUser1.id,
        hospitalId: hospital.id,
        subject: "Trouble changing my password",
        message: "When I try to update my password in preferences, the button hangs.",
        status: "OPEN",
      },
      {
        userId: docUser1.id,
        hospitalId: hospital.id,
        subject: "Requesting custom glucose thresholds",
        message: "Can we get custom warning indicators for hypoglycemia alerts set below 60 mg/dL?",
        status: "RESOLVED",
      },
    ],
  });

  console.log("\nDatabase Seeding Completed Successfully!");
  console.log("-----------------------------------------");
  console.log(`Seeded Hospital:   ${hospital.name} (ID: ${hospital.id})`);
  console.log("Seeded Accounts:");
  console.log("- Super Admin:    superadmin@it1dxpert.example / ChangeMe123!");
  console.log("- Primary Doctor: doctor@it1dxpert.example / ChangeMe123!");
  console.log("- Doctor #2:      doctor2@it1dxpert.example / ChangeMe123!");
  console.log("- Patient (1):    patient@it1dxpert.example / ChangeMe123! (Aarav Patel)");
  console.log("- Patient (2):    patient2@it1dxpert.example / ChangeMe123! (Diya Sen)");
  console.log("- Patient (3):    patient3@it1dxpert.example / ChangeMe123! (Kabir Singh)");
}

main()
  .catch((err) => {
    console.error("Seeding crashed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
