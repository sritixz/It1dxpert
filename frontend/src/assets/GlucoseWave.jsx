// GlucoseWave — the app's one signature visual: a stylized glucose trend
// line with a shaded target-range band, echoing the real Glucose Trends
// chart patients will see once logged in. Used on the auth brand panel
// instead of a generic gradient/blob, since this IS what the product
// actually shows people every day.

export function GlucoseWave({ className = "" }) {
  return (
    <svg
      viewBox="0 0 480 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of a glucose trend line staying within a healthy target range"
    >
      {/* Target range band */}
      <rect x="0" y="80" width="480" height="70" fill="white" fillOpacity="0.08" />
      <line x1="0" y1="80" x2="480" y2="80" stroke="white" strokeOpacity="0.25" strokeDasharray="4 6" />
      <line x1="0" y1="150" x2="480" y2="150" stroke="white" strokeOpacity="0.25" strokeDasharray="4 6" />

      {/* Trend line */}
      <path
        d="M0 120 C 40 90, 70 145, 110 130 S 180 95, 220 110 S 290 150, 330 125 S 400 95, 440 108 S 470 115, 480 112"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Data points */}
      {[
        [0, 120],
        [110, 130],
        [220, 110],
        [330, 125],
        [440, 108],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="5" fill="white" />
      ))}
    </svg>
  );
}
