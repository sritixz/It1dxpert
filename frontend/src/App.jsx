import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";
import { HOME_PATH_BY_ROLE } from "./config/navConfig.js";
import { LandingPage } from "./pages/marketing/LandingPage.jsx";
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { RegisterPage } from "./pages/auth/RegisterPage.jsx";
import { PatientDashboardPlaceholder } from "./pages/patient/PatientDashboardPlaceholder.jsx";
import { DoctorDashboardPlaceholder } from "./pages/doctor/DoctorDashboardPlaceholder.jsx";
import { AdminDashboardPlaceholder } from "./pages/admin/AdminDashboardPlaceholder.jsx";
import { PlaceholderPage } from "./pages/PlaceholderPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Patient dashboard group */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientDashboardPlaceholder />} />
            <Route path="daily-log" element={<PlaceholderPage />} />
            <Route path="glucose-trends" element={<PlaceholderPage />} />
            <Route path="medications" element={<PlaceholderPage />} />
            <Route path="badges" element={<PlaceholderPage />} />
            <Route path="settings" element={<PlaceholderPage />} />
          </Route>

          {/* Doctor dashboard group */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR", "HOSPITAL_ADMIN"]}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboardPlaceholder />} />
            <Route path="patients" element={<PlaceholderPage />} />
            <Route path="alerts" element={<PlaceholderPage />} />
            <Route path="settings" element={<PlaceholderPage />} />
          </Route>

          {/* Admin dashboard group */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN", "SUPER_ADMIN"]}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPlaceholder />} />
            <Route path="doctors" element={<PlaceholderPage />} />
            <Route path="patients" element={<PlaceholderPage />} />
            <Route path="hospitals" element={<PlaceholderPage />} />
            <Route path="hospital-admins" element={<PlaceholderPage />} />
            <Route path="settings" element={<PlaceholderPage />} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Sends "/" (and any unmatched path) to the right place: the user's own
// dashboard if logged in, otherwise the login page.
function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={user ? HOME_PATH_BY_ROLE[user.role] || "/login" : "/login"} replace />;
}
