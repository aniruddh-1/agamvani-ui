/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Sacred Spiritual Color Palette (matching anbhe-docs-ui)
        spiritual: {
          // Saffron shades - Primary spiritual color
          saffron: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#FF9933', // Main saffron
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
            950: '#431407',
          },
          // Lotus Pink - Sacred feminine energy
          lotus: {
            50: '#FDF2F8',
            100: '#FCE7F3',
            200: '#FBCFE8',
            300: '#F9A8D4',
            400: '#F472B6',
            500: '#EC4899',
            600: '#DB2777',
            700: '#BE185D',
            800: '#9D174D',
            900: '#831843',
            950: '#500724',
          },
          // Cosmic Blue - Infinite consciousness
          cosmic: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#1E40AF', // Royal blue for wisdom
            700: '#1E3A8A',
            800: '#1E3A8A',
            900: '#1E3A8A',
            950: '#172554',
          },
          // Golden - Enlightenment and divine light
          golden: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B', // Main golden yellow
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
            950: '#451A03',
          },
        },
        
        // Shortcut saffron colors for easier use
        saffron: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF9933',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Spiritual breathing animation
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
        },
        // Lotus bloom animation
        "lotus-bloom": {
          "0%": { transform: "scale(0.8) rotate(-10deg)", opacity: "0" },
          "50%": { transform: "scale(1.1) rotate(5deg)", opacity: "0.8" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        // Peaceful fade
        "peaceful-fade": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Sacred glow
        "sacred-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 153, 51, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 153, 51, 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "breathe": "breathe 3s ease-in-out infinite",
        "lotus-bloom": "lotus-bloom 0.8s ease-out forwards",
        "peaceful-fade": "peaceful-fade 0.6s ease-out forwards",
        "sacred-glow": "sacred-glow 2s ease-in-out infinite",
      },
      fontFamily: {
        // Sacred typography
        'sacred': ['Inter', 'system-ui', 'sans-serif'],
        'devanagari': ['Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'spiritual': '0 10px 40px rgba(255, 153, 51, 0.1)',
        'sacred': '0 20px 60px rgba(255, 153, 51, 0.15)',
        'divine': '0 30px 80px rgba(255, 153, 51, 0.2)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add custom plugin for spiritual utilities
    function({ addUtilities }) {
      addUtilities({
        '.text-spiritual-gradient': {
          background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-spiritual-gradient': {
          background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)',
        },
        '.glass-spiritual': {
          background: 'rgba(255, 153, 51, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 153, 51, 0.2)',
        },
      })
    }
  ],
}
