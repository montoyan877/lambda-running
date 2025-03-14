/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-100': 'var(--color-dark-100)',
        'dark-200': 'var(--color-dark-200)',
        'dark-300': 'var(--color-dark-300)',
        'dark-hover': 'var(--color-dark-hover)',
        'dark-border': 'var(--color-dark-border)',
        
        'primary-500': 'var(--color-primary-500)',
        'primary-600': 'var(--color-primary-600)',
        
        'secondary-500': 'var(--color-secondary-500)',
        'secondary-600': 'var(--color-secondary-600)',
        
        'terminal-background': '#0e1117',
        'terminal-foreground': '#c8d3f5'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      opacity: {
        '10': '0.1',
        '30': '0.3'
      }
    },
  },
  plugins: [],
} 