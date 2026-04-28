/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#FF10F0',
          cyan: '#00D9FF',
          purple: '#BD00FF',
          yellow: '#FFE600',
          green: '#00FF88',
          orange: '#FF6B35',
        },
        bg: {
          dark: '#0D0221',
          surface: '#1A0A2E',
          lighter: '#2D1B4E',
          darker: '#060113',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B8A5D0',
          muted: '#6B5B7A',
        },
        primary: {
          DEFAULT: '#FF10F0',
          dark: '#BD00FF',
          light: '#FF6BF0',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
        sans: ['Rajdhani', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}