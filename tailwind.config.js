/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#004532",
        "on-primary": "#ffffff",
        "primary-container": "#065f46",
        "primary-fixed": "#a6f2d1",
        background: "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
      },
      fontFamily: {
        headline: ["Lexend", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
