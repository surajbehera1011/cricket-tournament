import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          50: "#f8faff",
          100: "#eef2ff",
          200: "#e2e8f4",
        },
        dark: {
          50: "#1e293b",
          100: "#182036",
          200: "#141c2e",
          300: "#111827",
          400: "#0f172a",
          500: "#0d1321",
          600: "#0b0f1a",
          700: "#090c15",
          800: "#070a11",
          900: "#05070d",
        },
        pitch: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "tv-sm": "1.125rem",
        "tv-base": "1.25rem",
        "tv-lg": "1.5rem",
        "tv-xl": "2rem",
        "tv-2xl": "2.5rem",
        "tv-3xl": "3rem",
      },
      backgroundImage: {
        "hero-pattern": "url('/images/cricket-hero.jpg')",
      },
    },
  },
  plugins: [],
};

export default config;
