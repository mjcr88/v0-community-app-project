# WP2: Design Tokens Specification
## Ecovilla Community Platform Design System

**Version**: 1.0  
**Created**: November 2024  
**Owner**: MJ + Design Team  
**Status**: Ready for Implementation

---

## Executive Summary

This document defines the complete design token system for the Ecovilla Community Platform. These tokens create a consistent visual language that serves our diverse user base while honoring our nature-first, regenerative design philosophy.

**What This Document Contains:**
- Complete color system with semantic meanings
- Typography scale (mobile + desktop)
- Spacing system (8px grid)
- Border radius, shadow, and animation tokens
- Accessibility considerations
- Dark mode specifications
- Persona-aligned design decisions

**What This Document Does NOT Contain:**
- Component implementation (that's WP3)
- Screen designs (that's WP5-6)
- Storybook stories (that's WP3)

---

## Design Philosophy Recap

### Our North Star
**"Technology should serve human connection and ecological regeneration, never the other way around."**

### Core Design Values

1. **Regenerative by Design** - Every interaction leaves users energized, not depleted
2. **Belonging Through Inclusivity** - Sofia, Marcus, Elena, and Carmen all feel the platform was designed for them
3. **Nature as North Star** - Visual language rooted in Costa Rican cloud forests
4. **Efficiency with Warmth** - Streamlined without feeling cold
5. **Mindful Transparency** - Users always understand what's happening

---

## Persona-Informed Design Decisions

Our design tokens serve four primary personas. While everyone sees the same design system, each persona benefits in specific ways:

### Sofia (The Newcomer)
**Needs:** Safety, clarity, reassurance
**Design Response:**
- Sky Blue for calm, trustworthy information
- Generous spacing reduces overwhelm
- Clear hierarchy helps navigation
- Softer shadows feel approachable

### Marcus (The Coordinator)
**Needs:** Efficiency, quick-scan, clear status
**Design Response:**
- Sunrise Orange for urgent coordination moments
- Honey Yellow for "needs attention but not critical"
- Strong contrast for at-a-glance understanding
- Efficient spacing enables dense information

### Elena (The Balanced Resident)
**Needs:** Calm, selective emphasis, low distraction
**Design Response:**
- Muted neutrals don't scream for attention
- Morning Mist de-emphasizes optional content
- Generous whitespace supports mindful consumption
- Subtle animations respect focus

### Carmen (The Resource Coordinator)
**Needs:** Status clarity, data density, system management
**Design Response:**
- Expanded semantic palette (available, borrowed, overdue, damaged)
- Clear visual hierarchy for spreadsheet replacement
- Status colors enable quick coordination
- Efficient layouts for tool/resource management

---

## Color System

### Philosophy
Our palette draws from the **Costa Rican cloud forest at dawn** - when morning light filters through canopy, mist rises from earth, and community awakens.

Colors are **universal** (not persona-specific) but serve different needs:
- Think traffic lights: everyone sees red/yellow/green, but drivers and pedestrians use them differently

---

### Primary Palette

#### Forest Canopy (Primary Brand)

**Deep Forest**: `#2D5016` / `hsl(100, 54%, 16%)`
- **Use:** Darkest brand color, high-contrast text
- **Psychology:** Grounding, stability, roots
- **Where:** Dark mode primary, high-emphasis text

**Living Canopy**: `#4A7C2C` / `hsl(100, 48%, 33%)`
- **Use:** Primary brand color
- **Psychology:** Growth, vitality, life force
- **Where:** Primary buttons (non-Sunrise), navigation active states, links

**Fresh Growth**: `#6B9B47` / `hsl(96, 38%, 45%)`
- **Use:** Primary actions, success states
- **Psychology:** Renewal, possibility, emergence
- **Where:** Success messages, available status (Carmen), confirmation buttons

**Why Green as Primary:**
- Universally positive (growth, nature, "go")
- Calms Sofia's anxiety
- Clear for Marcus's coordination
- Unobtrusive for Elena's selective participation
- Status-neutral for Carmen's resource management

---

#### Sunrise (Accent & Energy)

**Sunrise Orange**: `#D97742` / `hsl(20, 61%, 55%)`
- **Use:** **Sunrise Moments ONLY** - community gathering, urgent coordination
- **Psychology:** Warmth, energy, social connection
- **Where:** Event invitations, community check-ins, urgent CTAs, celebration moments

**Sunrise Soft** (tint): `hsl(20, 61%, 95%)`
- **Use:** Sunrise backgrounds, hover states
- **Psychology:** Gentle warmth
- **Where:** Sunrise button hover, notification backgrounds

**Critical Rule:** 
- Reserve Sunrise Orange for moments that matter
- Creates Pavlovian association: "Something good happening in community NOW"
- Overuse dilutes impact
- Marcus coordination urgency = Sunrise
- Regular actions = Forest Canopy

---

#### Sky & Water (Supporting - Information)

**River Current**: `#5B8FA3` / `hsl(196, 28%, 50%)`
- **Use:** Informational messages, links, "borrowed" status
- **Psychology:** Calm, trust, flow
- **Where:** Info alerts, secondary links, borrowed items (Carmen), tips

**Clear Sky**: `#7BA5B8` / `hsl(196, 35%, 60%)`
- **Use:** Hover states for Sky elements, lighter information
- **Psychology:** Openness, clarity
- **Where:** Link hover, info card backgrounds

**Morning Dew**: `#E8F2F5` / `hsl(196, 47%, 93%)`
- **Use:** Subtle backgrounds for info sections
- **Psychology:** Fresh, clean, gentle
- **Where:** Info card backgrounds, subtle emphasis

**Why Blue for Information:**
- Universal "info" color (not error, not success)
- Calms Sofia during learning
- Clear differentiation from action (green) and urgency (orange)
- Neutral status for Carmen's coordination

---

#### Semantic Palette (Status & Feedback)

**Success/Available**: `#6B9B47` (Fresh Growth)
- **Use:** Success confirmations, available items, positive feedback
- **Examples:** "RSVP confirmed", tool available, action completed

**Warning/Attention**: `#D4A574` (Honey)
- **Use:** Needs attention but not critical
- **Psychology:** Caution, awareness, priority
- **Examples:** Overdue tool return (Carmen), low capacity event, upcoming deadline
- **Why Honey:** Natural (from bees), suggests "sweet" reminder not harsh alarm

**Error/Urgent**: `#C25B4F` (Clay)
- **Use:** Errors, critical issues, destructive actions
- **Psychology:** Stop, problem, needs immediate resolution
- **Examples:** Failed save, damaged item, access denied
- **Why Clay:** Earthy (not pure red), aligns with nature palette

**Information**: `#5B8FA3` (River Current)
- **Use:** Neutral information, tips, FYI messages
- **Examples:** "Event capacity 8/20", helpful tips, status updates

---

### Earth & Clay (Neutrals)

**Rich Soil**: `#1A1A1A` / `hsl(0, 0%, 10%)`
- **Use:** Primary text (light mode), dark mode background
- **Psychology:** Foundation, depth, grounding

**Weathered Stone**: `#4A4A4A` / `hsl(0, 0%, 29%)`
- **Use:** Secondary text, icons
- **Psychology:** Stability, age, wisdom

**Morning Mist**: `#8C8C8C` / `hsl(0, 0%, 55%)`
- **Use:** Disabled states, de-emphasized content
- **Psychology:** Ephemeral, optional, low priority
- **Where:** Disabled buttons, optional fields, Elena's "skip this" content

**Sand**: `#E8E5E0` / `hsl(36, 9%, 89%)`
- **Use:** Borders, dividers, subtle backgrounds
- **Psychology:** Boundary, gentle separation

**Cloud**: `#F8F6F3` / `hsl(40, 17%, 97%)`
- **Use:** Page background (light mode), card backgrounds
- **Psychology:** Spacious, breathable, calm

**Sunlight**: `#FFFFFF` / `hsl(0, 0%, 100%)`
- **Use:** Cards, modals, highest emphasis backgrounds
- **Psychology:** Clarity, purity, focus

---

### Dark Mode Palette

**Philosophy:** Contextual dark mode maintains warmth and nature aesthetic

**NOT pure black** - Keeps earth-toned warmth even at night

#### Dark Mode Specific

**Deep Soil** (background): `#1A1A1A`
- Warm black, not stark #000000

**Night Forest** (cards): `#2D2D2D` / `hsl(0, 0%, 18%)`
- Elevated surfaces, cards, modals

**Twilight Stone** (borders): `#404040` / `hsl(0, 0%, 25%)`
- Borders, dividers

**Primary Colors in Dark Mode:**
- Forest Canopy: Lightened 10% for contrast
- Sunrise Orange: Unchanged (already vibrant)
- Sky Blue: Lightened 5%
- Neutrals: Inverted (light text on dark bg)

---

### Accessibility Requirements

#### WCAG AA Compliance (Minimum)

**Light Mode:**
- Primary text (Rich Soil) on Cloud: 14.5:1 ✓
- Secondary text (Weathered Stone) on Cloud: 7.2:1 ✓
- Forest Canopy on Cloud: 5.8:1 ✓
- Sunrise Orange on Sunlight: 4.6:1 ✓

**Dark Mode:**
- Sunlight text on Deep Soil: 15.8:1 ✓
- Sand text on Deep Soil: 11.2:1 ✓
- Forest Growth on Deep Soil: 6.1:1 ✓

**High Contrast Mode:**
- Activates when `prefers-contrast: high`
- Increases contrast by 20%
- Borders become pure black/white
- Text becomes pure black/white

---

### Color Usage Matrix

| Element | Light Mode | Dark Mode | Use Case |
|---------|-----------|-----------|----------|
| **Actions** |
| Primary CTA | Sunrise Orange | Sunrise Orange | Join Event, Create Post |
| Secondary Action | Forest Canopy | Forest Growth | View Details, Edit |
| Tertiary/Ghost | River Current | Clear Sky | Cancel, Skip |
| **Status** |
| Success | Fresh Growth | Fresh Growth | Saved, Confirmed |
| Warning | Honey | Honey | Attention Needed |
| Error | Clay | Clay | Failed, Invalid |
| Info | River Current | Clear Sky | FYI, Tips |
| **Content** |
| Primary Text | Rich Soil | Sunlight | Body copy |
| Secondary Text | Weathered Stone | Sand | Captions, meta |
| Disabled | Morning Mist | Morning Mist | Inactive |
| **Surfaces** |
| Page Background | Cloud | Deep Soil | Canvas |
| Card | Sunlight | Night Forest | Elevated content |
| Border | Sand | Twilight Stone | Dividers |

---

## Typography System

### Font Families

#### Inter (Primary - All UI)
**Why Inter:**
- Highly legible at small sizes (outdoor mobile use)
- Slightly rounded terminals (approachable, not corporate)
- Variable font = performance optimization
- Excellent on-screen rendering
- Works in bright Costa Rican sunlight

**Weights Used:**
- 400 (Regular) - Body text, content
- 500 (Medium) - Subtle emphasis
- 600 (Semibold) - Headings, buttons
- 700 (Bold) - Page titles, strong emphasis

**Installation:**
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})
```

---

#### JetBrains Mono (Data/Code)
**Why JetBrains Mono:**
- Clear distinction between UI and data
- Excellent for coordinates, timestamps, technical info
- Tabular numbers for Carmen's resource management

**Weight Used:**
- 400 (Regular)

**Use Cases:**
- Timestamps (event times, message timestamps)
- GPS coordinates (map data)
- Technical data (lot numbers, IDs)
- Code snippets (if any)

---

### Type Scale

#### Mobile-First (Default - Base for 320px-767px)

| Element | Size | Weight | Line Height | Letter Spacing | Use Case |
|---------|------|--------|-------------|----------------|----------|
| **H1** (Page Title) | 28px | 700 | 1.2 (33.6px) | -0.5px | Dashboard, main pages |
| **H2** (Section) | 22px | 700 | 1.3 (28.6px) | -0.25px | Content sections |
| **H3** (Subsection) | 18px | 600 | 1.4 (25.2px) | 0 | Cards, subsections |
| **Body Large** | 17px | 400 | 1.5 (25.5px) | 0 | Emphasis, intros |
| **Body** (Default) | 15px | 400 | 1.6 (24px) | 0 | Main content |
| **Body Small** | 13px | 400 | 1.5 (19.5px) | 0 | Captions, metadata |
| **Caption** | 12px | 500 | 1.4 (16.8px) | 0.25px | Labels, hints |
| **Button** | 16px | 600 | 1 (16px) | 0.5px | All buttons |
| **Label** | 13px | 600 | 1.2 (15.6px) | 0.5px | Form labels |

---

#### Desktop Enhancement (768px+)

| Element | Size | Adjustment | Rationale |
|---------|------|------------|-----------|
| H1 | 32px | +4px | Larger screens = more impact |
| H2 | 24px | +2px | Subtle scale |
| H3 | 20px | +2px | Proportional |
| Body Large | 18px | +1px | Comfortable reading |
| Body | 16px | +1px | Standard desktop size |
| Body Small | 14px | +1px | Still readable |
| Caption | 12px | No change | Small enough |
| Button | 16px | No change | Consistent interaction |
| Label | 13px | No change | Form consistency |

---

### Typography Tokens (CSS Variables)

```css
/* Font Families */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;

/* Font Sizes - Mobile First */
--text-xs: 0.75rem;      /* 12px - Caption */
--text-sm: 0.8125rem;    /* 13px - Body Small, Labels */
--text-base: 0.9375rem;  /* 15px - Body (default) */
--text-lg: 1.0625rem;    /* 17px - Body Large */
--text-xl: 1.125rem;     /* 18px - H3 */
--text-2xl: 1.375rem;    /* 22px - H2 */
--text-3xl: 1.75rem;     /* 28px - H1 */

/* Desktop Adjustments (768px+) */
@media (min-width: 768px) {
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 2rem;        /* 32px */
}

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
```

---

### Typography Usage Guidelines

#### Headings
```tsx
// H1 - Page titles
<h1 className="text-3xl font-bold text-foreground leading-tight tracking-tighter">
  Welcome to Ecovilla
</h1>

// H2 - Sections
<h2 className="text-2xl font-bold text-foreground leading-snug tracking-tight">
  Upcoming Events
</h2>

// H3 - Subsections
<h3 className="text-xl font-semibold text-foreground leading-snug">
  Build Day Tomorrow
</h3>
```

#### Body Text
```tsx
// Body - Main content
<p className="text-base text-foreground leading-relaxed">
  Join us for a community build day...
</p>

// Body Large - Emphasis
<p className="text-lg text-foreground leading-normal">
  Important announcement...
</p>

// Body Small - Metadata
<span className="text-sm text-muted-foreground leading-normal">
  Posted 2 hours ago by Marcus
</span>
```

#### Interactive Text
```tsx
// Link
<a className="text-base font-medium text-river hover:text-sky underline-offset-2">
  View full calendar
</a>

// Button text
<button className="text-base font-semibold">
  Join Event
</button>

// Label
<label className="text-sm font-semibold text-foreground tracking-wide">
  Email Address
</label>
```

---

### Typography Accessibility

**Readability Rules:**
1. **Max Line Length**: 65-75 characters for body text
2. **Minimum Size**: 15px body text on mobile (WCAG AA)
3. **Contrast**: All text meets 4.5:1 minimum
4. **Responsive**: Respect user's system font size preferences
5. **Line Height**: 1.5+ for body text (improves readability for dyslexia)

**Dynamic Type Support:**
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}

/* Font size follows system settings */
html {
  font-size: 100%; /* Respects browser/system defaults */
}
```

---

## Spacing System

### Philosophy
Space is **intentional silence** - moments to breathe, process, transition. Like forest trails with clearings, our layouts guide without crowding.

**8-Point Grid System:**
- All spacing is a multiple of 8px
- Exception: 4px for rare tight groupings
- Creates mathematical rhythm
- Easier designer-developer handoff
- Consistent across mobile and desktop

---

### Spacing Scale

| Token | Value | Rem | Use Case |
|-------|-------|-----|----------|
| `space-1` | 4px | 0.25rem | Icon-to-text, tight couples |
| `space-2` | 8px | 0.5rem | Related elements, list items |
| `space-3` | 12px | 0.75rem | Form field spacing, compact cards |
| `space-4` | 16px | 1rem | **Base unit** - default spacing |
| `space-5` | 24px | 1.5rem | Section spacing, card padding |
| `space-6` | 32px | 2rem | Major sections, page margins |
| `space-8` | 48px | 3rem | Large section breaks |
| `space-10` | 64px | 4rem | Page-level separation |

---

### Spacing Tokens (CSS Variables)

```css
/* Spacing Scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px - Base */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
--space-10: 4rem;     /* 64px */

/* Semantic Spacing */
--space-comfortable: var(--space-4);  /* Default element spacing */
--space-cozy: var(--space-3);         /* Compact layouts */
--space-relaxed: var(--space-6);      /* Generous layouts */
```

---

### Layout Guidelines

#### Mobile (320px - 767px)
- **Edge Padding**: 16px (space-4)
- **Internal Spacing**: 12px (space-3)
- **Single Column**: Full width
- **Cards**: Full width with 16px margins

```tsx
<div className="px-4 py-6">  {/* Edge padding */}
  <div className="space-y-4">  {/* Vertical rhythm */}
    <Card />
    <Card />
  </div>
</div>
```

#### Tablet (768px - 1023px)
- **Edge Padding**: 24px (space-5 + space-1)
- **Gutter**: 24px between columns
- **Columns**: 2-column grid

```tsx
<div className="px-6 py-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card />
    <Card />
  </div>
</div>
```

#### Desktop (1024px+)
- **Max Width**: 1200px (centered)
- **Edge Padding**: 32px (space-6)
- **Gutter**: 32px
- **Columns**: 3-4 column grid

```tsx
<div className="container mx-auto max-w-7xl px-8 py-10">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <Card />
    <Card />
    <Card />
  </div>
</div>
```

---

### Touch Targets

**Minimum Size:** 44x44px (iOS standard)
**Recommended:** 48x48px for primary actions

```tsx
// Good - Meets minimum
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="w-5 h-5" />
</button>

// Better - Generous padding
<button className="min-h-[48px] px-6 py-3">
  Join Event
</button>
```

---

### Whitespace Strategy

**40% Rule:** Aim for 40% of screen to be whitespace

**Vertical Rhythm Patterns:**
```tsx
// Tight - Related content
<div className="space-y-1">  {/* 4px */}

// Default - Standard sections
<div className="space-y-4">  {/* 16px */}

// Generous - Major sections
<div className="space-y-6">  {/* 32px */}

// Dramatic - Page sections
<div className="space-y-8">  {/* 48px */}
```

---

## Border Radius System

### Philosophy
Rounded corners create **organic, approachable feel** - aligned with nature-first design. Consistent rounding across elements creates visual harmony.

---

### Radius Scale

| Token | Value | Use Case |
|-------|-------|----------|
| `radius-sm` | 8px | Badges, tags, small chips |
| `radius-md` | 12px | **Default** - Buttons, inputs, small cards |
| `radius-lg` | 16px | Cards, modals, elevated surfaces |
| `radius-xl` | 20px | Large modals, dialogs, hero cards |
| `radius-full` | 9999px | Pill buttons, avatars, fully rounded |

---

### Radius Tokens (CSS Variables)

```css
--radius-sm: 0.5rem;    /* 8px */
--radius-md: 0.75rem;   /* 12px - Default */
--radius-lg: 1rem;      /* 16px */
--radius-xl: 1.25rem;   /* 20px */
--radius-full: 9999px;  /* Fully rounded */
```

---

### Usage Examples

```tsx
// Small - Badge
<Badge className="rounded-sm">  {/* 8px */}
  New
</Badge>

// Default - Button
<Button className="rounded-md">  {/* 12px */}
  Join Event
</Button>

// Card
<Card className="rounded-lg">  {/* 16px */}
  Content
</Card>

// Modal
<Dialog className="rounded-xl">  {/* 20px */}
  Modal content
</Dialog>

// Avatar
<Avatar className="rounded-full">  {/* Fully round */}
  <AvatarImage src="..." />
</Avatar>

// Pill Button
<Button className="rounded-full px-8">  {/* 9999px */}
  Subscribe
</Button>
```

---

## Shadow System

### Philosophy
Shadows create **depth and elevation** but should feel **soft and natural** - like light filtering through forest canopy, not harsh office lighting.

**Nature-Inspired Shadows:**
- Soft edges (large blur radius)
- Low opacity (gentle, not harsh)
- Warm undertones in light mode
- Cool undertones in dark mode

---

### Shadow Scale (5 Levels)

| Token | Use Case | Elevation |
|-------|----------|-----------|
| `shadow-xs` | Subtle borders, gentle separation | 1-2px |
| `shadow-sm` | Default cards, slight lift | 4px |
| `shadow-md` | Hover states, dropdowns | 8px |
| `shadow-lg` | Modals, popovers, emphasis | 16px |
| `shadow-xl` | Dialogs, maximum elevation | 24px |

**Special:**
- `shadow-sunrise` - For Sunrise Orange CTAs (warmer, energetic)

---

### Shadow Tokens (CSS Variables)

```css
/* Light Mode Shadows */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 
             0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 
             0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 
             0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 
             0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Special Shadow - Sunrise CTA */
--shadow-sunrise: 0 2px 8px rgb(217 119 66 / 0.2);

/* Dark Mode Shadows (higher opacity) */
.dark {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.4), 
               0 1px 2px -1px rgb(0 0 0 / 0.4);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 
               0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 
               0 4px 6px -4px rgb(0 0 0 / 0.4);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.4), 
               0 8px 10px -6px rgb(0 0 0 / 0.4);
}
```

---

### Usage Examples

```tsx
// Subtle - Divider alternative
<Card className="shadow-xs">

// Default - Card
<Card className="shadow-sm">

// Hover - Interactive lift
<Card className="shadow-sm hover:shadow-md transition-shadow">

// Popover/Dropdown
<Popover className="shadow-lg">

// Modal
<Dialog className="shadow-xl">

// Sunrise CTA
<Button className="bg-sunrise shadow-sunrise">
  Join Event
</Button>
```

---

## Animation System

### Philosophy
Motion should feel **organic and natural** - like wind through leaves, not mechanical transitions. Animation **reduces cognitive load** by showing relationships and state changes.

**Key Principles:**
1. **Purposeful** - Every animation has a reason
2. **Subtle** - Never distracting or overwhelming
3. **Natural** - Easing curves mimic nature
4. **Respectful** - Honor `prefers-reduced-motion`

---

### Animation Tokens

#### Duration
```css
/* UI Transitions (Fast) */
--transition-fast: 150ms;        /* Hover, focus */
--transition-base: 200ms;        /* Default transitions */
--transition-slow: 300ms;        /* Complex state changes */

/* Natural Motion (Slow) */
--transition-wind: 400ms;        /* "Wind through leaves" */

/* Character Animation (Río Avatar - Placeholder) */
--animation-character-enter: 500ms;  /* Río appears */
--animation-character-idle: 2000ms;  /* Río idle breathing */
--animation-character-exit: 400ms;   /* Río leaves */
/* Note: Full Río implementation in WP4 */
```

#### Easing Curves
```css
/* Standard Easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Default */
--ease-out: cubic-bezier(0, 0, 0.2, 1);          /* Enters */
--ease-in: cubic-bezier(0.4, 0, 1, 1);           /* Exits */

/* Natural Easing */
--ease-wind: cubic-bezier(0.4, 0.0, 0.2, 1);     /* Organic movement */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful */
```

---

### Animation Usage

#### Transitions (Most Common)
```tsx
// Hover state
<Button className="
  transition-colors duration-fast
  hover:bg-forest-canopy/90
">

// Multiple properties
<Card className="
  transition-all duration-base
  hover:shadow-md hover:scale-[1.02]
">

// Slow, complex
<Dialog className="
  transition-opacity duration-slow ease-in-out
">
```

#### Keyframe Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide In from Bottom */
@keyframes slideInFromBottom {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Wind Through Leaves (Gentle Float) */
@keyframes windFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
```

Usage:
```tsx
<div className="animate-fadeIn duration-base">
  Content appears
</div>

<Card className="animate-slideInFromBottom duration-slow">
  Card enters from bottom
</Card>
```

---

### Reduced Motion Support

**Critical Accessibility:**
```css
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
```

---

## Responsive Design System

### Breakpoints

```css
/* Mobile (Default) */
/* 320px - 767px */
/* Base styles, mobile-first */

/* Tablet */
@media (min-width: 768px) {
  /* 768px - 1023px */
}

/* Desktop */
@media (min-width: 1024px) {
  /* 1024px - 1439px */
}

/* Large Desktop */
@media (min-width: 1440px) {
  /* 1440px+ */
}
```

---

### Device Strategy

**60% Mobile-First:**
- All base styles optimized for mobile
- Touch-friendly interactions
- Generous spacing for thumbs
- Single-column layouts default

**40% Desktop Enhancement:**
- Multi-column layouts
- Hover states
- Keyboard shortcuts
- Increased information density

**Rationale:**
- Sofia, Elena, Carmen = heavy mobile users
- Marcus = split mobile/desktop
- Younger residents = mobile-native
- Older residents = may prefer desktop

---

### Responsive Patterns

#### Typography
```css
/* Mobile first */
--text-base: 15px;
--text-3xl: 28px;

/* Desktop enhancement */
@media (min-width: 768px) {
  --text-base: 16px;
  --text-3xl: 32px;
}
```

#### Spacing
```css
/* Mobile - Tighter */
.container {
  padding: var(--space-4);  /* 16px */
}

/* Desktop - More generous */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);  /* 32px */
  }
}
```

#### Grids
```tsx
// Responsive grid
<div className="
  grid 
  grid-cols-1                    /* Mobile: 1 column */
  md:grid-cols-2                 /* Tablet: 2 columns */
  lg:grid-cols-3                 /* Desktop: 3 columns */
  gap-4 md:gap-6 lg:gap-8        /* Responsive gaps */
