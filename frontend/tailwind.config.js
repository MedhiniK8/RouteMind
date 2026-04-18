/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#17202A",
        muted: "#64748B",
        paper: "#F8FAFC",
        brand: "#0E7490",
        mint: "#0F766E",
        coral: "#E11D48",
        sun: "#F59E0B",
        leaf: "#16A34A",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};
