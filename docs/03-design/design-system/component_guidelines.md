# WP2: Component Guidelines
## Ecovilla Community Platform Design System

**Version**: 1.0  
**Created**: November 2024  
**Owner**: MJ + Design Team  
**Status**: Ready for Implementation

---

## Document Purpose

This document defines **HOW to use** design tokens to create consistent, accessible components. It establishes:

1. **8 Universal Component States** - Rules that apply to ALL interactive elements
2. **Accessibility Requirements** - WCAG 2.1 AA compliance standards
3. **Usage Patterns** - When to use which token
4. **Responsive Behavior** - Mobile-first, desktop-enhanced patterns
5. **Animation Guidelines** - When and how to animate

**What This Document Does NOT Contain:**
- Actual component implementation (that's WP3)
- Storybook setup (that's WP3)
- Screen-specific patterns (that's WP5-6)

---

## The 8 Universal Component States

Every interactive component (button, input, card, link) must support these 8 states:

### 1. **Default (Rest)**
The component's appearance when idle, not being interacted with.

**Visual Treatment:**
- Use base token values (e.g., `bg-forest-canopy`, `text-earth-soil`)
- Standard border radius from tokens
- No elevation (shadow-none or shadow-xs)
- Clear, readable text with proper contrast

**Example:**
```css
/* Button Default */
background: hsl(var(--forest-canopy));
color: white;
border-radius: 12px;
box-shadow: var(--shadow-xs);
```

---

### 2. **Hover**
Visual feedback when cursor/finger is over the component.

**Visual Treatment:**
- Slightly darker background (use `-deep` variant or reduce lightness by 5%)
- Lift effect: increase shadow (sm → md, md → lg)
- Transition: `200ms` (use `duration-base`)
- Cursor changes to `pointer`

**Accessibility:**
- Must work with keyboard focus (don't rely only on mouse)
- Clear enough for users with motor control challenges

**Example:**
```css
/* Button Hover */
background: hsl(var(--forest-deep));
box-shadow: var(--shadow-md);
transform: translateY(-1px);
transition: all 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
```

---

### 3. **Focused**
Visual feedback when component has keyboard focus.

**Visual Treatment:**
- 2px outline using `ring` token
- Offset: 2px from edge
- Color: `hsl(var(--ring))` (forest-canopy for brand, sky-blue for inputs)
- NEVER remove focus indicators

**Accessibility:**
- **CRITICAL**: Must be clearly visible (3:1 contrast with background)
- Required for keyboard navigation
- Required for screen reader users
- Use `:focus-visible` to avoid showing on mouse click

**Example:**
```css
/* Button Focus */
outline: 2px solid hsl(var(--ring));
outline-offset: 2px;

/* Use :focus-visible for better UX */
button:focus-visible {
  outline: 2px solid hsl(var(--ring));
}
```

---

### 4. **Active (Pressed)**
Visual feedback during the moment of interaction (mouse down, touch).

**Visual Treatment:**
- Scale down slightly: `scale-[0.98]`
- Reduce shadow (md → sm, sm → xs)
- Optional: darken background further
- Duration: `150ms` (quick response)

**Example:**
```css
/* Button Active */
transform: scale(0.98);
box-shadow: var(--shadow-xs);
transition: transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
```

---

### 5. **Disabled**
Component is present but not interactive.

**Visual Treatment:**
- Reduced opacity: `opacity-50`
- Background: `bg-mist-light` or `bg-earth-pebble`
- Text: `text-mist-gray`
- Cursor: `cursor-not-allowed`
- Remove all hover/active states

**Accessibility:**
- Use `disabled` attribute (not just styling)
- Use `aria-disabled="true"` for custom components
- Provide alternative paths if critical action

**Example:**
```css
/* Button Disabled */
background: hsl(var(--mist-light));
color: hsl(var(--mist-gray));
opacity: 0.5;
cursor: not-allowed;
pointer-events: none;
```

**When to Use:**
- Form fields when conditions aren't met
- Actions that require prerequisites
- Submit buttons during loading

**When NOT to Use:**
- Permanent restrictions (hide instead)
- Optional features (use muted styling instead)

---

### 6. **Loading**
Component is processing an action.

**Visual Treatment:**
- Show spinner or skeleton
- Reduce opacity: `opacity-70`
- Disable interactions: `pointer-events-none`
- Maintain layout (no content shift)
- Duration: matches action (typically `duration-smooth` 300ms)

**Accessibility:**
- Use `aria-busy="true"`
- Provide screen reader announcement: `aria-live="polite"`
- Show text status: "Loading..." for screen readers

**Example:**
```tsx
/* Button Loading */
<button
  disabled
  aria-busy="true"
  aria-label="Creating event, please wait"
  className="opacity-70 pointer-events-none"
>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Creating...
</button>
```

**Visual Patterns:**
- Buttons: Show spinner + "Loading..." text
- Cards: Show skeleton placeholder
- Forms: Disable all fields + show progress

---

### 7. **Error (Invalid)**
Component has invalid data or failed action.

**Visual Treatment:**
- Border: `border-clay-red` (2px)
- Background: `bg-clay-pale` (for inputs)
- Icon: Red warning triangle or X
- Text: `text-clay-red` for error message
- Shake animation (optional, respect reduced motion)

**Accessibility:**
- Use `aria-invalid="true"`
- Provide error message with `aria-describedby`
- Announce error to screen readers with `role="alert"`
- Error message should explain HOW to fix

**Example:**
```tsx
/* Input Error */
<div>
  <input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    className="border-2 border-clay-red bg-clay-pale"
  />
  <p
    id="email-error"
    role="alert"
    className="text-sm text-clay-red mt-1"
  >
    Please enter a valid email address
  </p>
</div>
```

**When to Show:**
- After user leaves field (onBlur)
- After form submission attempt
- During real-time validation (debounced)

---

### 8. **Success (Valid)**
Component has valid data or successful action.

**Visual Treatment:**
- Border: `border-forest-light` (optional)
- Background: `bg-forest-mist` (for inputs)
- Icon: Green checkmark
- Text: `text-forest-canopy` for success message
- Brief animation (fade in, respect reduced motion)

**Accessibility:**
- Use `aria-invalid="false"` (clear error state)
- Provide success message with `aria-live="polite"`
- Success message should be brief and reassuring

**Example:**
```tsx
/* Input Success */
<div>
  <input
    id="email"
    type="email"
    aria-invalid="false"
    className="border-2 border-forest-light bg-forest-mist"
  />
  <p className="text-sm text-forest-canopy mt-1 flex items-center">
    <CheckCircle className="w-4 h-4 mr-1" />
    Email confirmed
  </p>
</div>
```

**When to Show:**
- After successful form submission
- After successful validation
- After successful action (save, create, delete)

---

## Accessibility Requirements

All components MUST meet WCAG 2.1 Level AA standards.

### Color Contrast

**Text on Backgrounds:**
- Large text (18px+): 3:1 minimum
- Normal text (16px and below): 4.5:1 minimum
- Icons and graphics: 3:1 minimum

**Interactive Elements:**
- Focus indicators: 3:1 minimum
- Active states: 3:1 minimum

**Testing:**
Use these token combinations (pre-validated):
```css
/* ✅ PASSES - High Contrast */
text-earth-soil on bg-earth-cloud       → 12:1
text-earth-soil on bg-earth-snow        → 16:1
text-forest-deep on bg-forest-mist      → 8:1
text-clay-red on bg-clay-pale           → 5:1

/* ⚠️ USE CAREFULLY - Minimum Contrast */
text-forest-canopy on bg-forest-mist    → 4.6:1
text-sunrise-orange on bg-sunrise-glow  → 4.5:1

/* ❌ NEVER USE - Fails Contrast */
text-mist-gray on bg-earth-pebble       → 2:1
text-forest-light on bg-forest-mist     → 1.5:1
```

---

### Keyboard Navigation

**Tab Order:**
- All interactive elements must be keyboard accessible
- Logical tab order (top-to-bottom, left-to-right)
- Skip links for long pages
- Trapped focus in modals (Escape to close)

**Keyboard Shortcuts:**
- Enter/Space: Activate buttons
- Escape: Close modals/dropdowns
- Arrow keys: Navigate lists/menus
- Tab/Shift+Tab: Move between elements

**Implementation:**
```tsx
/* ✅ CORRECT - Keyboard accessible */
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Click me
</button>

/* ❌ WRONG - Not keyboard accessible */
<div onClick={handleClick}>
  Click me
</div>
```

---

### Screen Reader Support

**Semantic HTML:**
- Use correct elements: `<button>`, `<nav>`, `<main>`, `<article>`
- Use headings hierarchically (h1 → h2 → h3)
- Use lists for grouped content
- Use landmarks: `<header>`, `<footer>`, `<aside>`

**ARIA Labels:**
- Label all form fields: `<label for="email">`
- Describe icon buttons: `aria-label="Close dialog"`
- Announce live regions: `aria-live="polite"`
- Describe relationships: `aria-describedby`, `aria-labelledby`

**Example:**
```tsx
/* Icon Button - Screen Reader Accessible */
<button
  aria-label="Delete event"
  className="p-2 text-clay-red"
>
  <Trash2 className="w-5 h-5" aria-hidden="true" />
</button>

/* Form Field - Screen Reader Accessible */
<div>
  <label htmlFor="email" className="text-sm font-medium">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-describedby="email-hint"
  />
  <p id="email-hint" className="text-xs text-mist-stone">
    We'll never share your email
  </p>
</div>
```

---

### Touch Targets

**Minimum Size:**
- All interactive elements: 44px × 44px minimum
- Mobile-first: Assume finger interaction
- Desktop: Can be smaller but must have generous padding

**Spacing:**
- Between touch targets: 8px minimum (use `space-2`)
- Exception: Inline links can be closer

**Implementation:**
```tsx
/* ✅ CORRECT - Touch-friendly */
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Tap me
</button>

/* ❌ WRONG - Too small for touch */
<button className="p-1 text-xs">
  Tap me
</button>
```

---

### Reduced Motion

**Respect User Preferences:**
Users with vestibular disorders need reduced motion.

**Implementation:**
```css
/* Smooth animations by default */
.card {
  transition: transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Disable for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

**Use Tailwind Utility:**
```tsx
<div className="transition-transform motion-reduce:transition-none">
  Animated content
</div>
```

**What to Disable:**
- Large movements (slides, bounces)
- Parallax effects
- Auto-playing animations
- Background animations

**What to Keep:**
- Color changes
- Opacity fades (subtle)
- Focus indicators
- Loading spinners (essential feedback)

---

## Usage Patterns

### When to Use Which Token

#### **Buttons**

**Primary Action:**
```tsx
<button className="bg-forest-canopy hover:bg-forest-deep text-white">
  Create Event
</button>
```

**Secondary Action:**
```tsx
<button className="bg-earth-cloud hover:bg-earth-pebble text-earth-soil">
  Cancel
</button>
```

**Destructive Action:**
```tsx
<button className="bg-clay-red hover:bg-clay-terracotta text-white">
  Delete
</button>
```

**Ghost Button:**
```tsx
<button className="bg-transparent hover:bg-earth-cloud text-earth-soil border border-earth-pebble">
  Learn More
</button>
```

---

#### **Status Indicators**

**Info:**
```tsx
<div className="bg-sky-whisper border-l-4 border-sky-blue p-4">
  <p className="text-sky-deep">New feature available!</p>
</div>
```

**Warning:**
```tsx
<div className="bg-honey-pale border-l-4 border-honey-yellow p-4">
  <p className="text-honey-amber">Your session expires in 5 minutes</p>
</div>
```

**Error:**
```tsx
<div className="bg-clay-pale border-l-4 border-clay-red p-4">
  <p className="text-clay-terracotta">Failed to save changes</p>
</div>
```

**Success:**
```tsx
<div className="bg-forest-mist border-l-4 border-forest-canopy p-4">
  <p className="text-forest-deep">Event created successfully!</p>
</div>
```

---

#### **Cards**

**Default Card:**
```tsx
<div className="bg-earth-snow rounded-lg shadow-sm p-space-6">
  <h3 className="text-lg font-semibold text-earth-soil">Card Title</h3>
  <p className="text-earth-stone">Card content goes here</p>
</div>
```

**Interactive Card (Clickable):**
```tsx
<button className="bg-earth-snow rounded-lg shadow-sm hover:shadow-md transition-all duration-base p-space-6 text-left w-full">
  <h3 className="text-lg font-semibold text-earth-soil">Card Title</h3>
  <p className="text-earth-stone">Card content goes here</p>
</button>
```

**Elevated Card:**
```tsx
<div className="bg-earth-snow rounded-lg shadow-lg p-space-6">
  <h3 className="text-lg font-semibold text-earth-soil">Important Content</h3>
</div>
```

---

#### **Form Inputs**

**Text Input:**
```tsx
<input
  type="text"
  className="w-full px-space-4 py-space-3 rounded-DEFAULT border border-earth-pebble focus:ring-2 focus:ring-forest-canopy focus:border-forest-canopy"
  placeholder="Enter your name"
/>
```

**Text Area:**
```tsx
<textarea
  className="w-full px-space-4 py-space-3 rounded-DEFAULT border border-earth-pebble focus:ring-2 focus:ring-forest-canopy focus:border-forest-canopy"
  rows={4}
  placeholder="Tell us about yourself"
/>
```

**Select Dropdown:**
```tsx
<select className="w-full px-space-4 py-space-3 rounded-DEFAULT border border-earth-pebble focus:ring-2 focus:ring-forest-canopy focus:border-forest-canopy">
  <option>Select an option</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

---

#### **Typography**

**Headings:**
```tsx
<h1 className="text-4xl lg:text-display-md font-bold text-earth-soil">
  Page Title
</h1>

<h2 className="text-3xl lg:text-display-sm font-semibold text-earth-soil">
  Section Title
</h2>

<h3 className="text-2xl font-semibold text-earth-soil">
  Subsection Title
</h3>
```

**Body Text:**
```tsx
<p className="text-base text-earth-stone leading-relaxed">
  Regular body text with comfortable reading length.
</p>
```

**Small Text:**
```tsx
<p className="text-sm text-mist-stone">
  Helper text or secondary information
</p>
```

**Code/Data:**
```tsx
<code className="font-mono text-sm bg-earth-cloud px-2 py-1 rounded">
  function hello() {}
</code>
```

---

## Responsive Behavior

### Mobile-First Approach

Start with mobile design, enhance for desktop.

**Spacing:**
```tsx
/* Mobile: smaller padding, Desktop: larger padding */
<div className="p-space-4 lg:p-space-8">
  Content
</div>
```

**Typography:**
```tsx
/* Mobile: smaller text, Desktop: larger text */
<h1 className="text-3xl lg:text-display-md">
  Heading
</h1>
```

**Grid Layout:**
```tsx
/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-6">
  <Card />
  <Card />
  <Card />
</div>
```

---

### Breakpoint Strategy

**Mobile (default):**
- Single column layouts
- Stacked navigation
- Full-width cards
- Generous touch targets (44px)

**Tablet (md: 768px):**
- 2-column layouts
- Side-by-side forms
- Condensed navigation

**Desktop (lg: 1024px+):**
- 3+ column layouts
- Hover interactions
- Enhanced typography (display sizes)
- Sidebar layouts

---

## Animation Guidelines

### When to Animate

**✅ DO Animate:**
- State changes (open/close, show/hide)
- Loading feedback
- Success confirmations
- Hover interactions
- Page transitions

**❌ DON'T Animate:**
- Large movements (parallax)
- Auto-playing loops
- Background effects
- Content that users need to read

---

### Duration

**Quick (150ms):**
- Micro-interactions (button press)
- Hover state changes
- Focus indicators

**Base (200ms):**
- Most UI transitions
- Dropdown menus
- Tooltip appearance

**Smooth (300ms):**
- Modal open/close
- Drawer slide
- Card elevation change

**Río Character (500ms):**
- Character animations (WP4)
- Celebration effects
- Onboarding highlights

---

### Easing

**Natural (default):**
```css
cubic-bezier(0.4, 0.0, 0.2, 1)
```
Use for most transitions.

**Bounce (playful):**
```css
cubic-bezier(0.68, -0.55, 0.265, 1.55)
```
Use sparingly for delight moments.

---

## Component States Reference Table

| State | Visual | Interaction | Duration | Accessibility |
|-------|--------|-------------|----------|---------------|
| **Default** | Base colors, subtle shadow | None | N/A | Clear text, proper contrast |
| **Hover** | Darker bg, lift shadow | Cursor over | 200ms | Works with keyboard |
| **Focused** | 2px ring outline | Keyboard focus | N/A | **REQUIRED**, 3:1 contrast |
| **Active** | Scale down, reduce shadow | Click/tap down | 150ms | Immediate feedback |
| **Disabled** | Muted colors, 50% opacity | None allowed | N/A | `disabled` attribute |
| **Loading** | Spinner, 70% opacity | None allowed | 300ms | `aria-busy`, status text |
| **Error** | Red border, shake | None | 200ms | `aria-invalid`, error message |
| **Success** | Green border, checkmark | None | 200ms | Success message, clear error |

---

## Dark Mode Considerations

**Contextual Dark (Warm Earth Tones):**
- Dark mode uses warm neutrals (earth-soil, earth-stone)
- NOT pure black (#000000)
- Maintains Costa Rican forest aesthetic
- Reduces eye strain in evening use

**Token Adjustments:**
```css
/* Dark mode overrides in globals.css */
.dark {
  --background: var(--earth-soil);
  --foreground: var(--earth-cloud);
  --card: var(--earth-stone);
  /* ... see design-tokens.css for full set */
}
```

**Component Behavior:**
- All 8 states still apply
- Focus rings more prominent (lighter outline)
- Shadows use darker tones (not pure black)

---

## Next Steps

**WP2 Complete → WP3 Begins:**
1. ✅ Design tokens defined (CSS variables)
2. ✅ Tailwind config extended
3. ✅ Component guidelines documented
4. ⏭️ WP3: Install components (shadcn, MagicUI, CultUI)
5. ⏭️ WP3: Build Ecovilla custom components
6. ⏭️ WP3: Create Storybook documentation

**Questions or Clarifications?**
- Reference this document when building components in WP3
- Use token classes (`bg-forest-canopy`, `text-earth-soil`)
- Follow 8-state pattern for all interactive elements
- Test with keyboard and screen reader

---

**End of WP2: Component Guidelines**