">
```

---

## Accessibility Token System

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    /* Increase all contrasts by 20% */
    --color-border: #000000;
    --color-text: #000000;
    --color-background: #FFFFFF;
    
    /* Thicker borders */
    --border-width: 2px;
  }
  
  .dark {
    --color-border: #FFFFFF;
    --color-text: #FFFFFF;
    --color-background: #000000;
  }
}
```

---

### Focus States

**Critical for Keyboard Navigation:**
```css
--focus-ring-width: 2px;
--focus-ring-offset: 2px;
--focus-ring-color: var(--color-forest-canopy);

/* Usage */
.focusable:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

```tsx
// In components
<button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-forest-canopy 
  focus:ring-offset-2
">
```

---

### Reduced Motion

Already covered in Animation System, but bears repeating:

**ALL animations must respect user preference:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component State System

**Note:** This section defines **rules and tokens** for component states. Actual component implementation happens in WP3.

### The 8 Required States

Every interactive component MUST support these 8 states:

---

#### 1. Default (Rest)
**Visual:** Base appearance, unactivated
**Token Usage:** Standard colors, no special effects
**Example:**
```tsx
<Button className="bg-forest-canopy text-white">
  Default State
</Button>
```

---

#### 2. Hover
**Visual:** Subtle lift or color shift
**Duration:** `--transition-fast` (150ms)
**Token Usage:** Lighten/darken 10%, optional lift
**Example:**
```tsx
<Button className="
  bg-forest-canopy 
  hover:bg-forest-canopy/90 
  hover:scale-[1.02]
  transition-all duration-fast
