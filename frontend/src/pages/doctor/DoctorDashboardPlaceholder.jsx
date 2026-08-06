import { Card } from "../../components/ui/Card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function DoctorDashboardPlaceholder() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden">
        <p className="font-display text-xl font-bold text-ink">
          Welcome back, Dr. {user?.doctorProfile?.fullName ? user.doctorProfile.fullName.split(" ").slice(1).join(" ") || user.doctorProfile.fullName : "Care Provider"} 👋
        </p>
        <p className="mt-1 font-body text-sm text-muted">
          Accessing the dashboard for your assigned patients, real-time alerts, and appointments.
        </p>

        {/* Doctor and Hospital details */}
        <div className="flex flex-wrap gap-2 mt-4 font-body text-xs text-muted">
          <span className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 shadow-xs">
            Practitioner: <strong className="text-ink">{user?.doctorProfile?.fullName}</strong>
          </span>
          {user?.doctorProfile?.specialization && (
            <span className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 shadow-xs">
              Specialization: <strong className="text-ink">{user.doctorProfile.specialization}</strong>
            </span>
          )}
          {user?.doctorProfile?.hospital && (
            <span className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 shadow-xs">
              Hospital: <strong className="text-ink">{user.doctorProfile.hospital.name}</strong>
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 shadow-xs">
            Account Role: <strong className="text-ink capitalize">{user?.role?.replace("_", " ").toLowerCase()}</strong>
          </span>
        </div>
      </Card>
    </div>
  );
}
