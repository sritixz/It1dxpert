// Express app configuration. Separated from server.js so tests can import
// `app` and hit it with supertest without actually binding a port.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import adminRoutes from "./routes/admin.routes.js";
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
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// --- Health check (useful for deploy platforms + uptime monitoring) ---
app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// --- Routes, grouped by dashboard as discussed ---
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);

// --- 404 fallback for unmatched routes ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Error handler MUST be registered last ---
app.use(errorHandler);
