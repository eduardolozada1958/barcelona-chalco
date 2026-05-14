import type { Config } from 'tailwindcss';

/**
 * Design System – F.C. BARCELONA CUPIDO
 * Based on Material Design 3 palette extracted from Stitch mockups.
 * Tokens are intentionally kept with hyphenated names to match mockup class usage.
 */
const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      /* ─────────────────────── Colors (M3 Palette) ─────────────────────── */
      colors: {
        // Primary
        'primary':                '#f2ca50',
        'primary-container':      '#d4af37',
        'on-primary':             '#3c2f00',
        'on-primary-container':   '#554300',
        'primary-fixed':          '#ffe088',
        'primary-fixed-dim':      '#e9c349',
        'on-primary-fixed':       '#241a00',
        'on-primary-fixed-variant': '#574500',
        'inverse-primary':        '#735c00',

        // Secondary
        'secondary':              '#b3c5ff',
        'secondary-container':    '#2a4386',
        'on-secondary':           '#0d2c6e',
        'on-secondary-container': '#9bb3fd',
        'secondary-fixed':        '#dbe1ff',
        'secondary-fixed-dim':    '#b3c5ff',
        'on-secondary-fixed':     '#00174a',
        'on-secondary-fixed-variant': '#2a4386',

        // Tertiary
        'tertiary':               '#f3ca50',
        'tertiary-container':     '#d5af37',
        'on-tertiary':            '#3d2f00',
        'on-tertiary-container':  '#564300',
        'tertiary-fixed':         '#ffe08b',
        'tertiary-fixed-dim':     '#eac249',
        'on-tertiary-fixed':      '#241a00',
        'on-tertiary-fixed-variant': '#584400',

        // Surfaces
        'background':              '#131313',
        'on-background':           '#e5e2e1',
        'surface':                 '#131313',
        'surface-dim':             '#131313',
        'surface-bright':          '#3a3939',
        'surface-container-lowest':'#0e0e0e',
        'surface-container-low':   '#1c1b1b',
        'surface-container':       '#201f1f',
        'surface-container-high':  '#2a2a2a',
        'surface-container-highest':'#353534',
        'surface-variant':         '#353534',
        'surface-tint':            '#e9c349',
        'on-surface':              '#e5e2e1',
        'on-surface-variant':      '#d0c5af',
        'inverse-surface':         '#e5e2e1',
        'inverse-on-surface':      '#313030',

        // Outline
        'outline':                '#99907c',
        'outline-variant':        '#4d4635',

        // Error
        'error':                  '#ffb4ab',
        'error-container':        '#93000a',
        'on-error':               '#690005',
        'on-error-container':     '#ffdad6',

        // ── Legacy aliases (backward compat during migration) ──
        gold: {
          50:  '#FFF9E6', 100: '#FFF0B3', 200: '#FFE066', 300: '#FFD633',
          400: '#FFCC00', 500: '#D4AF37', 600: '#B8960C', 700: '#9A7D0A',
          800: '#7C6408', 900: '#5E4B06',
        },
        dark: {
          50: '#F0F0F5', 100: '#D1D1E0', 200: '#A3A3C2', 300: '#7575A3',
          400: '#474785', 500: '#1A1A2E', 600: '#161628', 700: '#121222',
          800: '#0E0E1C', 900: '#0A0A14',
        },
        navy: {
          500: '#0F3460', 600: '#0D2D56', 700: '#0B264D', 800: '#091E3D', 900: '#060F20',
        },
        success:  { light: '#4ADE80', DEFAULT: '#22C55E', dark: '#16A34A' },
        warning:  { light: '#FCD34D', DEFAULT: '#F59E0B', dark: '#D97706' },
        danger:   { light: '#F87171', DEFAULT: '#EF4444', dark: '#DC2626' },
      },

      /* ─────────────────────── Typography ─────────────────────── */
      fontFamily: {
        sans:              ['Inter', 'system-ui', 'sans-serif'],
        heading:           ['Montserrat', 'Inter', 'sans-serif'],   // Legacy alias
        mono:              ['JetBrains Mono', 'monospace'],
        // M3 semantic families
        'display-hero':    ['Montserrat', 'sans-serif'],
        'headline-lg':     ['Montserrat', 'sans-serif'],
        'headline-lg-mobile': ['Montserrat', 'sans-serif'],
        'body-md':         ['Inter', 'sans-serif'],
        'body-lg':         ['Inter', 'sans-serif'],
        'label-caps':      ['Anybody', 'sans-serif'],
        'stat-value':      ['Anybody', 'sans-serif'],
      },
      fontSize: {
        'display-hero':      ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-lg':       ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-lg-mobile':['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'stat-value':        ['40px', { lineHeight: '1.0', letterSpacing: '-0.04em', fontWeight: '700' }],
        'label-caps':        ['12px', { lineHeight: '1.0', letterSpacing: '0.1em', fontWeight: '700' }],
        'body-md':           ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-lg':           ['18px', { lineHeight: '1.6', fontWeight: '400' }],
      },

      /* ─────────────────────── Spacing ─────────────────────── */
      spacing: {
        'base':            '8px',
        'stack-sm':        '12px',
        'stack-md':        '24px',
        'stack-lg':        '48px',
        'gutter':          '24px',
        'margin-mobile':   '16px',
        'margin-desktop':  '48px',
        'container-max':   '1280px',
      },

      /* ─────────────────────── Backgrounds ─────────────────────── */
      backgroundImage: {
        'gold-gradient':  'linear-gradient(135deg, #D4AF37 0%, #F5D47A 50%, #D4AF37 100%)',
        'dark-gradient':  'linear-gradient(135deg, #131313 0%, #0e0e0e 100%)',
        'card-gradient':  'linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(15,52,96,0.9) 100%)',
        'hero-gradient':  'linear-gradient(to bottom, rgba(10,10,20,0.3), rgba(10,10,20,0.95))',
      },

      /* ─────────────────────── Shadows ─────────────────────── */
      boxShadow: {
        'gold':       '0 0 20px rgba(212,175,55,0.3)',
        'gold-lg':    '0 0 40px rgba(212,175,55,0.4)',
        'gold-glow':  '0 0 15px rgba(212,175,55,0.5)',
        'card':       '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.6)',
        'card-deep':  '0 20px 40px rgba(0,0,0,0.5)',
      },

      /* ─────────────────────── Animations ─────────────────────── */
      animation: {
        'fade-in':    'fadeIn 0.5s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn:  { '0%': { opacity: '0', transform: 'translateX(-20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,175,55,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(212,175,55,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      /* ─────────────────────── Border Radius ─────────────────────── */
      borderRadius: {
        DEFAULT: '0.25rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        '2xl':   '1rem',
        '3xl':   '1.5rem',
        '4xl':   '2rem',
        full:    '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
