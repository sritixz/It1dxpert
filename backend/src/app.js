// Express app configuration. Separated from server.js so tests can import
// `app` and hit it with supertest without actually binding a port.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import patientAppointmentRoutes from "./routes/patientAppointment.routes.js";
import patientSettingsRoutes from "./routes/patientSettings.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import supportRoutes from "./routes/support.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import documentRoutes from "./routes/document.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// --- Global middleware ---
app.use(helmet()); // sensible security headers by default
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// --- Health check (useful for deploy platforms + uptime monitoring) ---
app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// --- Routes, grouped by dashboard as discussed ---
// NOTE ON ORDER: /api/doctor/settings and /api/doctor/appointments are
// registered BEFORE the general /api/doctor mount deliberately. Express
// matches prefixes in registration order — if the general /api/doctor
// mount came first, every request to /api/doctor/settings/* would run
// doctorRoutes' entire middleware chain (auth, role check, hospital scope,
// profile attach) first, find no matching route inside it, fall through,
// and then run settingsRoutes' own identical chain a second time. Putting
// the more specific paths first means Express matches and fully handles
// them without ever reaching the broader /api/doctor mount.
app.use("/api/auth", authRoutes);
app.use("/api/patient/appointments", patientAppointmentRoutes);
app.use("/api/patient/settings", patientSettingsRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/patient/ai", aiRoutes);
app.use("/api/patient/documents", documentRoutes);
app.use("/api/doctor/settings", settingsRoutes);
app.use("/api/doctor/appointments", appointmentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);

// --- 404 fallback for unmatched routes ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Error handler MUST be registered last ---
app.use(errorHandler);
