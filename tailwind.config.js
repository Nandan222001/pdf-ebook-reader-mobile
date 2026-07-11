/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: ['nativewind/preset'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'serif'],
        display: ['Georgia', 'serif'],
        sans: ['System', 'sans-serif'],
      },
      colors: {
        'book-bg': '#1a1a2e',
        'book-surface': '#26263e',
        'book-accent': '#a855f7',
        'book-text': '#e5e5eb',
        'book-muted': '#9494a8',
        'book-border': '#373750',
        'book-highlight': '#facc15',
        // Light theme
        'book-bg-light': '#f7f7f5',
        'book-surface-light': '#ffffff',
        'book-accent-light': '#8b5cf6',
        'book-text-light': '#1e1e23',
        'book-muted-light': '#787882',
        'book-border-light': '#dcdcd7',
        // Sepia theme
        'book-bg-sepia': '#f4e9d2',
        'book-surface-sepia': '#fcf3df',
        'book-accent-sepia': '#b45309',
        'book-text-sepia': '#4a3423',
        'book-muted-sepia': '#8b7355',
        'book-border-sepia': '#d2bea0',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
