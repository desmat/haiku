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
        'dark-0': '#2C1B38',
        'dark-1': '#2C1B38',
        'dark-2': '#2C1B38',
        'dark-3': '#2C1B38',
        'light-1': '#e9c46a',
        'light-2': '#f4a261',
        'light-3': '#EE6C4D',
      },
    },
  },
  plugins: [],
}