">
```

---

#### 3. Active (Pressed)
**Visual:** "Press down" feedback
**Duration:** Instant (<50ms)
**Token Usage:** Scale down 98%, darken 5%
**Example:**
```tsx
<Button className="
  active:scale-[0.98] 
  active:bg-forest-deep
">
```

---

#### 4. Focus (Keyboard Navigation)
**Visual:** Clear ring indicator
**Token Usage:** 
- Ring: 2px solid `--focus-ring-color`
- Offset: 2px
**Example:**
```tsx
<Button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-forest-canopy 
  focus:ring-offset-2
">
```

---

#### 5. Disabled
**Visual:** Grayed out, non-interactive
**Token Usage:**
- Opacity: 50%
- Cursor: not-allowed
- Color: `--color-mist` (Morning Mist)
**Example:**
```tsx
<Button 
  disabled
  className="
    disabled:opacity-50 
    disabled:cursor-not-allowed
  "
>
```

---

#### 6. Loading
**Visual:** Spinner or skeleton, layout preserved
**Token Usage:** Spinner uses primary color
**Example:**
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <Spinner className="text-white" />
  ) : (
    "Submit"
  )}
</Button>
```

---

#### 7. Success
**Visual:** Confirmation, often temporary
**Token Usage:** 
- Color: `--color-forest-growth` (Fresh Growth)
- Icon: Checkmark
- Optional: Auto-dismiss after 2-3s
**Example:**
```tsx
<Button className="
  bg-forest-growth 
  text-white
">
  <CheckIcon className="mr-2" />
  Saved
</Button>
```

