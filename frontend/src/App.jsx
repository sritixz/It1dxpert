import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";

import { LandingPage } from "./pages/marketing/LandingPage.jsx";
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { RegisterPage } from "./pages/auth/RegisterPage.jsx";
import { PatientDashboardPlaceholder } from "./pages/patient/PatientDashboardPlaceholder.jsx";
import { InsulinRecordsPage } from "./pages/patient/InsulinRecordsPage.jsx";
import { ActivityPage } from "./pages/patient/ActivityPage.jsx";
import { PatientAppointmentsPage } from "./pages/patient/PatientAppointmentsPage.jsx";
import { PatientSettingsPage } from "./pages/patient/PatientSettingsPage.jsx";
import { DoctorDashboardPlaceholder } from "./pages/doctor/DoctorDashboardPlaceholder.jsx";
import { PatientsListPage } from "./pages/doctor/PatientsListPage.jsx";
import { GlucoseMonitorPage } from "./pages/doctor/GlucoseMonitorPage.jsx";
import { AlertsPage } from "./pages/doctor/AlertsPage.jsx";
import { SettingsPage } from "./pages/doctor/SettingsPage.jsx";
import { AppointmentsPage } from "./pages/doctor/AppointmentsPage.jsx";
import { HelpSupportPage } from "./pages/doctor/HelpSupportPage.jsx";
import { AdminDashboardPlaceholder } from "./pages/admin/AdminDashboardPlaceholder.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public marketing page — visible whether logged in or not.
              Logged-in visitors get a "Go to Dashboard" CTA instead of a
              forced redirect, so a shared/bookmarked "/" link still works. */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Patient dashboard group */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <AppShell title="Dashboard" />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientDashboardPlaceholder />} />
            <Route path="insulin-records" element={<InsulinRecordsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="appointments" element={<PatientAppointmentsPage />} />
            <Route path="settings" element={<PatientSettingsPage />} />
            {/* Daily Log / Glucose Trends / Medications / Badges — backend
                endpoints already exist and work, but the frontend screens
                for these were never actually built (only this Dashboard
                placeholder exists). Real gap, not in this round's scope
                (Insulin Records / Settings / Appointments / Activity) —
                worth doing next given the backend is just sitting ready. */}
          </Route>

          {/* Doctor dashboard group */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR", "HOSPITAL_ADMIN"]}>
                <AppShell title="Dashboard" />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboardPlaceholder />} />
            <Route path="patients" element={<PatientsListPage />} />
            <Route path="patients/:patientId" element={<GlucoseMonitorPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpSupportPage />} />
          </Route>

          {/* Admin dashboard group */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN", "SUPER_ADMIN"]}>
                <AppShell title="Dashboard" />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPlaceholder />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
