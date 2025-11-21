# WP3B: Critical Components Specification
## Ecovilla Community Platform - Must-Have Custom Components

**Version**: 1.0  
**Created**: November 2024  
**Estimated Time**: 8-10 hours to build all 3  
**Status**: Ready to Execute

---

## Overview

These 3 components are **critical infrastructure** that must be built before any screen development in WP5-11. They appear on virtually every screen and establish the foundation for consistent navigation and authentication.

### **The 3 Critical Components**

1. **TenantLoginPage** - Branded login experience for each community
2. **MobileNav** - Bottom tab navigation (mobile-first)
3. **DesktopNav** - Sidebar navigation (desktop enhancement)

**Why these first?**
- ✅ **Authentication blocker** - Can't access app without login
- ✅ **Navigation blocker** - Can't move between screens without nav
- ✅ **Used everywhere** - Every screen needs navigation
- ✅ **Brand identity** - Login sets first impression

---

## Component 1: TenantLoginPage

### **What It Is**

A branded login page using shadcn's login-02 block with Ecovilla customizations. Features a split-screen design with hero image and animated border effects on inputs.

### **Why It's Critical**

- First screen users see
- Sets brand expectations
- Multi-tenant architecture (for now, Ecovilla San Mateo only)
- Used by all user roles (residents, admins, super admins)

---

### **Base Component**

**shadcn Block:** `login-02`
```bash
npx shadcn@latest add login-02
```

**What login-02 provides:**
- Responsive split-screen layout (image left, form right)
- Mobile-optimized single column
- Form validation
- Accessibility built-in
- TypeScript typed

**Our Customizations:**
1. Replace placeholder image with `/public/login.jpg` (or .png)
2. Add BorderBeam effect around entire form container (MagicUI)
3. Apply Ecovilla design tokens (forest-canopy, etc.)
4. Remove social login (Google OAuth) - invite-only system
5. Add tenant branding (logo, name)
6. Custom "Contact your admin" messaging
7. Remove "Remember me" checkbox (not implemented yet)
8. Remove "Forgot password" link (not implemented yet)

---

### **Visual Structure**

```
┌─────────────────────────────────────────────────────────┐
│                    [Mobile View]                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              [Ecovilla Logo - 80px]                     │
│            Welcome to Ecovilla San Mateo                │
│                                                          │
│  ╔═══════════════════════════════════════════════╗     │ ← BorderBeam wraps form
│  ║                                               ║     │
│  ║  Email                                        ║     │
│  ║  [input: your@email.com................]     ║     │
│  ║                                               ║     │
│  ║  Password                                     ║     │
│  ║  [input: •••••••••••••................]      ║     │
│  ║                               [👁️ Show]       ║     │
│  ║                                               ║     │
│  ║  [    Sign In (full width button)    ]       ║     │
│  ║                                               ║     │
│  ╚═══════════════════════════════════════════════╝     │
│                                                          │
│  Don't have an invite? Contact your admin              │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   [Desktop View]                         │
├──────────────────────┬──────────────────────────────────┤
│                      │                                   │
│   [Hero Image]       │    [Ecovilla Logo - 100px]       │
│   /public/login      │    Welcome to Ecovilla San Mateo │
│                      │                                   │
│   Community photo    │  ╔═════════════════════════╗     │ ← BorderBeam wraps form
│                      │  ║                         ║     │
│   Tagline or         │  ║ Email                   ║     │
│   testimonial        │  ║ [input..............]   ║     │
│                      │  ║                         ║     │
│                      │  ║ Password                ║     │
│                      │  ║ [input..............]   ║     │
│                      │  ║ [👁️ Show]               ║     │
│                      │  ║                         ║     │
│                      │  ║ [  Sign In  ]           ║     │
│                      │  ║                         ║     │
│                      │  ╚═════════════════════════╝     │
│                      │                                   │
│                      │    Don't have an invite?          │
│                      │    Contact your admin             │
│                      │                                   │
└──────────────────────┴──────────────────────────────────┘
```

---

### **Component API**

```tsx
// app/t/[slug]/login/page.tsx
// Uses shadcn login-02 block as base

interface LoginPageProps {
  tenant: {
    slug: string
    name: string
    logo_url: string
    hero_image_url: string // For desktop left panel
  }
}

// The form is handled by shadcn login-02 block
// We customize the styling and add BorderBeam effects
```

---

### **Key Customizations**

#### **1. BorderBeam Around Form Container (MagicUI)**

Apply animated border effect to the entire form card for premium feel:

```tsx
import { BorderBeam } from "@/components/magicui/border-beam"

// Wrap the form container (not individual inputs)
<div className="relative">
  <div className="relative z-10 bg-earth-snow rounded-lg p-8 space-y-6">
    {/* Email input */}
    <div>
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        placeholder="your@email.com"
      />
    </div>
    
    {/* Password input */}
    <div>
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        placeholder="••••••••"
      />
    </div>
    
    {/* Submit button */}
    <Button type="submit" className="w-full">
      Sign In
    </Button>
  </div>
  
  {/* BorderBeam wraps entire form */}
  <BorderBeam 
    size={400}
    duration={15}
    colorFrom="hsl(var(--forest-canopy))"
    colorTo="hsl(var(--sunrise))"
    borderWidth={2}
  />
</div>
```

**Effect:** Animated border that travels around the form container

**Mobile & Desktop:** Same implementation, border scales with container

---

#### **2. Hero Image Integration**

```tsx
// Desktop left panel (login-02 already has this structure)
<div className="hidden lg:block relative h-full">
  <Image
    src="/login.jpg" // or /login.png
    alt="Ecovilla San Mateo community"
    fill
    className="object-cover"
    priority
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
  <div className="absolute bottom-12 left-12 text-white">
    <h2 className="text-4xl font-bold mb-4">
      Welcome to Ecovilla San Mateo
    </h2>
    <p className="text-lg opacity-90">
      Your community connection platform
    </p>
  </div>
</div>
```