---

#### 8. Error
**Visual:** Clear problem indication
**Token Usage:**
- Color: `--color-clay` (Clay Red)
- Icon: Alert/X
- Message: Clear next step
**Example:**
```tsx
<Button className="
  bg-clay 
  text-white
">
  <AlertIcon className="mr-2" />
  Failed - Retry
</Button>
```

---

### State Transition Rules

**Allowed Transitions:**
- Default ↔ Hover ↔ Active
- Default ↔ Focus
- Any State → Disabled
- Any State → Loading
- Loading → Success or Error
- Success/Error → Default (after timeout or user action)

**Forbidden Transitions:**
- Disabled → Any (requires becoming enabled first)
- Success/Error → Hover/Active (without passing through Default)

---

## Río Avatar Animation (Placeholder)

**Note:** Full implementation in WP4. This section reserves tokens and provides guidance.

### Character Animation Philosophy

**Río (our cloud forest avatar) appears in:**
- Empty states ("The garden is quiet")
- Celebration moments (milestones achieved)
- Onboarding flows (welcome sequences)
- Error recovery (gentle encouragement)

**Animation Style:**
- **Natural, organic movement** (not robotic)
- **Slower than UI animations** (400-600ms)
- **Breathing idle state** (gentle float)
- **Personality** (playful but not distracting)

