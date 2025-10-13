import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#b91c1c', // red-700
          foreground: '#ffffff',
          hover: '#991b1b', // red-800
          light: '#dc2626' // red-600
        },
        // Accent colors
        accent: {
          DEFAULT: '#f97316', // orange-500
          foreground: '#ffffff',
          hover: '#ea580c', // orange-600
          light: '#fb923c' // orange-400
        },
        // Semantic colors
        success: {
          DEFAULT: '#16a34a', // green-600
          foreground: '#ffffff',
          light: '#22c55e' // green-500
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          foreground: '#000000',
          light: '#fbbf24' // amber-400
        },
        error: {
          DEFAULT: '#dc2626', // red-600
          foreground: '#ffffff',
          light: '#ef4444' // red-500
        },
        // Background and surface colors
        background: {
          DEFAULT: '#ffffff',
          dark: '#0f172a', // slate-900
          sepia: '#f5f3ed'
        },
        surface: {
          DEFAULT: '#f8fafc', // slate-50
          dark: '#1e293b', // slate-800
          sepia: '#e8e5da'
        },
        // Border colors
        border: {
          DEFAULT: '#e2e8f0', // slate-200
          dark: '#334155', // slate-700
          sepia: '#d4cdb8'
        },
        // Text colors
        foreground: {
          DEFAULT: '#0f172a', // slate-900
          muted: '#64748b', // slate-500
          dark: '#f8fafc', // slate-50
          'dark-muted': '#94a3b8', // slate-400
          sepia: '#3e3522',
          'sepia-muted': '#6b6149'
        }
      },
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      fontSize: {
        // Base scale with line heights
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        // Reading-optimized sizes
        'reader-sm': ['1rem', { lineHeight: '1.6rem' }],
        'reader-base': ['1.125rem', { lineHeight: '1.8rem' }],
        'reader-lg': ['1.25rem', { lineHeight: '2rem' }],
        'reader-xl': ['1.5rem', { lineHeight: '2.4rem' }]
      },
      // Spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      // Border radius
      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem'
      },
      // Box shadow (WCAG compliant focus rings)
      boxShadow: {
        'focus': '0 0 0 3px rgba(185, 28, 28, 0.1)',
        'focus-dark': '0 0 0 3px rgba(185, 28, 28, 0.3)'
      },
      // Transitions
      transitionDuration: {
        '250': '250ms'
      },
      // Z-index scale
      zIndex: {
        'modal': '50',
        'popover': '40',
        'overlay': '30',
        'dropdown': '20',
        'sticky': '10'
      },
      // Animation
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}

export default config
