/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0057e7',
          light: '#e8f0ff',
        },
        accent: '#00c9a7',
      },
    },
  },
  plugins: [],
};
