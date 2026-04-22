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
        cricket: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
      },
      fontSize: {
        "tv-sm": "1.125rem",
        "tv-base": "1.25rem",
        "tv-lg": "1.5rem",
        "tv-xl": "2rem",
        "tv-2xl": "2.5rem",
        "tv-3xl": "3rem",
      },
    },
  },
  plugins: [],
};

export default config;