**Image Location:** `/public/login.jpg` or `/public/login.png`

---

#### **3. Removed Features**

- ❌ No Google OAuth (invite-only system)
- ❌ No "Create account" link (admins create accounts)
- ❌ No "Remember me" checkbox (not implemented yet)
- ❌ No "Forgot password" link (not implemented yet)
- ✅ Keep show/hide password toggle
- ✅ Keep form validation

---

#### **4. Custom Messaging**

Replace default text:

**Before:** "Don't have an account? Sign up"  
**After:** "Don't have an invite? Contact your admin"

Link to: `/t/[slug]/contact` or mailto link

---

### **Component States**

#### **1. Default (Idle)**
- Empty form fields
- "Sign In" button enabled
- No error messages
- Google button visible (if OAuth enabled)

#### **2. Focused**
- Active input has forest-canopy border (2px)
- Label moves up (if using floating labels)
- Clear focus ring (2px offset)

#### **3. Filling**
- Show/hide password toggle appears when password field has content
- Email validation icon appears (✓ or ✗)

#### **4. Loading**
- "Sign In" button shows spinner
- Button text: "Signing in..."
- Form inputs disabled
- Cursor: not-allowed

#### **5. Error**
- Input border: clay-red (2px)
- Error message below input: "Invalid email or password"
- Icon: ⚠️ or ✗
- Shake animation (respect reduced motion)
- Focus on first errored field

#### **6. Success**
- Brief checkmark animation
- Fade out form
- Fade in loading state or redirect

---

### **Design Tokens Usage**

```tsx
// Colors
const colors = {
  primary: tenant.primary_color || 'hsl(var(--forest-canopy))',
  background: 'hsl(var(--earth-cloud))',
  cardBg: 'hsl(var(--earth-snow))',
  text: 'hsl(var(--earth-soil))',
  textSecondary: 'hsl(var(--earth-stone))',
  error: 'hsl(var(--clay-red))',
  success: 'hsl(var(--forest-canopy))',
  border: 'hsl(var(--earth-pebble))',
}

// Spacing
const spacing = {
  section: 'space-8', // Between sections
  field: 'space-4',   // Between form fields
  inline: 'space-2',  // Between label and input
}

// Typography
const typography = {
  heading: 'text-3xl font-bold', // Tenant name
  subheading: 'text-lg',         // Tagline
  body: 'text-base',             // Labels, links
  small: 'text-sm',              // Helper text
}
```

---

### **Responsive Behavior**

**Mobile (320px - 767px)**
- Single column layout
- Full-width inputs and buttons
- Logo: 80px height max
- Padding: space-4 (16px)
- No hero image
- Social login below divider

**Tablet (768px - 1023px)**
- Single column (same as mobile)
- Max width: 400px centered
- Larger logo: 100px height
- Padding: space-6 (24px)
- Hero image: optional background blur

**Desktop (1024px+)**
- Two-column layout (50/50 split)
- Left: Hero image/community photo
- Right: Login form (max 480px wide, centered)
- Logo: 120px height
- Enhanced hover states

---

### **Accessibility Requirements**

- [ ] All inputs have associated labels
- [ ] Form has `role="form"` and `aria-label="Login form"`
- [ ] Error messages use `aria-live="assertive"`
- [ ] Show/hide password button has `aria-label="Show password"`
- [ ] Email input has `type="email"` and `autocomplete="email"`
- [ ] Password input has `type="password"` and `autocomplete="current-password"`
- [ ] Remember me checkbox has proper label association
- [ ] Tab order is logical (email → password → remember me → forgot password → submit → google)
- [ ] Keyboard navigation works (Enter submits form)
- [ ] Focus indicators visible (2px ring)
- [ ] Error messages are announced to screen readers
- [ ] Success messages are announced
- [ ] Loading state is announced ("Signing in, please wait")

---

### **Component Files Structure**

```
components/ecovilla/auth/
├── tenant-login-page.tsx          # Main component
├── login-form.tsx                 # Form logic (can be reused)
├── social-login-buttons.tsx       # Google, Apple, etc.
├── tenant-branding.tsx            # Logo + colors
└── login-hero.tsx                 # Desktop left panel

lib/
├── auth/
│   ├── use-login.ts               # Hook for login logic
│   ├── validation.ts              # Form validation
│   └── session.ts                 # Session management
└── types/
    └── auth.ts                    # Type definitions
```

---

### **Cursor Build Prompt**

