/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: '#fff1ee',
            muted: '#ffd6cc',
            subtle: '#ffb3a0',
            DEFAULT: '#ff6b4a',
            emphasis: '#e85a3a',
            inverted: '#ffffff',
          },
          background: {
            muted: '#13151c',
            subtle: '#1a1d27',
            DEFAULT: '#0b0c10',
            emphasis: '#2a2e3a',
          },
          border: {
            DEFAULT: '#2a2e3a',
          },
          ring: {
            DEFAULT: '#ff6b4a',
          },
          content: {
            subtle: '#9ca3af',
            DEFAULT: '#f5f5f7',
            emphasis: '#ffffff',
            strong: '#ffffff',
            inverted: '#0b0c10',
          },
        },
      },
    },
  },
  plugins: [],
};
