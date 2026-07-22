import { Card } from "../../components/ui/Card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function PatientDashboardPlaceholder() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <p className="font-display text-lg font-bold text-ink">
          Welcome back{user?.patientProfile?.fullName ? `, ${user.patientProfile.fullName.split(" ")[0]}` : ""} 👋
        </p>
        <p className="mt-1 font-body text-sm text-muted">
          The app shell and auth are wired up. Daily Log, Glucose Trends, and Medications screens are next.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Glucose (Latest)", "Carbs (Today)", "Insulin (Today)", "Activity (Today)"].map((label) => (
          <Card key={label}>
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="numeral mt-1 text-2xl font-semibold text-ink">—</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