```
Customize the shadcn login-02 block for Ecovilla login page.

Prerequisites:
1. First install the block: npx shadcn@latest add login-02
2. Install BorderBeam: npx magicui-cli add border-beam

Context:
@WP2_Design_Tokens_Specification.md (design tokens)
@WP2_Component_Guidelines.md (8 states, accessibility)
@components/ui/input.tsx (shadcn input)
@components/ui/button.tsx (shadcn button)
@components/magicui/border-beam.tsx (MagicUI BorderBeam)

Task: Customize app/t/[slug]/login/page.tsx

Customizations needed:

1. HERO IMAGE (Desktop left panel)
   - Replace placeholder with: /login.jpg (or /login.png if that's the format)
   - Add gradient overlay (black/60 to transparent)
   - Add welcome text overlay:
     - "Welcome to Ecovilla San Mateo"
     - "Your community connection platform"

2. BORDERBEAM around form container
   - Wrap entire form card with BorderBeam (NOT individual inputs)
   - Form container: bg-earth-snow, rounded-lg, p-8, space-y-6
   - BorderBeam config:
     - size: 400
     - duration: 15
     - colorFrom: hsl(var(--forest-canopy))
     - colorTo: hsl(var(--sunrise))
     - borderWidth: 2
   - Position: relative container with BorderBeam as sibling
   - Works on both mobile and desktop

3. REMOVE features not implemented yet
   - Delete "Remember me" checkbox (not implemented)
   - Delete "Forgot password" link (not implemented)
   - Keep password show/hide toggle
   - Keep form validation

4. REMOVE social login
   - Delete "Continue with Google" button
   - Remove divider line
   - Remove all OAuth code

5. UPDATE messaging
   - Change "Don't have an account? Sign up"
   - To: "Don't have an invite? Contact your admin"
   - Link to: mailto:admin@ecovillasanmateo.com

6. APPLY design tokens
   - Form container: bg-earth-snow (card background)
   - Primary button: bg-forest-canopy hover:bg-forest-deep
   - Text: text-earth-soil
   - Secondary text: text-earth-stone
   - Page background: bg-earth-cloud
   - Input borders: border-earth-pebble
   - Input focus: ring-forest-canopy

7. LOGO
   - Add Ecovilla logo at top: /images/ecovilla-logo.png
   - Height: 80px mobile, 100px desktop
   - Center on mobile, left-align on desktop

Structure:
```tsx
<div className="relative">
  {/* Form with z-10 to stay above BorderBeam */}
  <div className="relative z-10 bg-earth-snow rounded-lg p-8">
    {/* Form content */}
  </div>
  {/* BorderBeam wraps around */}
  <BorderBeam size={400} duration={15} ... />
</div>
```

Keep all existing login-02 functionality:
- Form validation
- Password show/hide toggle
- Responsive layout
- Accessibility features
- Error handling

Make it beautiful and on-brand for Ecovilla.
```

---

### **Testing Checklist**

**Functionality**
- [ ] Valid email + password logs in successfully
- [ ] Invalid credentials show error message
- [ ] Empty fields show validation errors
- [ ] Remember me persists session
- [ ] Forgot password link navigates correctly
- [ ] Google login triggers OAuth flow
- [ ] Redirects to correct page after login
- [ ] Loading state prevents double-submission

**Responsive**
- [ ] Mobile (320px): Single column, full width
- [ ] Tablet (768px): Centered form, max 400px
- [ ] Desktop (1024px+): Two columns, hero visible
- [ ] Logo scales appropriately at all sizes
- [ ] Touch targets meet 44px minimum on mobile

**Accessibility**
- [ ] Tab order is logical
- [ ] All inputs have labels
- [ ] Error messages announced
- [ ] Keyboard only navigation works
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Reduced motion respected

**Design Tokens**
- [ ] Uses WP2 color tokens
- [ ] Uses WP2 spacing tokens
- [ ] Uses WP2 typography tokens
- [ ] Tenant branding overrides work
- [ ] Dark mode works (if enabled)

---

## Component 2: MobileNav

### **What It Is**

MagicUI Dock-based bottom navigation with magnification effects, plus a hamburger menu for secondary navigation.

### **Why It's Critical**

- Mobile-first design principle
- Primary navigation for 60% of users (mobile)
- Thumb-friendly positioning
- Premium feel with hover magnification
- Familiar iOS/macOS pattern

---

### **Visual Structure**

```
┌─────────────────────────────────────────────────────────┐
│ [☰]                                      [🔆/🌙] [👤]   │ ← Top bar
├─────────────────────────────────────────────────────────┤
│                                                          │
│                  [Page Content]                          │
│                                                          │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
┌─────┬──────┬──────────┬──────┬──────┐
│ 🏠  │  🗺️   │ ─── + ─── │  📅  │  💱  │ ← MagicUI Dock
│Home │ Map  │  Create  │Events│Exch. │
└─────┴──────┴──────────┴──────┴──────┘
  ↑                ↑                ↑
Regular        Elevated         Regular
icons          (larger)         icons
```

**Key Features:**
- **Dock:** 5 items (Home, Map, Create, Events, Exchange)
- **Create button:** Elevated, centered, with separators
- **Hover:** Icons magnify (macOS style)
- **Icons:** Outlined style, fill when active
- **Hamburger menu:** Top left for secondary items
- **Dark mode toggle:** Top right (AnimatedThemeToggler)
- **Profile avatar:** Top right next to dark mode

---

### **Hamburger Menu Content**

```
┌─────────────────────────────┐
│ [Close X]                   │
│                             │
│ 📢 Announcements        [3] │
│ 👥 Browse Residents         │
│ ⚠️  My Requests          [1] │
│ 📍 Check-ins                │
│ ─────────────────────       │
│ 👤 My Profile               │
│ ─────────────────────       │
│ 🚪 Logout                   │
└─────────────────────────────┘
```

**Opens from:** Left side slide animation  
**Closes:** Tap outside, X button, or select item  
**Badge support:** Shows notification counts

**Note:** Profile page includes all user settings (privacy, notifications, theme, family, account management). No separate Settings page needed.

---

### **Create Modal (4 Options)**

When user taps elevated Create button:

```
┌─────────────────────────────┐
│ What would you like to      │
│ create?                     │
│                             │
│ ┌─────────────────────────┐ │
│ │  📍                      │ │
│ │  Check-in               │ │
│ │  Share your location    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  📅                      │ │
│ │  Event                  │ │
│ │  Organize something     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  💱                      │ │
│ │  Listing                │ │
│ │  Share or borrow        │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  ⚠️                       │ │
│ │  Request                │ │
│ │  Report an issue        │ │
│ └─────────────────────────┘ │
│                             │
│        [Cancel]             │
└─────────────────────────────┘
```

