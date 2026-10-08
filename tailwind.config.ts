import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          50: "#0b0f17",
          100: "#101726",
          200: "#172138",
          300: "#1f2d4d",
          400: "#2d3f66",
        },
        brand: {
          50: "#eef2ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: {
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          violet: "#8b5cf6",
        }
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s infinite ease-in-out",
        "flow-dash": "flowDash 1.2s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.05)" },
        },
        flowDash: {
          to: { strokeDashoffset: "-20" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
