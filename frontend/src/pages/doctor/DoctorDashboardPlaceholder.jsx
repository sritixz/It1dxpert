import { Card } from "../../components/ui/Card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function DoctorDashboardPlaceholder() {
  const { user } = useAuth();

  return (
    <Card>
      <p className="font-display text-lg font-bold text-ink">
        Welcome{user?.doctorProfile?.fullName ? `, Dr. ${user.doctorProfile.fullName.split(" ").pop()}` : ""}
      </p>
      <p className="mt-1 font-body text-sm text-muted">
        Auth and the app shell are wired up. Patient list and alerts screens are next.
      </p>
    </Card>
  );
}
