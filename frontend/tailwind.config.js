/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // -----------------------------------------------------------------
      // Design tokens — see src/index.css for the CSS-variable source of
      // truth. Mirrored here so Tailwind utility classes (bg-primary,
      // text-ink, etc.) resolve to the same palette instead of drifting
      // from the CSS variables over time.
      // -----------------------------------------------------------------
      colors: {
        bg: "#8C6E58",
        surface: "#4A3525",
        surfaceInset: "#3D2B1F",
        ink: "#F4EDE4",
        muted: "#C4A48A",
        border: "rgba(255,255,255,0.08)",
        primary: {
          DEFAULT: "#1E6B65",
          dark: "#154F4B",
          light: "#20403C",
        },
        accent: {
          DEFAULT: "#E07A5F",
          dark: "#C15A40",
          light: "#4A2E22",
        },
        success: {
          DEFAULT: "#4EBA87",
          light: "#1E3A2C",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#4A3311",
        },
        critical: {
          DEFAULT: "#EF4444",
          light: "#4A1F1F",
        },
        info: {
          DEFAULT: "#38BDF8",
          light: "#1B3A4A",
        },
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22, 35, 58, 0.04), 0 4px 16px rgba(22, 35, 58, 0.06)",
        float: "0 20px 60px -12px rgba(22, 35, 58, 0.25)",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(24px, -32px) scale(1.08)" },
          "66%": { transform: "translate(-18px, 18px) scale(0.95)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "80%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        blob: "blob 14s infinite ease-in-out",
        "blob-delay": "blob 14s infinite ease-in-out -7s",
        float: "float 5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
