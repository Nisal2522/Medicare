/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        accent: '#38bdf8',
      },
      boxShadow: {
        'card-soft': '0 10px 30px rgba(0, 0, 0, 0.05)',
        'card-lift': '0 12px 40px rgba(0, 0, 0, 0.07)',
      },
    },
  },
  plugins: [],
}