**Style:** Sheet/drawer from bottom  
**Animation:** Smooth slide up  
**Dismiss:** Tap outside or Cancel

---

### **Component Structure**

```tsx
// components/ecovilla/navigation/mobile-nav.tsx

interface MobileNavProps {
  currentPath: string
  tenantSlug: string
  user: {
    name: string
    avatar_url?: string
    unreadAnnouncements?: number
    unreadRequests?: number
  }
}

// Dock items are hardcoded (Home, Map, Create, Events, Exchange)
// Hamburger items are hardcoded (Announcements, Residents, Requests, Check-ins, Profile, Settings, Logout)

// Usage
<MobileNav
  currentPath="/dashboard"
  tenantSlug="san-mateo"
  user={{
    name: "Sofia Martinez",
    avatar_url: "/avatars/sofia.jpg",
    unreadAnnouncements: 3,
    unreadRequests: 1
  }}
/>
```

---

### **MagicUI Dock Configuration**

```tsx
import { Dock, DockIcon } from "@/components/magicui/dock"

const dockItems = [
  { 
    id: 'home', 
    icon: HomeIcon, 
    label: 'Home', 
    href: '/dashboard',
    badge: null 
  },
  { 
    id: 'map', 
    icon: MapIcon, 
    label: 'Map', 
    href: '/map',
    badge: null 
  },
  { 
    id: 'create', 
    icon: PlusIcon, 
    label: 'Create', 
    onClick: () => setShowCreateModal(true),
    isElevated: true,
    badge: null 
  },
  { 
    id: 'events', 
    icon: CalendarIcon, 
    label: 'Events', 
    href: '/events',
    badge: 3 // Example badge
  },
  { 
    id: 'exchange', 
    icon: ShoppingBagIcon, 
    label: 'Exchange', 
    href: '/exchange',
    badge: null 
  },
]

<Dock 
  direction="middle"
  magnification={60}
  distance={140}
  className="fixed bottom-0 left-0 right-0 z-50"
>
  {dockItems.map((item) => (
    <DockIcon key={item.id}>
      {item.isElevated ? (
        // Elevated Create button with separators
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="h-8" />
          <button className="relative -top-3 rounded-full w-14 h-14 bg-forest-canopy shadow-lg">
            <item.icon className="w-6 h-6 text-white" />
          </button>
          <Separator orientation="vertical" className="h-8" />
        </div>
      ) : (
        // Regular dock icons
        <Link href={item.href}>
          <button className="relative group">
            <item.icon className={cn(
              "w-6 h-6 transition-all",
              currentPath === item.href 
                ? "text-forest-canopy fill-current" // Active: filled
                : "text-mist-gray" // Inactive: outlined
            )} />
            {item.badge && (
              <span className="absolute -top-1 -right-1 bg-sunrise text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        </Link>
      )}
    </DockIcon>
  ))}
</Dock>
```

---

### **Component Variants**

#### **Variant 1: Standard (5 tabs)**
- Home, Events, Create, Map, Profile
- Center tab is primary action
- Equal spacing

#### **Variant 2: Compact (4 tabs)**
- Home, Events, Map, Profile
- No primary action
- Equal spacing, no elevation

#### **Variant 3: Admin (5 tabs)**
- Dashboard, Residents, Events, Requests, Settings
- Admin-specific navigation
- Different icons

---

### **Component States**

#### **1. Default (Inactive Tab)**
- Icon: mist-gray color
- Label: mist-gray color
- No background
- No elevation

#### **2. Active Tab**
- Icon: forest-canopy color
- Label: forest-canopy color
- Optional: subtle background (forest-mist)
- Optional: top border indicator

#### **3. Hover (Desktop)**
- Slight icon scale (105%)
- Background: earth-cloud
- Smooth transition (200ms)

#### **4. Pressed**
- Icon scale down (95%)
- Quick animation (150ms)

#### **5. With Badge**
- Small circle badge (8-10px) on icon
- Sunrise-orange background
- White text
- Badge count (max 99+)

#### **6. Primary Action Tab**
- Larger size (56px vs 48px)
- Elevated shadow (shadow-md)
- forest-canopy background
- White icon
- Rounded (full circle or rounded square)
- Positioned slightly above baseline

---

### **Design Tokens Usage**

```tsx
const styles = {
  container: {
    height: '64px', // + safe area
    background: 'hsl(var(--earth-snow))',
    borderTop: '1px solid hsl(var(--earth-pebble))',
  },
  tab: {
    inactive: {
      color: 'hsl(var(--mist-gray))',
      hover: 'hsl(var(--earth-cloud))',
    },
    active: {
      color: 'hsl(var(--forest-canopy))',
      background: 'hsl(var(--forest-mist))',
    },
  },
  primaryAction: {
    size: '56px',
    background: 'hsl(var(--forest-canopy))',
    color: 'white',
    shadow: 'var(--shadow-md)',
    hover: 'hsl(var(--forest-deep))',
  },
  badge: {
    background: 'hsl(var(--sunrise))',
    color: 'white',
    size: '8px',
  },
}
```

---

### **Responsive Behavior**

**Mobile Only (< 768px)**
- Always visible and fixed to bottom
- Full width
- 64px height + safe area padding
- Touch targets: 48px minimum

**Tablet/Desktop (≥ 768px)**
- Hidden (replaced by DesktopNav)
- Use CSS: `@media (min-width: 768px) { display: none; }`

---

### **Accessibility Requirements**

