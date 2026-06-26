/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        th: {
          bg:        '#0d0d14',
          sidebar:   '#0a0a11',
          chat:      '#111118',
          accent:    '#7c5cfc',
          'accent-hover': '#9b7ffe',
          'accent-dim': '#3d2d8a',
          green:     '#00c853',
          red:       '#ff3b5c',
          text:      '#e8e8f0',
          muted:     '#8888aa',
          border:    '#1e1e2e',
          'input-bg': '#1a1a26',
          'bubble-own': '#3d2d8a',
          'bubble-other': '#1a1a26',
          'member-panel': '#0a0a11',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.15s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 92, 252, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(124, 92, 252, 0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
