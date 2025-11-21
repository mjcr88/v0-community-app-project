# WP3: Component Installation Guide
## Ecovilla Community Platform - Complete Installation Instructions

**Version**: 1.0  
**Created**: November 2024  
**Estimated Time**: 4-6 hours  
**Status**: Ready to Execute

---

## Overview

This guide walks through installing all 112 library components from:
- **shadcn/ui** (45 components + 3 blocks)
- **MagicUI** (31 components)
- **CultUI** (4 components)
- **ReactBits** (9 components + 1 block)

**Approach:** Install everything now, use as needed in WP5-11.

**Why install all?**
- ✅ No performance cost (tree-shaking removes unused code)
- ✅ Creative flexibility during screen development
- ✅ Won't need to stop and install components later
- ✅ Takes ~4 hours total, saves days of interruptions

---

## Prerequisites

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] npm or yarn or pnpm
- [ ] Project initialized with Next.js 15+
- [ ] WP2 complete (design tokens in place)
- [ ] Git branch created: `feature/wp3-component-installation`

---

## Phase 1: shadcn/ui Components (2 hours)

### **Core UI Components (13 components - 30 min)**

These are the most commonly used components across all screens.

```bash
# Foundation components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add alert
npx shadcn@latest add dialog
npx shadcn@latest add separator
npx shadcn@latest add tabs
```

**Validation:**
```bash
# Check that components were created
ls components/ui/button.tsx
ls components/ui/card.tsx
# Should see all 13 files
```

---

### **Form & Input Components (7 components - 15 min)**

```bash
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add combobox
npx shadcn@latest add field
npx shadcn@latest add input-group
npx shadcn@latest add button-group
npx shadcn@latest add item
```

---

### **Data Display Components (8 components - 20 min)**

```bash
npx shadcn@latest add data-table
npx shadcn@latest add pagination
npx shadcn@latest add progress
npx shadcn@latest add skeleton
npx shadcn@latest add scroll-area
npx shadcn@latest add carousel
npx shadcn@latest add chart
npx shadcn@latest add spinner
```

---

### **Navigation & Layout (7 components - 20 min)**

```bash
npx shadcn@latest add sheet
npx shadcn@latest add drawer
npx shadcn@latest add collapsible
npx shadcn@latest add accordion
npx shadcn@latest add alert-dialog
npx shadcn@latest add sonner
```

**Note on Sonner:** This is the toast notification system. Better than default toast.

---

### **shadcn Blocks (3 blocks - 15 min)**

These are pre-built complex components:

```bash
# Sidebar patterns
npx shadcn@latest add sidebar-08   # Desktop sidebar with collapsible sections
npx shadcn@latest add sidebar-16   # Mobile-first sidebar with bottom nav

# Authentication screens
npx shadcn@latest add login-04     # Modern login form
npx shadcn@latest add signup-01    # Signup with validation

# Calendar variations
npx shadcn@latest add calendar-31  # Full calendar view
npx shadcn@latest add calendar-12  # Month picker
npx shadcn@latest add calendar-07  # Date range picker
```

**What are blocks?**
Blocks are complete UI patterns (like login forms, sidebars) that combine multiple components. They're more complex than single components.

---

### **Test shadcn Installation (10 min)**

Create a test page to verify everything works:

```bash
# Create test page
mkdir -p app/test-components
```

**Cursor Prompt:**
```
Create app/test-components/page.tsx to test shadcn components.

Display examples of:
- Button (all variants: default, destructive, outline, ghost)
- Card with title and description
- Input field with label
- Select dropdown with 3 options
- Badge (all variants)
- Avatar with image
- Alert (info, warning, error, success)
- Tabs with 3 tabs
- Dialog with trigger button
- Progress bar at 60%

Use design tokens from WP2 (forest-canopy, sunrise, etc).
Make it look nice with proper spacing.
```

**Visit:** `http://localhost:3000/test-components`

**Expected result:** All components render without errors, using Ecovilla design tokens.

---

## Phase 2: MagicUI Components (1.5 hours)

### **Installation**

MagicUI uses a CLI similar to shadcn:

```bash
# Install MagicUI CLI
npx magicui-cli@latest init
```

This will:
- Add MagicUI to your project
- Configure paths
- Set up dependencies

---

### **Install Individual Components**

**Progress & Loading (4 components - 15 min)**
```bash
npx magicui-cli add animated-circular-progress-bar
npx magicui-cli add ripple
npx magicui-cli add scroll-progress
npx magicui-cli add animated-shiny-text
```