- [ ] Each tab is a `<button>` or `<Link>` (semantic HTML)
- [ ] Active tab has `aria-current="page"`
- [ ] Each tab has `aria-label` (descriptive, not just icon)
- [ ] Badge count has `aria-label="3 new notifications"`
- [ ] Tab order is left-to-right
- [ ] Focus indicators visible (2px ring)
- [ ] Touch targets minimum 44x44px
- [ ] Keyboard navigation works (Arrow keys)
- [ ] Screen reader announces tab changes
- [ ] Respect reduced motion (no animations)

---

### **Technical Implementation Notes**

#### **Safe Area Padding (iOS)**
```css
/* Handle iPhone notch and home indicator */
.mobile-nav {
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

#### **Fixed Positioning**
```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky); /* 1020 */
}
```

#### **Primary Action Elevation**
```tsx
// Center button should be elevated above other tabs
<button className="relative -top-3 rounded-full w-14 h-14 bg-forest-canopy shadow-lg">
  <PlusIcon className="w-6 h-6 text-white" />
</button>
```

---

### **Cursor Build Prompt**

```
Create the MobileNav component using MagicUI Dock with hamburger menu.

Prerequisites:
1. Install MagicUI Dock: npx magicui-cli add dock
2. Install AnimatedThemeToggler: npx magicui-cli add animated-theme-toggler

Context:
@WP2_Design_Tokens_Specification.md (design tokens)
@WP2_Component_Guidelines.md (8 states)
@components/magicui/dock.tsx (MagicUI Dock)
@components/magicui/animated-theme-toggler.tsx (theme toggle)
@components/ui/sheet.tsx (hamburger menu)
@components/ui/separator.tsx (separators)
@components/ui/avatar.tsx (user avatar)

Task: Create three connected components:

1. MOBILE DOCK (Bottom Navigation)
   File: components/ecovilla/navigation/mobile-dock.tsx
   
   5 items with MagicUI Dock:
   - Home (🏠) → /dashboard
   - Map (🗺️) → /map
   - Create (+) → Opens modal (elevated, centered)
   - Events (📅) → /events
   - Exchange (💱) → /exchange
   
   Create button config:
   - Elevated: -top-3 positioning
   - Size: 56px circle (larger than others)
   - Background: forest-canopy
   - Icon: Plus (white)
   - Shadow: shadow-lg
   - Separators on both sides (vertical, h-8)
   
   Dock config:
   - magnification: 60
   - distance: 140
   - direction: "middle"
   - Position: fixed bottom-0
   - Safe area padding: pb-safe
   
   Icon states:
   - Active: forest-canopy color + fill-current (filled icon)
   - Inactive: mist-gray color (outlined icon)
   - Badge: sunrise background, white text, -top-1 -right-1
   
2. HAMBURGER MENU (Top Left)
   File: components/ecovilla/navigation/hamburger-menu.tsx
   
   Trigger: [☰] button top-left
   Opens: Sheet drawer from left
   
   Menu items:
   - 📢 Announcements → /announcements [badge if unread]
   - 👥 Browse Residents → /residents
   - ⚠️ My Requests → /requests [badge if unread]
   - 📍 Check-ins → /checkins
   - ─────────── (separator)
   - 👤 My Profile → /profile (includes all settings)
   - ─────────── (separator)
   - 🚪 Logout → handle logout
   
   NOTE: No separate Settings page. Profile includes privacy, notifications, 
   theme, family management, and account settings.
   
   Style:
   - Width: 280px
   - Background: earth-snow
   - Items: hover:bg-earth-cloud
   - Active: bg-forest-mist text-forest-canopy
   
3. TOP BAR (Header)
   File: components/ecovilla/navigation/mobile-top-bar.tsx
   
   Layout:
   - Left: Hamburger button [☰]
   - Right: AnimatedThemeToggler + Avatar
   
   AnimatedThemeToggler:
   - Component: MagicUI animated-theme-toggler
   - Position: top-right (next to avatar)
   - Colors: forest-canopy (light) / moon (dark)
   - **NOTE**: Dark mode logic not yet in backend
   - **TODO**: Store preference in localStorage for now
   - **TODO**: Later will sync with user preferences API
   
   Avatar:
   - Size: 40px circle
   - Border: 2px earth-pebble
   - Click → Opens hamburger menu (alternative trigger)
   
4. CREATE MODAL
   File: components/ecovilla/navigation/create-modal.tsx
   
   Trigger: Create button in dock
   Opens: Sheet drawer from bottom
   
   4 options (cards):
   - 📍 Check-in → /checkins/create
   - 📅 Event → /events/create
   - 💱 Listing → /exchange/create
   - ⚠️ Request → /requests/create
   
   Each card:
   - Icon + Title + Description
   - Hover: slight lift (shadow-md)
   - Click: navigate + close modal
   
   Bottom: Cancel button

Responsive:
- Visible: < 768px only
- Hidden: ≥ 768px (desktop uses DesktopNav)

Design tokens:
- Dock background: earth-snow with blur
- Active: forest-canopy
- Inactive: mist-gray
- Elevated button: forest-canopy bg, white icon
- Badge: sunrise bg
- Hover: earth-cloud

