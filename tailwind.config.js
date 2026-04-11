import { defineConfig } from 'vite';

export default defineConfig({
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'pop': 'pop 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        'float': 'float 3s ease-in-out infinite',
        'burst': 'burst 0.6s ease-out forwards',
        'shimmer': 'shimmer 1.5s linear infinite',
        'heartBeat': 'heartBeat 0.3s ease-in-out',
        'levelUp': 'levelUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        burst: {
          '0%': { transform: 'scale(0.2)', opacity: '1' },
          '80%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        levelUp: {
          '0%': { transform: 'scale(0.5) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(1.2) rotate(8deg)' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
});
