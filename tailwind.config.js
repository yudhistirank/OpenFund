/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      colors: {
        // Base network color scheme
        'base': {
          'blue': {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          }
        },
        'crypto': {
          'blue': '#0052FF',
          'light-blue': '#E6F0FF',
          'gray': '#6B7280',
          'light-gray': '#F9FAFB',
          'white': '#FFFFFF',
          'black': '#111827',
        }
      },
      backgroundImage: {
        'gradient-base': 'linear-gradient(135deg, #0052FF 0%, #0ea5e9 100%)',
        'gradient-light': 'linear-gradient(135deg, #E6F0FF 0%, #f0f9ff 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}