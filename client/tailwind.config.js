/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: {
          DEFAULT: '#111111',
          '2': '#1a1a1a',
          '3': '#222222',
        },
        border: 'rgba(255,255,255,0.08)',
        accent: {
          DEFAULT: '#6ee7b7',
          foreground: '#0a0a0a',
        },
        danger: '#f87171',
        text: {
          primary: '#fafafa',
          muted: '#71717a',
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}