---

### Reserved Tokens

```css
/* Character Animation Durations */
--animation-character-enter: 500ms;    /* Río appears */
--animation-character-idle: 2000ms;    /* Breathing/floating */
--animation-character-exit: 400ms;     /* Río leaves */
--animation-character-react: 300ms;    /* Response to interaction */

/* Character Easing */
--ease-character: cubic-bezier(0.4, 0.0, 0.2, 1);  /* Natural motion */
```

---

### Implementation Notes (For WP4)

**Technology Options:**
- Lottie animations (JSON-based, lightweight)
- SVG animations (native, good control)
- Rive (advanced, interactive)

**File Locations:**
- Animation files: `/public/animations/rio/`
- React component: `/components/ecovilla/rio-avatar.tsx`

**States to Animate:**
- Idle (default breathing)
- Happy (success celebrations)
- Thoughtful (loading states)
- Encouraging (error recovery)
- Waving (greetings)

---

## Design Reference Library

### Mobbin Search Recommendations

To support this design system with visual references, search Mobbin for:

**Color & Aesthetics:**
- [ ] "sustainable app design"
- [ ] "nature app interface"
- [ ] "eco-friendly app"
- [ ] "green brand app"
- [ ] "outdoor recreation app"

**Community Features:**
- [ ] "community platform"
- [ ] "social feed design"
- [ ] "event calendar app"
- [ ] "neighbor app interface"
- [ ] "local community app"