**Lists & Animation (2 components - 10 min)**
```bash
npx magicui-cli add animated-list
npx magicui-cli add progressive-blur
```

**Theme & Display (2 components - 10 min)**
```bash
npx magicui-cli add animated-theme-toggler
npx magicui-cli add avatar-circles
```

**Button Variants (6 components - 15 min)**
```bash
npx magicui-cli add interactive-hover-button
npx magicui-cli add pulsating-button
npx magicui-cli add rainbow-button
npx magicui-cli add ripple-button
npx magicui-cli add shimmer-button
npx magicui-cli add shiny-button
```

**Card & Border Effects (3 components - 10 min)**
```bash
npx magicui-cli add border-beam
npx magicui-cli add magic-card
npx magicui-cli add shine-border
```

**Text Animations (6 components - 15 min)**
```bash
npx magicui-cli add morphing-text
npx magicui-cli add sparkles-text
npx magicui-cli add text-animate
npx magicui-cli add typing-animation
npx magicui-cli add video-text
npx magicui-cli add animated-gradient-text
```

**Other Effects (8 components - 20 min)**
```bash
npx magicui-cli add animated-beam
npx magicui-cli add aurora-text
npx magicui-cli add bento-grid
npx magicui-cli add confetti
npx magicui-cli add dock
npx magicui-cli add globe
npx magicui-cli add highlighter
npx magicui-cli add marquee
npx magicui-cli add orbiting-circles
npx magicui-cli add scroll-based-velocity
npx magicui-cli add tweet-card
npx magicui-cli add warp-background
```

---

### **Test MagicUI Components (15 min)**

**Cursor Prompt:**
```
Create app/test-magicui/page.tsx to test MagicUI components.

Test these specific components we'll use most:
1. AnimatedCircularProgressBar - set to 65%
2. AnimatedList - show 3 fake events
3. AnimatedThemeToggler - dark mode switch
4. AvatarCircles - show 5 resident avatars
5. BorderBeam - on a card
6. PulsatingButton - "Create Event" CTA
7. TypingAnimation - "Welcome to Ecovilla"
8. Confetti - trigger on button click

Make it visually appealing with WP2 design tokens.
```

**Expected result:** All animations work smoothly, design tokens applied correctly.

---

## Phase 3: CultUI Components (30 min)

### **Installation**

CultUI components are installed individually via their registry:

```bash
# Install base dependencies
npm install framer-motion clsx tailwind-merge
```

---

### **Install Components**

**Card & Layout (2 components - 10 min)**
```bash
npx shadcn@latest add https://cult-ui.com/r/expandable.json
npx shadcn@latest add https://cult-ui.com/r/expandable-screen.json
```

**Forms & Interactive (2 components - 10 min)**
```bash
npx shadcn@latest add https://cult-ui.com/r/popover-form.json
npx shadcn@latest add https://cult-ui.com/r/popover.json
```

**Carousels & Features (4 components - 10 min)**
```bash
npx shadcn@latest add https://cult-ui.com/r/feature-carousel.json
npx shadcn@latest add https://cult-ui.com/r/three-d-carousel.json
npx shadcn@latest add https://cult-ui.com/r/timer.json
npx shadcn@latest add https://cult-ui.com/r/canvas-fractal-grid.json
```

**Additional Components (4 components)**
```bash
npx shadcn@latest add https://cult-ui.com/r/texture-card.json
npx shadcn@latest add https://cult-ui.com/r/sortable-list.json
npx shadcn@latest add https://cult-ui.com/r/dock.json
```

---

### **Test CultUI Components (10 min)**

**Cursor Prompt:**
```
Create app/test-cultui/page.tsx to test CultUI components.

Test:
1. Expandable - card that expands on click
2. PopoverForm - feedback form in popover
3. FeatureCarousel - 3 onboarding slides
4. Timer - countdown from 60 seconds
5. ThreeDCarousel - 5 resident cards

Use Ecovilla design tokens.
```

---

## Phase 4: ReactBits Components (1 hour)

### **Installation**

ReactBits uses npm packages:

```bash
# Install ReactBits core
npm install @react-bits/ui
```

---

### **Text Animations (5 components - 15 min)**

These are imported from the package, no CLI needed:

```tsx
// Example imports (you'll use these in components)
import { SplitText } from '@react-bits/text-animations'
import { ShinyText } from '@react-bits/text-animations'
import { GradientText } from '@react-bits/text-animations'
import { TrueFocus } from '@react-bits/text-animations'
import { RotatingText } from '@react-bits/text-animations'
```

**No installation needed** - these are available once package is installed.

---

### **Animations & Effects (4 components - 15 min)**