Make it smooth, delightful, with macOS-style magnification.
```

---

### **Testing Checklist**

**Functionality**
- [ ] Navigation works (all tabs)
- [ ] Active state highlights current page
- [ ] Primary action opens modal/page
- [ ] Badge counts display correctly
- [ ] Links use Next.js router (no full reload)

**Responsive**
- [ ] Visible on mobile (< 768px)
- [ ] Hidden on tablet/desktop (≥ 768px)
- [ ] Safe area padding works on iPhone
- [ ] Doesn't cover page content
- [ ] Fixed positioning works on scroll

**Accessibility**
- [ ] All tabs keyboard accessible
- [ ] Active tab announced
- [ ] Badge counts announced
- [ ] Focus indicators visible
- [ ] Touch targets ≥ 44px
- [ ] Screen reader friendly

**Design**
- [ ] Uses WP2 design tokens
- [ ] Active state is forest-canopy
- [ ] Primary action is elevated
- [ ] Smooth animations (respect reduced motion)
- [ ] Icons are crisp at 24px

---

## Component 3: DesktopNav

### **What It Is**

Collapsible sidebar navigation with 3 logical sections (My, Community, Settings), plus a Floating Action Button for create actions.

### **Why It's Critical**

- Desktop users need persistent navigation
- More screen real estate = more nav options
- Collapsible = saves space when needed
- Professional app feel
- Clear information architecture

---

### **Visual Structure**

#### **Expanded Sidebar (256px width)**
```
┌────────────────┬────────────────────────────────────┐
│ [Logo]         │                                    │
│ Ecovilla       │                                    │
│                │                                    │
│ MY             │         [Page Content]            │
│ 🏠 Dashboard   │                                    │
│ 📢 Announce.   │                                    │
│                │                                    │
│ COMMUNITY      │                                    │
│ 👥 Residents   │                                    │
│ 🗺️  Map        │                                    │
│ 📅 Events      │                                    │
│ 💱 Exchange    │                                    │
│ ⚠️  Requests   │                                    │
│ 📍 Check-ins   │                                    │
│                │                                    │
│ PROFILE        │                                    │
│ 👤 Profile     │                                    │
│                │                                    │
│ [User Avatar]  │                 [FAB: +]          │
│ Sofia M.       │                 └─────────────────│
│ [◀ Collapse]   │                                    │
│ [🔆/🌙]         │                                    │
└────────────────┴────────────────────────────────────┘
```

#### **Collapsed Sidebar (80px width)**
```
┌──────┬──────────────────────────────────────────┐
│ [📱] │                                           │
│      │                                           │
│ ───  │                                           │
│ 🏠   │         [Page Content]                   │
│ 📢   │                                           │
│ ───  │                                           │
│ 👥   │                                           │
│ 🗺️    │                                           │
│ 📅   │                                           │
│ 💱   │                                           │
│ ⚠️    │                                           │
│ 📍   │                                           │
│ ───  │                                           │
│ 👤   │                 [FAB: +]                 │
│      │                 └─────────────────────────│
│ [👤] │                                           │
│ [▶]  │                                           │
│ [🔆] │                                           │
└──────┴──────────────────────────────────────────┘
```

---

### **Navigation Structure (3 Sections)**

#### **Section 1: MY**
Personal content and updates
- 🏠 **Dashboard** → `/dashboard` (overview of everything)
- 📢 **Announcements** → `/announcements` [badge if unread]

#### **Section 2: COMMUNITY**
Community engagement features
- 👥 **Residents** → `/residents` (browse neighbors)
- 🗺️ **Map** → `/map` (community map)
- 📅 **Events** → `/events` (calendar)
- 💱 **Exchange** → `/exchange` (share/borrow)
- ⚠️ **Requests** → `/requests` (maintenance, questions) [badge if yours pending]
- 📍 **Check-ins** → `/checkins` (location-based updates)

#### **Section 3: SETTINGS**
Profile management
- 👤 **Profile** → `/profile` (includes all user settings)

**Note:** Profile page is comprehensive and contains:
- Personal info (name, bio, avatar, interests, skills)
- Privacy settings (visibility, sharing preferences)
- Family settings (add family members, manage relationships)
- Notification preferences (email, push, in-app)
- Theme toggle (light/dark mode)
- Account management (email, password, delete account)

**No separate Settings page needed** - everything is in Profile.

---

### **Floating Action Button (FAB)**

**Position:** Bottom right corner, fixed  
**Opens:** Same create modal as mobile (4 options)

```
                                    [  +  ] ← FAB
                                    └───────┘
                                    56x56px
                                    forest-canopy
                                    shadow-lg
```

**Modal content:**
- 📍 Check-in
- 📅 Event
- 💱 Listing
- ⚠️ Request

---

### **Dark Mode Toggle**

**Position:** Bottom of sidebar (below user section)  
**Component:** MagicUI AnimatedThemeToggler

```tsx
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler"

<AnimatedThemeToggler 
  className="mb-4"
  // NOTE: Dark mode logic not yet in backend
  // TODO: Store in localStorage for now
  // TODO: Later sync with user preferences API
/>
```

**Behavior:**
- Click toggles light ↔ dark mode
- Stores preference in localStorage
- Applies to entire app
- **Backend TODO:** Add user preferences table with theme column

---

### **Component API**

```tsx
// components/ecovilla/navigation/desktop-nav.tsx