**Specific Components:**
- [ ] "bottom navigation bar"
- [ ] "mobile dashboard"
- [ ] "card list design"
- [ ] "profile screen"
- [ ] "settings page"

**Resource Management (Carmen):**
- [ ] "inventory app"
- [ ] "library booking app"
- [ ] "equipment rental"
- [ ] "sharing economy app"

**Onboarding (Sofia):**
- [ ] "app onboarding flow"
- [ ] "welcome screen"
- [ ] "tutorial screen"
- [ ] "progress indicator"

---

### Reference Placeholder Structure

In WP2_Component_Guidelines.md, we'll include sections like:

```markdown
## Button Patterns
[📸 Add Mobbin reference: Sustainable app primary buttons]
[📸 Add Mobbin reference: Community app CTAs]

## Card Layouts
[📸 Add Mobbin reference: Event card designs]
[📸 Add Mobbin reference: Profile card patterns]
```

---

## Implementation Priorities

### Phase 1: Foundation (Day 1 of WP2)
1. ✅ Implement all color tokens in `globals.css`
2. ✅ Implement typography tokens
3. ✅ Implement spacing scale
4. ✅ Test dark mode toggle

### Phase 2: Components (Day 2 of WP2)
1. ✅ Implement border radius tokens
2. ✅ Implement shadow system
3. ✅ Implement animation tokens
4. ✅ Create accessibility tokens