```tsx
// Example imports
import { ElectricBorder } from '@react-bits/animations'
import { LaserFlow } from '@react-bits/animations'
import { GhostCursor } from '@react-bits/animations'
import { SplashCursor } from '@react-bits/animations'
```

---

### **Layout Components (4 components - 15 min)**

```tsx
// Example imports
import { AnimatedList } from '@react-bits/components'
import { ScrollStack } from '@react-bits/components'
import { Stepper } from '@react-bits/components'
import { Dock } from '@react-bits/components'
```

---

### **Card & Display (6 components - 15 min)**

```tsx
// Example imports
import { CircularGallery } from '@react-bits/components'
import { TiltedCard } from '@react-bits/components'
import { DomeGallery } from '@react-bits/components'
import { ProfileCard } from '@react-bits/components'
import { SpotlightCard } from '@react-bits/components'
import { MagicBento } from '@react-bits/components'
import { ChromaGrid } from '@react-bits/components'
import { Lanyard } from '@react-bits/components'
```

---

### **Backgrounds (1 component - 5 min)**

```tsx
import { Orb } from '@react-bits/backgrounds'
```

---

### **Test ReactBits Components (10 min)**

**Cursor Prompt:**
```
Create app/test-reactbits/page.tsx to test ReactBits components.

Test:
1. SplitText - "Welcome to Ecovilla" with character animation
2. GradientText - Page title with forest gradient
3. ElectricBorder - Delete button with danger border
4. Stepper - 4-step onboarding stepper (step 2 active)
5. ProfileCard - Resident profile
6. Dock - Bottom navigation with 4 icons
7. Orb - Animated background orb

Use WP2 design tokens (forest-canopy, sunrise, etc).
```

---

## Phase 5: Verification & Testing (30 min)

### **Component Inventory Check**

Create a comprehensive inventory to confirm everything installed:

**Cursor Prompt:**
```
Create lib/components-inventory.ts that exports an object listing all installed components.

Structure:
{
  shadcn: {
    foundation: ['button', 'card', ...],
    forms: ['input', 'select', ...],
    // ... etc
  },
  magicui: ['animated-circular-progress-bar', ...],
  cultui: ['expandable', ...],
  reactbits: ['split-text', ...]
}

Also export a count() function that returns total component count.

Then create app/component-inventory/page.tsx that displays:
- Total components installed
- Breakdown by library
- Visual checklist (all green checkmarks)
- Links to test pages
```

**Expected output:**
```
Total Components: 112
✅ shadcn/ui: 45 components + 3 blocks
✅ MagicUI: 31 components
✅ CultUI: 4 components
✅ ReactBits: 9 components + 1 block
```

---

### **Build Test**

Verify that everything compiles:

```bash
# Clean build
rm -rf .next
npm run build
```

**Expected:** Build succeeds with no errors.

**Common Issues:**

**Issue: "Module not found"**
- Solution: Run `npm install` again
- Check that all dependencies installed

**Issue: "Type error in component"**
- Solution: Ensure TypeScript version is 5.0+
- Update `@types/react` and `@types/node`

**Issue: "CSS conflicts"**
- Solution: Ensure Tailwind config includes all component paths
- Check `tailwind.config.ts` has correct `content` array

---

### **Performance Check**

Verify bundle size impact:

```bash
# Build and analyze
npm run build
npx @next/bundle-analyzer
```

**Expected:** Bundle size increase should be minimal (~50-100KB) due to tree-shaking.

---

## Phase 6: Create Component Quick Reference (30 min)

### **Component Cheat Sheet**

**Cursor Prompt:**
```
Create docs/component-quick-reference.md

For each library, create a table with:
- Component name
- Import statement
- Basic usage example
- Props (key ones)
- Use cases

Example format:

## shadcn/ui

### Button
Import: `import { Button } from '@/components/ui/button'`
Usage: `<Button variant="default">Click me</Button>`
Props: variant (default, destructive, outline, ghost, link), size (default, sm, lg, icon)
Use cases: Primary actions, form submissions, navigation

[Continue for all 112 components]
```

This becomes your go-to reference when building screens in WP5-11.

---

## Troubleshooting Guide

### **Common Installation Issues**

**1. shadcn components not styling correctly**

**Problem:** Components appear unstyled or wrong colors

**Solution:**
```bash
# Verify design tokens are in globals.css
cat app/globals.css | grep "forest-canopy"

# Verify Tailwind config extends colors
cat tailwind.config.ts | grep "forest-canopy"

# If missing, WP2 wasn't completed - go back to WP2
```

---

