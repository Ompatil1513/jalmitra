// JalMitra theme: leaf green + water teal + wheat gold on a sage "field" base.
// green/sky are re-mapped so every existing page picks up the farm palette automatically.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Mukta", "Noto Sans Devanagari", "Segoe UI", "sans-serif"],
        display: ["Baloo 2", "Mukta", "Noto Sans Devanagari", "sans-serif"],
      },
      colors: {
        field: "#E4EBD8",
        soil: { 600: "#6B4A2F", 700: "#54391F", 800: "#3B2916", 900: "#2B1D10" },
        wheat: { 100: "#F6EDCB", 200: "#EEDD9E", 400: "#D9B650", 600: "#A9821F" },
        green: {
          50: "#F1F6E9", 100: "#E0EBCB", 200: "#C3D9A0", 300: "#9CC26C", 400: "#77A646",
          500: "#5B8C32", 600: "#3F7A2C", 700: "#2F6226", 800: "#234A1E", 900: "#1A3818",
        },
        sky: {
          50: "#EEF6F7", 100: "#D8ECEF", 200: "#B3DAE1", 300: "#82C1CE", 400: "#4FA2B5",
          500: "#2E869D", 600: "#226D84", 700: "#1D5A6C", 800: "#1B4959", 900: "#173D4A",
        },
      },
      boxShadow: {
        raised: "8px 8px 18px rgba(86,108,62,.28), -8px -8px 18px rgba(255,255,255,.85)",
        "raised-sm": "4px 4px 9px rgba(86,108,62,.26), -4px -4px 9px rgba(255,255,255,.85)",
        pressed: "inset 4px 4px 9px rgba(86,108,62,.27), inset -4px -4px 9px rgba(255,255,255,.8)",
      },
    },
  },
  plugins: [],
};
