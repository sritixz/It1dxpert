import { Card } from "../../components/ui/Card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const ROLE_LABELS = { HOSPITAL_ADMIN: "Hospital Admin", SUPER_ADMIN: "Super Admin" };

export function AdminDashboardPlaceholder() {
  const { user } = useAuth();

  return (
    <Card>
      <p className="font-display text-lg font-bold text-ink">
        Welcome, {ROLE_LABELS[user?.role] || "Admin"}
      </p>
      <p className="mt-1 font-body text-sm text-muted">
        Auth and the app shell are wired up. Doctor/patient management screens are next.
      </p>
    </Card>
  );
}