interface DesktopNavProps {
  currentPath: string
  tenantSlug: string
  tenant: {
    name: string
    logo_url: string
  }
  user: {
    name: string
    avatar_url?: string
    role: 'resident' | 'admin' | 'super_admin'
    unreadAnnouncements?: number
    pendingRequests?: number
  }
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// Usage
<DesktopNav
  currentPath="/dashboard"
  tenantSlug="san-mateo"
  tenant={{
    name: "Ecovilla San Mateo",
    logo_url: "/images/ecovilla-logo.png"
  }}
  user={{
    name: "Sofia Martinez",
    avatar_url: "/avatars/sofia.jpg",
    role: "resident",
    unreadAnnouncements: 3,
    pendingRequests: 1
  }}
  isCollapsed={false}
  onToggleCollapse={() => setCollapsed(!collapsed)}
/>
```

---

### **Component Variants**

#### **Variant 1: Resident Navigation**
```
Main
├── Dashboard
├── Events
├── Map
├── Exchange
├── Requests
└── Neighbors

Settings
├── Settings
└── Profile
```

#### **Variant 2: Admin Navigation**
```
Admin
├── Dashboard
├── Residents
├── Families
├── Locations
├── Events
└── Requests

Settings
├── Settings
└── Profile
```

#### **Variant 3: Super Admin Navigation**
```
Super Admin
├── Dashboard
├── Tenants
└── Analytics

Settings
├── Settings
└── Profile
```

---

### **Component States**

#### **1. Default (Inactive Item)**
- Icon: mist-gray
- Label: mist-gray
- No background
- Hover: earth-cloud background

#### **2. Active Item**
- Icon: forest-canopy
- Label: forest-canopy, font-semibold
- Background: forest-mist
- Left border: 4px forest-canopy

#### **3. Hover**
- Background: earth-cloud
- Slight icon scale (102%)
- Smooth transition (200ms)
- Cursor: pointer

#### **4. Pressed**
- Background: earth-pebble
- Scale down (98%)
- Quick transition (150ms)

#### **5. With Badge**
- Badge on right side (expanded)
- Badge on icon (collapsed)
- Sunrise-orange background
- Count or dot

#### **6. Collapsed Sidebar**
- Width: 80px
- Icon only (no labels)
- Tooltip on hover (label appears)
- Center-aligned icons

#### **7. With Sub-navigation**
- Chevron icon (▶) indicates expandable
- Sub-items indented when expanded
- Accordion behavior (one open at a time)

---

### **Design Tokens Usage**

```tsx
const styles = {
  sidebar: {
    expanded: {
      width: '256px',
      background: 'hsl(var(--earth-snow))',
      borderRight: '1px solid hsl(var(--earth-pebble))',
    },
    collapsed: {
      width: '80px',
    },
  },
  item: {
    inactive: {
      color: 'hsl(var(--mist-gray))',
      hover: 'hsl(var(--earth-cloud))',
    },
    active: {
      color: 'hsl(var(--forest-canopy))',
      background: 'hsl(var(--forest-mist))',
      borderLeft: '4px solid hsl(var(--forest-canopy))',
    },
  },
  logo: {
    height: '48px',
    margin: 'space-6',
  },
  user: {
    padding: 'space-4',
    background: 'hsl(var(--earth-cloud))',
    borderTop: '1px solid hsl(var(--earth-pebble))',
  },
}
```

---

### **Responsive Behavior**

**Mobile (< 768px)**
- Hidden (use MobileNav instead)
- CSS: `@media (max-width: 767px) { display: none; }`

**Tablet (768px - 1023px)**
- Visible but defaults to collapsed
- User can expand if needed
- Overlays content (not pushes)

**Desktop (≥ 1024px)**
- Visible and expanded by default
- Pushes content (sidebar + content layout)
- User preference saved (localStorage)

---

### **Accessibility Requirements**

- [ ] Semantic HTML (`<nav>`, `<ul>`, `<li>`)
- [ ] Active item has `aria-current="page"`
- [ ] Each link has descriptive `aria-label`
- [ ] Collapse button has `aria-label="Collapse sidebar"` / "Expand sidebar"
- [ ] Collapsed state has `aria-expanded="false"`
- [ ] Tooltips on collapsed items (hover shows label)
- [ ] Keyboard navigation (Tab, Arrow keys, Enter)
- [ ] Focus indicators visible (2px ring)
- [ ] Screen reader announces navigation changes
- [ ] Badge counts announced ("3 new events")
- [ ] Skip to content link at top

---

### **Technical Implementation Notes**

#### **Collapse Animation**
```tsx
// Smooth width transition
<aside 
  className={`
    transition-all duration-300
    ${isCollapsed ? 'w-20' : 'w-64'}
  `}
>
  {/* Content */}
</aside>
```

#### **Persist Collapse State**
```tsx
// Save user preference
const [isCollapsed, setIsCollapsed] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  }
  return false
})

const handleToggle = () => {
  const newState = !isCollapsed
  setIsCollapsed(newState)
  localStorage.setItem('sidebar-collapsed', String(newState))
}
```

#### **Tooltip on Collapsed Items**
```tsx
// Show label on hover when collapsed
{isCollapsed && (
  <Tooltip>
    <TooltipTrigger asChild>
      <button>
        <HomeIcon />
      </button>
    </TooltipTrigger>
    <TooltipContent side="right">
      Dashboard
    </TooltipContent>
  </Tooltip>
)}
```

---

### **Cursor Build Prompt**

```
Create the DesktopNav sidebar with 3-section structure and FAB.

Prerequisites:
1. Install AnimatedThemeToggler: npx magicui-cli add animated-theme-toggler

Context:
@WP2_Design_Tokens_Specification.md (design tokens)
@WP2_Component_Guidelines.md (8 states)
@components/ui/button.tsx (use for nav items)
@components/ui/separator.tsx (between sections)
@components/ui/avatar.tsx (user avatar)
@components/ui/tooltip.tsx (collapsed state labels)
@components/ui/sheet.tsx (FAB modal)
@components/magicui/animated-theme-toggler.tsx

Task: Create two connected components:

