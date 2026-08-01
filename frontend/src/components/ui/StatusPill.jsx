// StatusPill — the colored status indicator used on the Patients list and
// Glucose Monitor screens. Maps 1:1 to the status values the backend
// actually computes (doctor.service.js's computeStatus) — IN_RANGE, HIGH,
// LOW, INACTIVE. No "Low Normal" sub-tier, unlike the reference mockup,
// since the backend doesn't compute that distinction (see the blueprint's
// note on the mockup being internally inconsistent about it).

const STATUS_CONFIG = {
  IN_RANGE: { label: "In Range", className: "bg-success-light text-success" },
  HIGH: { label: "High", className: "bg-critical-light text-critical" },
  LOW: { label: "Low", className: "bg-warning-light text-warning" },
  INACTIVE: { label: "Inactive", className: "bg-bg text-muted" },
};

export function StatusPill({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.INACTIVE;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-body text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}