import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        surface: {
          50: '#1e212b',
          100: '#171923',
          200: '#12141c',
          300: '#0d0f16',
          400: '#090a0f',
        },
        brand: {
          cyan: '#00f2fe',
          teal: '#4facfe',
          violet: '#7928ca',
          purple: '#9042f5',
          pink: '#ff0080',
          emerald: '#10b981',
          amber: '#f59e0b',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'mesh-glow': 'radial-gradient(at 0% 0%, rgba(79, 172, 254, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(144, 66, 245, 0.15) 0px, transparent 50%)',
      },
      animation: {
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'spin 12s linear infinite',
      },
      boxShadow: {
        'glass-sm': '0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-md': '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
        'glow-cyan': '0 0 25px -5px rgba(79, 172, 254, 0.5)',
        'glow-purple': '0 0 25px -5px rgba(144, 66, 245, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
