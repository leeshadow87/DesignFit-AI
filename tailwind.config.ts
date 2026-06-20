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
        brand: {
          50: "#e7f5f0",
          100: "#c3e6d8",
          500: "#0f766e",
          600: "#0b5f59",
          700: "#094f4a",
          900: "#062f2c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
