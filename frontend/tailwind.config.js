/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e94560',
          dark: '#c73a52',
          light: '#ff6b84',
        },
        dark: {
          DEFAULT: '#1a1a2e',
          lighter: '#16213e',
          darker: '#0f0f1a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
