import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const ROLE_LABELS = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  HOSPITAL_ADMIN: "Hospital Admin",
  SUPER_ADMIN: "Super Admin",
};

export function Topbar({ title }) {
  const { user, logout } = useAuth();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-8 py-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-muted">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-body text-sm font-semibold text-ink">{user?.patientProfile?.fullName || user?.doctorProfile?.fullName || user?.email}</p>
          <p className="text-xs text-muted">{ROLE_LABELS[user?.role] || user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-bg hover:text-critical"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
