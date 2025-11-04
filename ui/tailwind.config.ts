// ui/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f14",
        card: "#10161e",
        edge: "#1a2230",
        text: "#e6edf3",
        sub: "#9fb0c3",
        accent: "#39d0ff"
      }
    }
  },
  plugins: []
} satisfies Config;
