/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'dark-0': 'rgb(56 44 27)',
        'dark-1': 'rgb(56 44 27)',
        'dark-2': 'rgb(56 44 27)',
        'dark-3': 'rgb(56 44 27)',
        'light-1': '#e9c46a',
        'light-2': '#f4a261',
        'light-3': '#EE6C4D',
      },
      screens: {
        'landscape': { 'raw': 'all and (orientation: landscape)' },
        'portrait': { 'raw': 'all and (orientation: portrait)' },
        'tall': { 'raw': 'all and (min-height: 110vw)' },
        'xtall': { 'raw': 'all and (min-height: 150vw)' },
        'wide': { 'raw': 'all and (min-width: 110vh)' },
        'xwide': { 'raw': 'all and (min-width: 150vh)' },
      },
    },
  },
  plugins: [],
}
