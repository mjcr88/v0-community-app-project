import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ============================================
      // ECOVILLA COLOR SYSTEM
      // ============================================
      colors: {
        // Forest Canopy (Primary Brand)
        forest: {
          deep: "hsl(var(--forest-deep))",
          canopy: "hsl(var(--forest-canopy))",
          light: "hsl(var(--forest-light))",
          mist: "hsl(var(--forest-mist))",
        },
        
        // Sunrise (Energy & Accent)
        sunrise: {
          ember: "hsl(var(--sunrise-ember))",
          orange: "hsl(var(--sunrise-orange))",
          warm: "hsl(var(--sunrise-warm))",
          glow: "hsl(var(--sunrise-glow))",
        },
        
        // Sky (Info & Calm)
        sky: {
          deep: "hsl(var(--sky-deep))",
          blue: "hsl(var(--sky-blue))",
          light: "hsl(var(--sky-light))",
          whisper: "hsl(var(--sky-whisper))",
        },
        
        // Honey (Warning & Attention)
        honey: {
          amber: "hsl(var(--honey-amber))",
          yellow: "hsl(var(--honey-yellow))",
          soft: "hsl(var(--honey-soft))",
          pale: "hsl(var(--honey-pale))",
        },
        
        // Clay (Error & Critical)
        clay: {
          terracotta: "hsl(var(--clay-terracotta))",
          red: "hsl(var(--clay-red))",
          soft: "hsl(var(--clay-soft))",
          pale: "hsl(var(--clay-pale))",
        },
        
        // Morning Mist (Disabled & Optional)
        mist: {
          stone: "hsl(var(--mist-stone))",
          gray: "hsl(var(--mist-gray))",
          light: "hsl(var(--mist-light))",
          whisper: "hsl(var(--mist-whisper))",
        },
        
        // Earth Neutrals (Surfaces & Text)
        earth: {
          soil: "hsl(var(--earth-soil))",
          stone: "hsl(var(--earth-stone))",
          sand: "hsl(var(--earth-sand))",
          pebble: "hsl(var(--earth-pebble))",
          cloud: "hsl(var(--earth-cloud))",
          snow: "hsl(var(--earth-snow))",
        },
        
        // Carmen's Exchange Semantic Colors
        exchange: {
          available: "hsl(var(--exchange-available))",
          borrowed: "hsl(var(--exchange-borrowed))",
          reserved: "hsl(var(--exchange-reserved))",
          overdue: "hsl(var(--exchange-overdue))",
          damaged: "hsl(var(--exchange-damaged))",
        },
        
        // Semantic Aliases (for shadcn compatibility)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      
      // ============================================
      // SPACING SYSTEM (8px grid)
      // ============================================
      spacing: {
        "space-0": "0",
        "space-0.5": "0.125rem",   // 2px - micro adjustments
        "space-1": "0.25rem",      // 4px - smallest gap
        "space-2": "0.5rem",       // 8px - base unit
        "space-3": "0.75rem",      // 12px
        "space-4": "1rem",         // 16px - standard padding
        "space-5": "1.25rem",      // 20px
        "space-6": "1.5rem",       // 24px - section spacing
        "space-8": "2rem",         // 32px
        "space-10": "2.5rem",      // 40px
        "space-12": "3rem",        // 48px
        "space-16": "4rem",        // 64px - large sections
        "space-20": "5rem",        // 80px
        "space-24": "6rem",        // 96px
        "space-32": "8rem",        // 128px - hero sections
      },
      
      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        // Mobile-first sizes
        "xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],      // 12px
        "sm": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],  // 14px
        "base": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0" }],          // 16px
        "lg": ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }], // 18px
        "xl": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],  // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],     // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],// 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.03em" }],  // 36px
        "5xl": ["3rem", { lineHeight: "1", letterSpacing: "-0.03em" }],          // 48px
        
        // Desktop enhancement (use with lg: breakpoint)
        "display-sm": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em" }],  // 36px
        "display-md": ["3rem", { lineHeight: "3.5rem", letterSpacing: "-0.03em" }],      // 48px
        "display-lg": ["3.75rem", { lineHeight: "4.25rem", letterSpacing: "-0.03em" }],  // 60px
        "display-xl": ["4.5rem", { lineHeight: "5rem", letterSpacing: "-0.04em" }],      // 72px
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      
      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        sm: "8px",      // Small: badges, tags
        DEFAULT: "12px", // Default: buttons, inputs
        md: "12px",     // Medium (same as default)
        lg: "16px",     // Large: cards, containers
        xl: "20px",     // XL: modals, dialogs
        "2xl": "24px",  // 2XL: hero sections
        full: "9999px", // Pill buttons
      },
      
      // ============================================
      // SHADOWS
      // ============================================
      boxShadow: {
        xs: "var(--shadow-xs)",   // Subtle lift
        sm: "var(--shadow-sm)",   // Cards at rest
        md: "var(--shadow-md)",   // Cards on hover
        lg: "var(--shadow-lg)",   // Modals, dropdowns
        xl: "var(--shadow-xl)",   // Overlays, popovers
      },
      
      // ============================================
      // ANIMATIONS & TRANSITIONS
      // ============================================
      transitionDuration: {
        "quick": "150ms",    // Micro-interactions
        "base": "200ms",     // Default UI transitions
        "smooth": "300ms",   // Smooth state changes
        "rio": "500ms",      // Río character animations
      },
      transitionTimingFunction: {
        "natural": "cubic-bezier(0.4, 0.0, 0.2, 1)", // Default easing
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Playful
      },
      
      // ============================================
      // BREAKPOINTS (Tailwind defaults + custom)
      // ============================================
      screens: {
        xs: "475px",
        sm: "640px",  // Mobile landscape
        md: "768px",  // Tablet
        lg: "1024px", // Desktop
        xl: "1280px", // Large desktop
        "2xl": "1536px",
      },
      
      // ============================================
      // Z-INDEX LAYERS
      // ============================================
      zIndex: {
        "dropdown": "1000",
        "sticky": "1020",
        "fixed": "1030",
        "modal-backdrop": "1040",
        "modal": "1050",
        "popover": "1060",
        "tooltip": "1070",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;