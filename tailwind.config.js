/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        // Paleta Principal Migro
        migro: {
          green: {
            DEFAULT: '#C2F8DE', // Migro Green
            dark: '#059669',    // Hover, Acentos
            darker: '#065F46',  // Texto sobre fondos claros
            light: '#D1FAE5',   // Fondos suaves
          },
          blue: {
            DEFAULT: '#0066CC', // Enlaces
            dark: '#004A99',    // Hover enlaces
            light: '#DBEAFE',   // Info bg
          },
        },
        // Mapeo a tokens semánticos (shadcn/ui compatible)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "#C2F8DE", // Migro Green
        background: "#FFFFFF",
        foreground: "#1F2937", // Text Primary
        primary: {
          DEFAULT: "#059669", // Migro Green Dark - Primary Action Color
          foreground: "#FFFFFF", // White text on dark green
        },
        secondary: {
          DEFAULT: "#F3F4F6", // Background Tertiary
          foreground: "#1F2937",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280", // Text Secondary
        },
        accent: {
          DEFAULT: "#F9FAFB",
          foreground: "#065F46",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1F2937",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1F2937",
        },
        // Estados Semánticos
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#92400E',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#991B1B',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#1E40AF',
        },
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(31,41,55,0.05)',
        md: '0 4px 6px rgba(31,41,55,0.1)',
        lg: '0 10px 15px rgba(31,41,55,0.1)',
        xl: '0 20px 25px rgba(31,41,55,0.15)',
      },
    },
  },
  plugins: [],
}
