import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', md: '2rem', lg: '3rem' },
      screens: { '2xl': '1320px' },
    },
    extend: {
      colors: {
        // Editorial palette — off-white canvas, deep ink accents.
        canvas: '#FAFAF7',
        ink: {
          DEFAULT: '#111111',
          50: '#F4F4F4',
          100: '#E6E6E6',
          200: '#CCCCCC',
          300: '#999999',
          400: '#666666',
          500: '#444444',
          600: '#2A2A2A',
          700: '#1C1C1C',
          800: '#141414',
          900: '#0A0A0A',
        },
        accent: {
          DEFAULT: '#7B3F00',
          warm: '#A4570D',
          cool: '#0A2E2A',
        },
        success: '#0F7A4A',
        danger: '#A8331E',
        warn: '#B57F1B',
        muted: '#6E6E68',
        line: '#E8E5DD',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Editorial scale.
        'display-xl': ['clamp(3rem, 8vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 3.75rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-md': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      letterSpacing: {
        kicker: '0.18em',
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: '8px',
        xl: '14px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.16)',
        cardHover: '0 1px 0 rgba(0,0,0,0.04), 0 18px 40px -18px rgba(0,0,0,0.24)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-bid': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(123, 63, 0, 0.08)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'pulse-bid': 'pulse-bid 1.4s ease-in-out 1',
      },
    },
  },
  plugins: [],
} satisfies Config;