1. DESKTOP SIDEBAR
   File: components/ecovilla/navigation/desktop-nav.tsx
   
   Layout:
   - Width: 256px expanded, 80px collapsed
   - Position: fixed left-0
   - Height: 100vh
   - Background: earth-snow
   - Border right: 1px earth-pebble
   
   Top section:
   - Tenant logo (120px width, auto height)
   - Tenant name (text-lg font-semibold)
   - Padding: space-6
   
   Navigation (3 sections):
   
   SECTION 1: MY (label: text-xs uppercase text-mist-gray)
   - 🏠 Dashboard → /dashboard
   - 📢 Announcements → /announcements [badge if unread]
   
   [Separator]
   
   SECTION 2: COMMUNITY
   - 👥 Residents → /residents
   - 🗺️ Map → /map
   - 📅 Events → /events
   - 💱 Exchange → /exchange
   - ⚠️ Requests → /requests [badge if pending]
   - 📍 Check-ins → /checkins
   
   [Separator]
   
   SECTION 3: PROFILE (not "Settings")
   - 👤 Profile → /profile
   
   NOTE: Profile page includes all user settings (privacy, notifications,
   theme, family, account). No separate Settings page.
   
   Bottom section (fixed):
   - AnimatedThemeToggler
   - User avatar + name
   - Collapse toggle button
   
   Nav item styling:
   - Height: 48px
   - Padding: space-4 horizontal, space-2 vertical
   - Icons: 20px size, left-aligned
   - Label: text-sm, space-3 from icon
   - Active: bg-forest-mist, text-forest-canopy, 4px left border (forest-canopy)
   - Inactive: text-mist-gray
   - Hover: bg-earth-cloud
   - Badge: sunrise background, white text, right-aligned
   
   Collapsed state:
   - Width: 80px
   - Icons only (centered)
   - Tooltips on hover (show label)
   - Section labels hidden
   - User name hidden (just avatar)
   
   AnimatedThemeToggler:
   - Position: Above user section
   - Centered when collapsed
   - **NOTE**: Dark mode not in backend yet
   - **TODO**: Store in localStorage
   - **TODO**: Add comment for future backend integration
   
2. FLOATING ACTION BUTTON (FAB)
   File: components/ecovilla/navigation/create-fab.tsx
   
   Position:
   - fixed bottom-8 right-8
   - z-index: 1040 (above content, below modals)
   
   Button:
   - Size: 56x56px circle
   - Background: forest-canopy
   - Icon: Plus (white, 24px)
   - Shadow: shadow-lg
   - Hover: shadow-xl + scale-105
   - Active: scale-95
   
   On click: Opens create modal (same as mobile)
   
   Modal (Sheet from bottom):
   4 options:
   - 📍 Check-in
   - 📅 Event
   - 💱 Listing
   - ⚠️ Request

Responsive:
- Visible: ≥ 768px only
- Hidden: < 768px (mobile uses MobileNav)

State persistence:
- Collapse state: localStorage('desktop-nav-collapsed')
- Theme: localStorage('theme') until backend ready

Design tokens:
- Background: earth-snow
- Border: earth-pebble
- Active: forest-canopy (bg, text, border)
- Inactive: mist-gray
- Hover: earth-cloud
- FAB: forest-canopy bg, white icon
- Badge: sunrise bg

Make it professional, smooth, and consistent with mobile nav.
```

---

### **Testing Checklist**

**Functionality**
- [ ] Navigation works (all links)
- [ ] Active state highlights current page
- [ ] Collapse/expand works smoothly
- [ ] Collapse state persists (localStorage)
- [ ] Badge counts display correctly
- [ ] User avatar and name display
- [ ] Logout button works
- [ ] Sub-navigation expands/collapses

**Responsive**
- [ ] Hidden on mobile (< 768px)
- [ ] Visible on tablet (768px+)
- [ ] Defaults collapsed on tablet
- [ ] Defaults expanded on desktop (1024px+)
- [ ] Animation is smooth (300ms)
- [ ] Content layout adjusts properly

**Accessibility**
- [ ] All links keyboard accessible
- [ ] Active link announced
- [ ] Tooltips appear on collapsed hover
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Skip to content link works

**Design**
- [ ] Uses WP2 design tokens
- [ ] Active state has forest-canopy + left border
- [ ] Hover state is subtle
- [ ] Logo displays correctly
- [ ] User section at bottom
- [ ] Smooth transitions

---

## Implementation Timeline

### **Day 1: TenantLoginPage** (4-5 hours)
- Morning: Build base component structure
- Afternoon: Add form validation and states
- Evening: Test responsive + accessibility

### **Day 2: MobileNav** (2-3 hours)
- Morning: Build nav component
- Afternoon: Add badge support and states
- Evening: Test on mobile devices

### **Day 3: DesktopNav** (3-4 hours)
- Morning: Build sidebar structure
- Afternoon: Add collapse/expand functionality
- Evening: Test responsive behavior + persistence

**Total:** 8-12 hours (adjust based on complexity encountered)

---

## Testing Strategy

### **Manual Testing**

Create test routes:
```
/test-login - Test TenantLoginPage with different tenants
/test-nav - Test MobileNav and DesktopNav together
```

### **Device Testing**

**Mobile:**
- iPhone SE (smallest)
- iPhone 14 Pro (notch)
- Android (various sizes)

**Desktop:**
- 1280px (small laptop)
- 1920px (standard monitor)
- 2560px+ (large monitor)

### **Browser Testing**

- Chrome (primary)
- Safari (iOS/macOS)
- Firefox
- Edge

---

## Success Criteria

WP3 Critical Components are complete when:

- [ ] TenantLoginPage renders correctly for all tenants
- [ ] Login form validates and submits
- [ ] MobileNav displays on mobile (< 768px)
- [ ] DesktopNav displays on desktop (≥ 768px)
- [ ] Navigation highlights active page
- [ ] All components use WP2 design tokens
- [ ] All 8 component states implemented
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Responsive behavior works across devices
- [ ] Components tested in multiple browsers
- [ ] Git commit: "feat(components): Add critical navigation components"

---

## What's Next?

After these 3 components are built:

**WP3 Complete** ✅
- Component library installed
- Critical components built
- Ready for screen development

**Move to WP5** 🚀
- Start building actual screens
- Use installed components
- Build custom components as needed
- Document in Storybook alongside

---

**End of Critical Components Specification**