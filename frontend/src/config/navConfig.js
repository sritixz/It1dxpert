// One nav list per role, matching the sidebars from the mockups.
// AppShell reads this by req.user.role so each dashboard gets its own
// nav without a pile of role-conditionals inside the layout component.

export const NAV_CONFIG = {
  PATIENT: [
    { label: "Dashboard", path: "/patient", icon: "home" },
    { label: "Daily Log", path: "/patient/daily-log", icon: "clipboard" },
    { label: "Glucose Trends", path: "/patient/glucose-trends", icon: "chart" },
    { label: "Medications", path: "/patient/medications", icon: "pill" },
    { label: "Badges", path: "/patient/badges", icon: "award" },
    { label: "Settings", path: "/patient/settings", icon: "settings" },
  ],
  DOCTOR: [
    { label: "Dashboard", path: "/doctor", icon: "home" },
    { label: "My Patients", path: "/doctor/patients", icon: "users" },
    { label: "Alerts", path: "/doctor/alerts", icon: "bell" },
    { label: "Settings", path: "/doctor/settings", icon: "settings" },
  ],
  HOSPITAL_ADMIN: [
    { label: "Dashboard", path: "/admin", icon: "home" },
    { label: "Doctors", path: "/admin/doctors", icon: "users" },
    { label: "Patients", path: "/admin/patients", icon: "user" },
    { label: "Settings", path: "/admin/settings", icon: "settings" },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", path: "/admin", icon: "home" },
    { label: "Hospitals", path: "/admin/hospitals", icon: "building" },
    { label: "Hospital Admins", path: "/admin/hospital-admins", icon: "shield" },
    { label: "Settings", path: "/admin/settings", icon: "settings" },
  ],
};

// Where each role lands right after login.
export const HOME_PATH_BY_ROLE = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  HOSPITAL_ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
};