**2. MagicUI animations not working**

**Problem:** Animations are janky or don't run

**Solution:**
```bash
# Install/verify framer-motion
npm install framer-motion@latest

# Check that reduce motion is not blocking
# In browser DevTools > Console:
# matchMedia('(prefers-reduced-motion: reduce)').matches
# Should be false
```

---

**3. CultUI components error on import**

**Problem:** "Cannot find module" error

**Solution:**
```bash
# CultUI may have peer dependency issues
# Install all peer dependencies:
npm install framer-motion clsx tailwind-merge lucide-react

# If still failing, check component was added to correct path:
ls components/ui/expandable.tsx
```

---

**4. ReactBits types not working**

**Problem:** TypeScript errors on ReactBits imports

**Solution:**
```bash
# Install type definitions
npm install --save-dev @types/react @types/react-dom

# Ensure tsconfig.json includes:
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "jsx": "preserve"
  }
}
```

---

**5. Build fails with "CSS order conflict"**

**Problem:** Tailwind CSS order warnings/errors

**Solution:**
```typescript
// In tailwind.config.ts, ensure plugins in correct order:
module.exports = {
  // ... config
  plugins: [
    require("tailwindcss-animate"), // Must be last
  ],
}
```

---

**6. Components don't match design tokens**

**Problem:** Buttons/cards using wrong colors

**Solution:**
```tsx
// Components need to explicitly use design tokens
// Update component variants to use token colors

// Example - update button.tsx variants:
variants: {
  variant: {
    default: "bg-forest-canopy text-white hover:bg-forest-deep",
    // ... etc
  }
}
```

---

## Post-Installation Checklist

Before marking WP3 Phase 1 complete:

- [ ] All shadcn components installed (48 items)
- [ ] All MagicUI components installed (31 items)
- [ ] All CultUI components installed (4 items)
- [ ] All ReactBits components installed (9 items + 1 block)
- [ ] Test pages created and working
- [ ] Build succeeds with no errors
- [ ] Component inventory page shows all green
- [ ] Quick reference document created
- [ ] Git commit created: "feat(components): Install all library components (112 total)"
- [ ] Changes pushed to feature branch

**Total time:** 4-6 hours

---

## What's Next?

After installation is complete, proceed to:

**WP3 Phase 2:** Build 3 Critical Custom Components
- MobileNav (bottom tab bar)
- PageHeader (consistent headers)
- EmptyState (with Río placeholder)

See: `WP3_Critical_Components.md`

---

## Quick Commands Reference

### **Install Everything (copy-paste friendly)**

```bash
# shadcn core (13 components)
npx shadcn@latest add button card input label textarea select checkbox badge avatar alert dialog separator tabs

# shadcn forms (7 components)
npx shadcn@latest add radio-group switch combobox field input-group button-group item

# shadcn data (8 components)
npx shadcn@latest add data-table pagination progress skeleton scroll-area carousel chart spinner

# shadcn layout (6 components)
npx shadcn@latest add sheet drawer collapsible accordion alert-dialog sonner

# shadcn blocks (7 blocks)
npx shadcn@latest add sidebar-08 sidebar-16 login-04 signup-01 calendar-31 calendar-12 calendar-07

# MagicUI setup
npx magicui-cli@latest init

# MagicUI components (install after init)
npx magicui-cli add animated-circular-progress-bar ripple scroll-progress animated-shiny-text animated-list progressive-blur animated-theme-toggler avatar-circles interactive-hover-button pulsating-button rainbow-button ripple-button shimmer-button shiny-button border-beam magic-card shine-border morphing-text sparkles-text text-animate typing-animation video-text animated-gradient-text animated-beam aurora-text bento-grid confetti dock globe highlighter marquee orbiting-circles scroll-based-velocity tweet-card warp-background

# CultUI dependencies
npm install framer-motion clsx tailwind-merge

# CultUI components
npx shadcn@latest add https://cult-ui.com/r/expandable.json
npx shadcn@latest add https://cult-ui.com/r/expandable-screen.json
npx shadcn@latest add https://cult-ui.com/r/popover-form.json
npx shadcn@latest add https://cult-ui.com/r/popover.json
npx shadcn@latest add https://cult-ui.com/r/feature-carousel.json
npx shadcn@latest add https://cult-ui.com/r/three-d-carousel.json
npx shadcn@latest add https://cult-ui.com/r/timer.json
npx shadcn@latest add https://cult-ui.com/r/canvas-fractal-grid.json

# ReactBits
npm install @react-bits/ui
```

---

**End of Installation Guide**

**Next:** WP3_Critical_Components.md