/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F17',
        surface: '#161F30',
        surfaceLight: '#1E293B',
        borderDark: '#26354A',
        brandCyan: '#00E5FF',
        brandPink: '#FF2A6D',
        brandRed: '#FF1355',
        brandRose: '#F43F5E',
        brandGold: '#EAB308',
        brandAmber: '#F59E0B',
        brandGreen: '#10B981',
        brandBlue: '#3B82F6',
        brandPurple: '#A855F7',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
