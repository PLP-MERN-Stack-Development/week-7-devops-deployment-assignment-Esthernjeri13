/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",   // ✅ Add this line
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // You can define custom colors here if needed
      colors: {
        border: '#d1d5db' // Optional: defines border-border if you really want it
      }
    },
  },
  plugins: [],
}
