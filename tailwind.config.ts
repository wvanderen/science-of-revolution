import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#b91c1c',
          foreground: '#ffffff'
        },
        accent: '#f97316'
      }
    }
  },
  plugins: []
}

export default config
