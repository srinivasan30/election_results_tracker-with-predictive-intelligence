import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "count-up": "countUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        countUp: { "0%": { transform: "scale(0.8)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      backgroundImage: {
        "dmk-gradient": "linear-gradient(135deg, #1a0000 0%, #8B0000 50%, #CC0000 100%)",
        "aiadmk-gradient": "linear-gradient(135deg, #003300 0%, #006600 50%, #00AA00 100%)",
        "tvk-gradient": "linear-gradient(135deg, #4A0000 0%, #CC0000 50%, #FFD700 100%)",
        "ntk-gradient": "linear-gradient(135deg, #660000 0%, #CC0000 50%, #FF6600 100%)",
        "others-gradient": "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
