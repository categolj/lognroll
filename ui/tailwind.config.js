/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f5fb',
          100: '#ebebf7',
          200: '#d4d3ed',
          300: '#b8b6e0',
          400: '#9f9cce',
          500: '#8884d8',
          600: '#7370c7',
          700: '#5f5cb0',
          800: '#4d4a91',
          900: '#3d3b73',
        },
        accent: {
          400: '#ffb844',
          500: '#FFA411',
          600: '#bb760c',
          700: '#8a570a',
        },
        dark: {
          700: '#1a3a6a',
          800: '#0a1f4a',
          900: '#021230',
        },
        status: {
          success: '#5CBD9D',
          error: '#E74C3C',
          warning: '#F29C33',
          info: '#3998DB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