### Phase 3: Documentation (Day 3 of WP2)
1. ✅ Gather Mobbin references
2. ✅ Document component state rules
3. ✅ Create implementation checklist
4. ✅ Prepare handoff to WP3

---

## Success Criteria

WP2 is complete when:

✅ **All tokens defined** - CSS variables for every design decision
✅ **Dark mode works** - Toggle switches seamlessly
✅ **WCAG AA compliance** - All color combinations meet contrast requirements
✅ **Mobile preview correct** - Tokens work at 320px-768px
✅ **Documentation complete** - Component state rules clear
✅ **Mobbin references added** - Visual inspiration captured
✅ **Cursor-ready** - Implementation checklist prepared
✅ **Handoff to WP3** - Ready for component building

---

## What's Next: WP3 Preview

With design tokens complete, WP3 will:
- Install shadcn/ui components
- Build custom Ecovilla components using these tokens
- Create Storybook documentation
- Implement component state variations
- Build screen patterns

**WP2 provides the language. WP3 speaks it.**

---

## Version History

**v1.0** (November 2025)
- Initial design token system
- Persona-informed color decisions
- Complete typography, spacing, radius, shadow systems
- Accessibility tokens defined
- Río animation placeholders
- Component state rules documented

---

**End of Design Tokens Specification**