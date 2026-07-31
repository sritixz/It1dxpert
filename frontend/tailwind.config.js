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
        bg: "#F6F8FB",
        surface: "#FFFFFF",
        ink: "#16233A",
        muted: "#5B6B82",
        border: "#E2E8F0",
        primary: {
          DEFAULT: "#2B6CB0",
          dark: "#1E4E85",
          light: "#EAF2FB",
        },
        success: {
          DEFAULT: "#2F9E6E",
          light: "#E7F6EF",
        },
        warning: {
          DEFAULT: "#C2831F",
          light: "#FBF1DF",
        },
        critical: {
          DEFAULT: "#C4432E",
          light: "#FAEAE7",
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
