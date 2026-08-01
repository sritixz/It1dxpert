import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";

import { LandingPage } from "./pages/marketing/LandingPage.jsx";
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { RegisterPage } from "./pages/auth/RegisterPage.jsx";
import { PatientDashboardPlaceholder } from "./pages/patient/PatientDashboardPlaceholder.jsx";
import { DoctorDashboardPlaceholder } from "./pages/doctor/DoctorDashboardPlaceholder.jsx";
import { PatientsListPage } from "./pages/doctor/PatientsListPage.jsx";
import { GlucoseMonitorPage } from "./pages/doctor/GlucoseMonitorPage.jsx";
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
            {/* Daily Log / Glucose Trends / Medications / Badges routes land here next phase */}
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