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
      },
    },
  },
  plugins: [],
};
