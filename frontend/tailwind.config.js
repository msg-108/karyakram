/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        karyakram: {
          red:    { 50: '#FCEBEB', 200: '#F09595', 600: '#C41E3A', 800: '#791F1F', 900: '#501313' }, // Primary: Crimson
          gold:   { 50: '#FDF6E3', 200: '#F0DBA3', 600: '#D4AF37', 800: '#8A6E1E', 900: '#5C4A14' }, // Accent: Gold
          indigo: { 50: '#EEF2FF', 200: '#C7D2FE', 600: '#4F46E5', 800: '#3730A3', 900: '#312E81' }, // Secondary: Indigo
        }
      }
    },
  },
  plugins: [],
}
