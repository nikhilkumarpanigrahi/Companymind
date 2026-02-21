import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 10px 30px -15px rgba(17, 24, 39, 0.25)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.2)', opacity: '0' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 1.2s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
