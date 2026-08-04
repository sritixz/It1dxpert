// GlucoseWave — the app's signature visual: a stylized glucose trend line
// with a shaded target-range band, echoing the real Glucose Trends chart
// patients see once logged in. The line draws itself in on mount (a
// clip-path reveal, not just a fade) and the data points pulse gently —
// small motion that reinforces "this is live, monitored data" rather than
// a static illustration.

import { motion } from "framer-motion";

const POINTS = [
  [0, 120],
  [110, 130],
  [220, 110],
  [330, 125],
  [440, 108],
];

export function GlucoseWave({ className = "", strokeColor = "white", fillColor = "white", fillOpacity = "0.08", gridColor = "white" }) {
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
      <motion.rect
        x="0" y="80" width="480" height="70" fill={fillColor} fillOpacity={fillOpacity}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <line x1="0" y1="80" x2="480" y2="80" stroke={gridColor} strokeOpacity="0.25" strokeDasharray="4 6" />
      <line x1="0" y1="150" x2="480" y2="150" stroke={gridColor} strokeOpacity="0.25" strokeDasharray="4 6" />

      {/* Trend line — draws itself in */}
      <motion.path
        d="M0 120 C 40 90, 70 145, 110 130 S 180 95, 220 110 S 290 150, 330 125 S 400 95, 440 108 S 470 115, 480 112"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />

      {/* Data points — gentle pulse, staggered */}
      {POINTS.map(([cx, cy], i) => (
        <g key={cx}>
          <circle
            cx={cx} cy={cy} r="9" fill={strokeColor} fillOpacity="0.18"
            className="origin-center animate-pulse-ring"
          />
          <motion.circle
            cx={cx} cy={cy} r="5" fill={strokeColor}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9 + i * 0.15, duration: 0.3, ease: "backOut" }}
          />
        </g>
      ))}
    </svg>
  );
}
