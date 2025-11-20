/**
 * Ecovilla Community Platform - Design Tokens
 * Version: 1.0
 * 
 * This file contains all design tokens for the Ecovilla platform.
 * Copy this entire file content into your app/globals.css
 * 
 * DO NOT modify token values here - refer to WP2_Design_Tokens_Specification.md
 * for rationale and usage guidelines.
 */

@import "tailwindcss";

@layer base {
  /**
   * ===================
   * LIGHT MODE (Default)
   * ===================
   */
  :root {
    /* ===== FOREST CANOPY (Primary Brand) ===== */
    --forest-deep: 100 54% 16%;           /* #2D5016 - Deep Forest */
    --forest-canopy: 100 48% 33%;         /* #4A7C2C - Living Canopy */
    --forest-growth: 96 38% 45%;          /* #6B9B47 - Fresh Growth */
    
    /* ===== SUNRISE (Accent & Energy) ===== */
    --sunrise: 20 61% 55%;                /* #D97742 - Sunrise Orange */
    --sunrise-soft: 20 61% 95%;           /* Soft tint for backgrounds */
    
    /* ===== SKY & WATER (Supporting - Information) ===== */
    --river: 196 28% 50%;                 /* #5B8FA3 - River Current */
    --sky: 196 35% 60%;                   /* #7BA5B8 - Clear Sky */
    --dew: 196 47% 93%;                   /* #E8F2F5 - Morning Dew */
    
    /* ===== SEMANTIC COLORS (Status & Feedback) ===== */
    --success: var(--forest-growth);      /* Success/Available */
    --warning: 33 47% 64%;                /* #D4A574 - Honey */
    --error: 6 50% 55%;                   /* #C25B4F - Clay */
    --info: var(--river);                 /* Information */
    
    /* ===== EARTH & CLAY (Neutrals) ===== */
    --soil: 0 0% 10%;                     /* #1A1A1A - Rich Soil (primary text) */
    --stone: 0 0% 29%;                    /* #4A4A4A - Weathered Stone (secondary text) */
    --mist: 0 0% 55%;                     /* #8C8C8C - Morning Mist (disabled) */
    --sand: 36 9% 89%;                    /* #E8E5E0 - Sand (borders) */
    --cloud: 40 17% 97%;                  /* #F8F6F3 - Cloud (canvas) */
    --sunlight: 0 0% 100%;                /* #FFFFFF - Sunlight (cards) */
    
    /* ===== SHADCN COMPATIBILITY (Semantic Mappings) ===== */
    --background: var(--cloud);
    --foreground: var(--soil);
    
    --card: var(--sunlight);
    --card-foreground: var(--soil);
    
    --popover: var(--sunlight);
    --popover-foreground: var(--soil);
    
    --primary: var(--forest-growth);
    --primary-foreground: var(--sunlight);
    
    --secondary: var(--sunrise);
    --secondary-foreground: var(--sunlight);
    
    --muted: var(--cloud);
    --muted-foreground: var(--stone);
    
    --accent: var(--dew);
    --accent-foreground: var(--forest-deep);
    
    --destructive: var(--error);
    --destructive-foreground: var(--sunlight);
    
    --border: var(--sand);
    --input: var(--sand);
    --ring: var(--forest-canopy);
    
    /* ===== SPACING SCALE (8pt Grid System) ===== */
    --space-1: 0.25rem;    /* 4px - Tight groupings */
    --space-2: 0.5rem;     /* 8px - Related elements */
    --space-3: 0.75rem;    /* 12px - Form fields, compact */
    --space-4: 1rem;       /* 16px - Base unit (default) */
    --space-5: 1.5rem;     /* 24px - Section spacing */
    --space-6: 2rem;       /* 32px - Major sections */
    --space-8: 3rem;       /* 48px - Large breaks */
    --space-10: 4rem;      /* 64px - Page-level separation */
    
    /* Semantic Spacing */
    --space-comfortable: var(--space-4);  /* Default spacing */
    --space-cozy: var(--space-3);         /* Compact */
    --space-relaxed: var(--space-6);      /* Generous */
    
    /* ===== BORDER RADIUS (Organic Feel) ===== */
    --radius-sm: 0.5rem;    /* 8px - Badges, tags */
    --radius-md: 0.75rem;   /* 12px - Buttons, inputs (default) */
    --radius-lg: 1rem;      /* 16px - Cards */
    --radius-xl: 1.25rem;   /* 20px - Modals, dialogs */
    --radius-full: 9999px;  /* Pills, avatars */
    
    /* Shadcn radius compatibility */
    --radius: var(--radius-md);
    
    /* ===== SHADOWS (Nature-Inspired, Soft) ===== */
    --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    
    /* Special Shadows */
    --shadow-sunrise: 0 2px 8px rgb(217 119 66 / 0.2); /* For Sunrise CTAs */
    
    /* ===== TYPOGRAPHY ===== */
    --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'JetBrains Mono', 'Courier New', monospace;
    
    /* Font Sizes - Mobile First (320px-767px) */
    --text-xs: 0.75rem;      /* 12px - Caption */
    --text-sm: 0.8125rem;    /* 13px - Body Small, Labels */
    --text-base: 0.9375rem;  /* 15px - Body (default) */
    --text-lg: 1.0625rem;    /* 17px - Body Large */
    --text-xl: 1.125rem;     /* 18px - H3 */
    --text-2xl: 1.375rem;    /* 22px - H2 */
    --text-3xl: 1.75rem;     /* 28px - H1 */
    
    /* Line Heights */
    --leading-none: 1;
    --leading-tight: 1.2;
    --leading-snug: 1.3;
    --leading-normal: 1.5;
    --leading-relaxed: 1.6;
    
    /* Font Weights */
    --font-normal: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;
    
    /* Letter Spacing */
    --tracking-tighter: -0.5px;
    --tracking-tight: -0.25px;
    --tracking-normal: 0;
    --tracking-wide: 0.25px;
    --tracking-wider: 0.5px;
    
    /* ===== ANIMATIONS & TRANSITIONS ===== */
    /* UI Transitions */
    --transition-fast: 150ms;        /* Hover, focus */
    --transition-base: 200ms;        /* Default */
    --transition-slow: 300ms;        /* Complex changes */
    --transition-wind: 400ms;        /* "Wind through leaves" */
    
    /* Easing Curves */
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-wind: cubic-bezier(0.4, 0.0, 0.2, 1);
    --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    
    /* Character Animation (Río Avatar - Placeholder for WP4) */
    --animation-character-enter: 500ms;
    --animation-character-idle: 2000ms;
    --animation-character-exit: 400ms;
    --animation-character-react: 300ms;
    --ease-character: cubic-bezier(0.4, 0.0, 0.2, 1);
    
    /* ===== ACCESSIBILITY ===== */
    --focus-ring-width: 2px;
    --focus-ring-offset: 2px;
    --focus-ring-color: hsl(var(--forest-canopy));
    
    --touch-target-min: 44px;  /* iOS standard */
    --touch-target-comfortable: 48px;
  }
  
  /**
   * ===================
   * DARK MODE
   * ===================
   * Contextual dark - maintains warmth and earth tones
   */
  .dark {
    /* Background & Surfaces */
    --background: var(--soil);              /* Deep Soil #1A1A1A */
    --foreground: var(--sunlight);          /* White text */
    
    --card: 0 0% 18%;                       /* Night Forest #2D2D2D */
    --card-foreground: var(--sunlight);
    
    --popover: 0 0% 20%;
    --popover-foreground: var(--sunlight);
    
    /* Primary colors - lightened for contrast */
    --primary: 96 38% 55%;                  /* Lightened Forest Growth */
    --primary-foreground: var(--soil);
    
    --secondary: var(--sunrise);            /* Sunrise unchanged */
    --secondary-foreground: var(--sunlight);
    
    /* Neutrals - inverted */
    --muted: var(--stone);
    --muted-foreground: var(--sand);
    
    --accent: 0 0% 25%;
    --accent-foreground: var(--sunlight);
    
    --destructive: var(--error);
    --destructive-foreground: var(--sunlight);
    
    /* Borders */
    --border: 0 0% 25%;                     /* Twilight Stone #404040 */
    --input: 0 0% 25%;
    --ring: var(--forest-growth);
    
    /* Shadows - higher opacity for dark mode */
    --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
  }
  
  /**
   * ===================
   * RESPONSIVE TYPOGRAPHY
   * Desktop Enhancement (768px+)
   * ===================
   */
  @media (min-width: 768px) {
    :root {
      --text-base: 1rem;       /* 16px */
      --text-lg: 1.125rem;     /* 18px */
      --text-xl: 1.25rem;      /* 20px */
      --text-2xl: 1.5rem;      /* 24px */
      --text-3xl: 2rem;        /* 32px */
    }
  }
  
  /**
   * ===================
   * ACCESSIBILITY: HIGH CONTRAST MODE
   * ===================
   */
  @media (prefers-contrast: high) {
    :root {
      /* Increase contrast by 20% */
      --color-border: hsl(0, 0%, 0%);
      --color-text: hsl(0, 0%, 0%);
      --border-width: 2px;
    }
    
    .dark {
      --color-border: hsl(0, 0%, 100%);
      --color-text: hsl(0, 0%, 100%);
    }
  }
  
  /**
   * ===================
   * ACCESSIBILITY: REDUCED MOTION
   * ===================
   */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  /**
   * ===================
   * BASE STYLES
   * ===================
   */
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Smooth scrolling (respects reduced motion) */
  html {
    scroll-behavior: smooth;
  }
  
  /* Ensure proper font size inheritance */
  html {
    font-size: 100%; /* Respects browser/system defaults */
  }
}

