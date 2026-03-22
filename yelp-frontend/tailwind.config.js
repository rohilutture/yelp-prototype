/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#fff5f0',
          100: '#ffe8db',
          200: '#ffc9aa',
          300: '#ffa070',
          400: '#ff6b35',
          500: '#e84c1e',
          600: '#c73a11',
          700: '#a52c0c',
          800: '#7f2209',
          900: '#5c1806',
        },
        surface: {
          0:   '#ffffff',
          50:  '#faf9f7',
          100: '#f3f1ed',
          200: '#e8e5df',
          800: '#2a2620',
          900: '#1a1714',
          950: '#0f0d0b',
        }
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.10)',
        glow: '0 0 0 3px rgba(232,76,30,0.18)',
      }
    }
  },
  plugins: []
}
