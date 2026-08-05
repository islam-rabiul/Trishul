import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff5ee',
          100: '#ffe6d4',
          200: '#ffc9a7',
          300: '#f69a6e',
          400: '#e66f48',
          500: '#cc4c2e',
          600: '#aa3724',
          700: '#872a20',
          800: '#6e241f',
          900: '#3b1716',
        },
        dark: {
          bg: '#f8f3ed',
          surface: '#fffdfa',
          border: '#e8d7ca',
          text: '#33242a',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
