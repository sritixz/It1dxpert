import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const ROLE_LABELS = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  HOSPITAL_ADMIN: "Hospital Admin",
  SUPER_ADMIN: "Super Admin",
};

export function Topbar({ title, onOpenMobileNav }) {
  const { user, logout } = useAuth();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8 py-4 lg:py-5 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink hover:bg-bg"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base sm:text-xl font-bold text-ink truncate">{title}</h1>
          <p className="text-xs sm:text-sm text-muted truncate">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="text-right hidden sm:block">
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
