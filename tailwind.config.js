/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#050705",
          screen: "#0a0d0a",
          green: "#00FF66",
          bright: "#00FF00",
          dim: "#008833",
          dark: "#003311",
          amber: "#FFCC00",
          red: "#FF3333",
          cyan: "#00F0FF",
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s step-start infinite',
        'flicker': 'flicker 0.15s infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        flicker: {
          '0%': { opacity: '0.97' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.98' },
        },
        scanline: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
};
