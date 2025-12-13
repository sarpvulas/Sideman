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
        primary: {
          900: "#1a1625",
          800: "#2d2640",
          700: "#3d3356",
          600: "#5c4d7a",
          500: "#7c6b9e",
          400: "#9d8fc2",
          300: "#c4b8e0",
          200: "#e0d9f0",
          100: "#f5f3fa",
        },
        accent: {
          gold: "#d4af37",
          "gold-glow": "#ffd700",
          coral: "#ff6b6b",
          "coral-glow": "#ff8a8a",
          teal: "#4ecdc4",
          "teal-glow": "#7ee8e1",
          amber: "#f5a623",
        },
        piano: {
          white: "#fefefe",
          "white-pressed": "#e8e8e8",
          black: "#1a1a1a",
          "black-pressed": "#333333",
          "highlight-root": "#d4af37",
          "highlight-third": "#4ecdc4",
          "highlight-seventh": "#9d8fc2",
          "highlight-tension": "#ff6b6b",
        },
      },
      fontFamily: {
        display: ["Instrument Serif", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        xs: "0.667rem",
        sm: "0.833rem",
        base: "1rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "1.875rem",
        "3xl": "2.25rem",
        "4xl": "3rem",
        "5xl": "4rem",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(212, 175, 55, 0.4)",
        "glow-coral": "0 0 20px rgba(255, 107, 107, 0.4)",
        "glow-teal": "0 0 20px rgba(78, 205, 196, 0.4)",
        "glow-purple": "0 0 20px rgba(157, 143, 194, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        "bounce-gentle": "bounce-gentle 1s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
