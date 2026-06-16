/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090D16',
        darkCard: 'rgba(17, 25, 40, 0.75)',
        brandIndigo: '#6366F1',
        brandCyan: '#06B6D4'
      }
    },
  },
  plugins: [],
}