/**
 * ===================
 * UTILITY CLASSES
 * (Optional - for quick prototyping)
 * ===================
 */
@layer utilities {
  /* Touch Targets */
  .touch-target {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
  }
  
  .touch-target-comfortable {
    min-height: var(--touch-target-comfortable);
    min-width: var(--touch-target-comfortable);
  }
  
  /* Focus Ring */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
    --tw-ring-color: var(--focus-ring-color);
  }
  
  /* Sunrise Shadow (for CTAs) */
  .shadow-sunrise {
    box-shadow: var(--shadow-sunrise);
  }
}

/**
 * ===================
 * COMPONENT STATE TOKENS
 * (Reference - actual implementation in components)
 * ===================
 */

/* 
Default State: Base appearance
- Use standard tokens

Hover State: Mouse over
- Duration: var(--transition-fast)
- Effect: Lighten/darken 10%, optional lift

Active State: Being clicked
- Duration: Instant
- Effect: Scale 98%, darken 5%

Focus State: Keyboard navigation
- Ring: var(--focus-ring-width) solid var(--focus-ring-color)
- Offset: var(--focus-ring-offset)

Disabled State: Cannot interact
- Opacity: 50%
- Cursor: not-allowed
- Color: var(--mist)

Loading State: Processing
- Spinner in primary color
- Layout preserved

Success State: Confirmation
- Color: var(--success) / var(--forest-growth)
- Icon: Checkmark
- Optional: Auto-dismiss

Error State: Problem indication
- Color: var(--error) / var(--clay)
- Icon: Alert/X
- Clear next step message
*/

/**
 * ===================
 * NOTES FOR WP3
 * ===================
 * 
 * Next Steps (Component Building):
 * 1. Install shadcn/ui components
 * 2. Apply these tokens to all components
 * 3. Build custom Ecovilla components
 * 4. Create Storybook documentation
 * 5. Implement 8-state system per component
 * 
 * Río Avatar Animation:
 * - Full implementation in WP4
 * - Tokens reserved above
 * - Technology TBD (Lottie/SVG/Rive)
 * 
 * Design References:
 * - See WP2_Design_Tokens_Specification.md for rationale
 * - See WP2_Component_Guidelines.md for usage patterns
 * - Gather Mobbin references before WP3
 */