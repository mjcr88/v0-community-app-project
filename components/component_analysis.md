# WP3: Component Analysis & Mapping
## Ecovilla Community Platform - Complete Component Breakdown

**Version**: 1.0  
**Created**: November 2024  
**Purpose**: Understand what components exist, what they can be reduced to, and which to use where

---

## Table of Contents

1. [Understanding UI Components](#part-1-understanding-ui-components)
2. [Your Current Screens](#part-2-your-current-61-screens)
3. [Component Taxonomy](#part-3-component-taxonomy-ux-ui-explained)
4. [Screen-to-Component Mapping](#part-4-screen-to-component-mapping)
5. [Library Component Selection](#part-5-library-component-selection)
6. [Custom Component Needs](#part-6-custom-ecovilla-components)
7. [Web vs Mobile Strategy](#part-7-web-vs-mobile-considerations)
8. [Final Component List](#part-8-final-component-selection)

---

## Part 1: Understanding UI Components

### What is a "Component" in UX/UI?

Think of components as **LEGO blocks for interfaces**. Just like you can build many different structures from the same LEGO pieces, you can build many different screens from the same UI components.

### The Three Levels of Components

#### **Level 1: Atomic Components** (Smallest building blocks)
These are the tiniest, most basic pieces that can't be broken down further:
- Button
- Input field
- Checkbox
- Icon
- Label
- Badge

**Example:** A single button that says "Save Changes"

---

#### **Level 2: Molecule Components** (Combined atoms)
These combine 2-3 atomic components to create a functional unit:
- Form field (label + input + error message)
- Search bar (input + icon + button)
- User avatar (image + online status badge)
- Dropdown menu (button + list)

**Example:** A search bar = input field + search icon + search button

---

#### **Level 3: Organism Components** (Complex patterns)
These are larger, feature-complete sections that combine molecules:
- Navigation bar (logo + menu items + user dropdown)
- Event card (title + date + location + RSVP button + attendee avatars)
- Data table (search + filters + table + pagination)
- Form (multiple form fields + submit button + error summary)

**Example:** An event card showing all event details with interactive elements

---

### Why This Matters

**Without components:** You'd rebuild the same button 50 times across 61 screens  
**With components:** You build the button ONCE, reuse it 50 times

**Benefits:**
- ✅ **Consistency** - All buttons look and behave the same
- ✅ **Speed** - Build new screens 10x faster
- ✅ **Maintenance** - Fix a bug once, fixes everywhere
- ✅ **Accessibility** - Build it right once, accessible everywhere

---

## Part 2: Your Current 61 Screens

### Super Admin (6 screens)
1. `/backoffice/dashboard` - Super admin overview
2. `/backoffice/dashboard/tenants` - Tenant list
3. `/backoffice/dashboard/tenants/create` - Create new tenant
4. `/backoffice/dashboard/tenants/[id]` - Tenant details
5. `/backoffice/dashboard/tenants/[id]/edit` - Edit tenant
6. `/backoffice/dashboard/tenants/[id]/features` - Feature toggles

### Tenant Admin (20 screens)
7. `/t/[slug]/admin/dashboard` - Admin dashboard
8. `/t/[slug]/admin/residents` - Resident list
9. `/t/[slug]/admin/residents/create` - Create resident
10. `/t/[slug]/admin/residents/[id]` - Resident profile
11. `/t/[slug]/admin/residents/[id]/edit` - Edit resident
12. `/t/[slug]/admin/families` - Family list
13. `/t/[slug]/admin/families/create` - Create family
14. `/t/[slug]/admin/families/[id]/edit` - Edit family
15. `/t/[slug]/admin/locations` - Location management
16. `/t/[slug]/admin/locations/create` - Create location
17. `/t/[slug]/admin/locations/[id]/edit` - Edit location
18. `/t/[slug]/admin/map` - Admin map view
19. `/t/[slug]/admin/map/import` - GeoJSON import
20. `/t/[slug]/admin/events` - Event management
21. `/t/[slug]/admin/events/create` - Create event
22. `/t/[slug]/admin/events/[id]/edit` - Edit event
23. `/t/[slug]/admin/exchange` - Exchange management
24. `/t/[slug]/admin/requests` - Request management
25. `/t/[slug]/admin/requests/[id]` - Request detail
26. `/t/[slug]/admin/announcements` - Announcement management

### Resident (29 screens)
27. `/t/[slug]/login` - Login
28. `/t/[slug]/invite/[token]` - Invite signup
29. `/t/[slug]/onboarding` - Onboarding start
30. `/t/[slug]/onboarding/profile` - Profile setup
31. `/t/[slug]/onboarding/journey` - Journey selection
32. `/t/[slug]/onboarding/interests` - Interest selection
33. `/t/[slug]/onboarding/skills` - Skill selection
34. `/t/[slug]/onboarding/complete` - Onboarding complete
35. `/t/[slug]/dashboard` - Resident dashboard
36. `/t/[slug]/dashboard/neighbours` - Neighbor directory
37. `/t/[slug]/dashboard/neighbours/[id]` - Neighbor profile
38. `/t/[slug]/dashboard/events` - Event list
39. `/t/[slug]/dashboard/events/[id]` - Event detail
40. `/t/[slug]/dashboard/events/create` - Create event
41. `/t/[slug]/dashboard/map` - Community map
42. `/t/[slug]/dashboard/map/locations/[id]` - Location detail
43. `/t/[slug]/dashboard/checkins` - Check-in feed
44. `/t/[slug]/dashboard/checkins/create` - Create check-in
45. `/t/[slug]/dashboard/exchange` - Exchange directory
46. `/t/[slug]/dashboard/exchange/[id]` - Listing detail
47. `/t/[slug]/dashboard/exchange/create` - Create listing
48. `/t/[slug]/dashboard/exchange/my-listings` - My listings
49. `/t/[slug]/dashboard/exchange/borrowing` - Borrowing history
50. `/t/[slug]/dashboard/requests` - Request list
51. `/t/[slug]/dashboard/requests/create` - Create request
52. `/t/[slug]/dashboard/requests/[id]` - Request detail
53. `/t/[slug]/dashboard/settings` - Settings overview
54. `/t/[slug]/dashboard/settings/profile` - Profile settings
55. `/t/[slug]/dashboard/settings/privacy` - Privacy settings
56. `/t/[slug]/dashboard/settings/notifications` - Notification settings
57. `/t/[slug]/dashboard/settings/account` - Account settings

### Public (4 screens)
58. `/` - Landing page
59. `/about` - About Ecovilla
60. `/pricing` - Pricing information
61. `/contact` - Contact form

---

## Part 3: Component Taxonomy (UX/UI Explained)

Let me explain each type of component you'll encounter:

### Navigation Components
**What they do:** Help users move around the app

| Component | Description | Example Use |
|-----------|-------------|-------------|
| **Navigation Bar** | Top bar with menu | "Home, Events, Map, Profile" |
| **Bottom Tab Bar** | Mobile navigation | iOS-style bottom tabs |
| **Sidebar** | Desktop side menu | Admin panel menu |
| **Breadcrumbs** | "You are here" trail | "Dashboard > Events > Create" |
| **Pagination** | Page through lists | "1, 2, 3... Next" |

---

### Data Display Components
**What they do:** Show information to users

| Component | Description | Example Use |
|-----------|-------------|-------------|
| **Card** | Container for content | Event card, Resident card |
| **Table** | Rows and columns | Resident list, Event list |
| **List** | Vertical stack of items | Notification feed |
| **Badge** | Small label/tag | "New", "Urgent", "Online" |
| **Avatar** | User profile picture | User photo (circular) |
| **Stat Card** | Number with label | "45 Residents", "12 Events" |
| **Empty State** | "Nothing here yet" | When no events exist |
| **Skeleton** | Loading placeholder | Gray boxes while loading |

---

### Input Components
**What they do:** Collect information from users

| Component | Description | Example Use |
|-----------|-------------|-------------|
| **Text Input** | Type text | Name, email, search |
| **Text Area** | Multi-line text | Event description, bio |
| **Select Dropdown** | Choose one option | Country, category |
| **Checkbox** | On/off toggle | "I agree to terms" |
| **Radio Button** | Choose one of many | "Male / Female / Other" |
| **Switch** | On/off slider | "Enable notifications" |
| **Date Picker** | Select date | Event date |
| **Time Picker** | Select time | Event time |
| **File Upload** | Upload files | Profile picture, GeoJSON |
| **Search Bar** | Search input | "Search residents..." |

---

### Feedback Components
**What they do:** Give users feedback on actions

| Component | Description | Example Use |
|-----------|-------------|-------------|
| **Alert** | Important message box | "Event created successfully!" |
| **Toast** | Temporary popup | "Saved!" (disappears) |
| **Modal/Dialog** | Popup window | "Are you sure you want to delete?" |
| **Progress Bar** | Show progress | File upload progress |
| **Spinner** | Loading indicator | Animated spinner |
| **Tooltip** | Hover explanation | Hover over icon → "Edit profile" |

---

### Action Components
**What they do:** Trigger actions

| Component | Description | Example Use |
|-----------|-------------|-------------|
| **Button** | Clickable action | "Save", "Cancel", "Delete" |
| **Link** | Navigate to page | "View full calendar" |
| **Icon Button** | Button with icon only | ✏️ (edit), 🗑️ (delete) |
| **Floating Action Button** | Prominent action | Big + button (mobile) |
| **Dropdown Menu** | Actions menu | ⋮ → "Edit, Delete, Share" |

---

### Layout Components
**What they do:** Organize other components

| Component | Description | Example Use |
|-----------|-------------|-------------|
| **Container** | Max-width wrapper | Center content on wide screens |
| **Grid** | Column layout | 3-column card grid |
| **Stack** | Vertical spacing | List of items with gaps |
| **Tabs** | Switchable sections | "Overview | Details | History" |
| **Accordion** | Collapsible sections | FAQ, Long forms |
| **Separator** | Visual divider | Line between sections |
| **Scroll Area** | Scrollable content | Long lists |

---

## Part 4: Screen-to-Component Mapping

Now let's map your 61 screens to the components they need.

### Example: Resident Dashboard (`/t/[slug]/dashboard`)

**Visual Breakdown:**
```
┌─────────────────────────────────────────────┐
│ [Navigation Bar]                             │ ← Navigation
├─────────────────────────────────────────────┤
│ Welcome back, Sofia!                         │ ← Heading
│ [Profile completion progress bar]            │ ← Progress Bar
├─────────────────────────────────────────────┤
│ Quick Actions                                │
│ [Button: Create Event] [Button: Check In]   │ ← Buttons
├─────────────────────────────────────────────┤
│ Announcements                                │
│ ┌───────────────────────────────────────┐   │
│ │ [Alert Card: Important update!]       │   │ ← Alert Card
│ └───────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ Upcoming Events                              │
│ ┌─────────────────────────────────────┐     │
│ │ [Event Card]                         │     │ ← Event Card (custom)
│ │ Build Day Tomorrow                   │     │
│ │ Saturday 9:00 AM • Common Area       │     │
│ │ [Avatar] [Avatar] +5 more            │     │ ← Avatar Group
│ │ [Button: RSVP]                       │     │ ← Button
│ └─────────────────────────────────────┘     │
│ ┌─────────────────────────────────────┐     │
│ │ [Event Card] ...                     │     │
│ └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
│ [Bottom Tab Bar]                             │ ← Mobile Navigation
└─────────────────────────────────────────────┘
```

**Components Needed:**
1. **Navigation Bar** (layout) - shadcn
2. **Heading** (typography) - native HTML
3. **Progress Bar** (feedback) - shadcn
4. **Button** (action) - shadcn
5. **Alert Card** (feedback) - shadcn Alert
6. **Event Card** (custom) - **BUILD THIS**
7. **Avatar** (display) - shadcn
8. **Bottom Tab Bar** (navigation) - **BUILD THIS**

---

### Component Frequency Analysis

Let me analyze how often each component appears across all 61 screens:

#### High Frequency (Appears on 40+ screens)
- **Button** - Every screen
- **Card** - 50+ screens
- **Input fields** - 30+ screens
- **Navigation** - Every screen

#### Medium Frequency (Appears on 10-30 screens)
- **Data Table** - 15 screens (all list views)
- **Modal/Dialog** - 20 screens (confirmations, forms)
- **Badge** - 25 screens (status indicators)
- **Avatar** - 20 screens (user profiles)

#### Low Frequency (Appears on <10 screens)
- **Date Picker** - 5 screens (event forms)
- **Map** - 3 screens (map feature)
- **File Upload** - 4 screens (profile, import)
- **Progress Bar** - 3 screens (onboarding, upload)

---

### Screen Categories & Their Components

#### **List/Directory Screens** (15 screens)
Examples: Residents, Events, Exchange, Requests

**Components Needed:**
- Data Table (with sorting, filtering)
- Search Bar
- Filter Dropdowns
- Pagination
- Empty State
- Badge (status indicators)
- Avatar (user photos)

**Example Screens:**
- `/t/[slug]/admin/residents` - Resident table
- `/t/[slug]/dashboard/events` - Event list
- `/t/[slug]/dashboard/exchange` - Listing table

---

#### **Detail/Profile Screens** (12 screens)
Examples: Event detail, Resident profile, Listing detail

**Components Needed:**
- Card (content container)
- Tabs (different sections)
- Badge (status, categories)
- Avatar (user photo)
- Button (actions like Edit, Delete)
- Separator (visual dividers)

**Example Screens:**
- `/t/[slug]/dashboard/events/[id]` - Event detail
- `/t/[slug]/dashboard/neighbours/[id]` - Resident profile
- `/t/[slug]/dashboard/exchange/[id]` - Listing detail

---

#### **Form/Creation Screens** (18 screens)
Examples: Create event, Edit profile, Create listing

**Components Needed:**
- Text Input
- Text Area
- Select Dropdown
- Checkbox
- Radio Button
- Date Picker
- File Upload
- Button (Submit, Cancel)
- Form validation messages

**Example Screens:**
- `/t/[slug]/dashboard/events/create` - Create event
- `/t/[slug]/admin/residents/create` - Create resident
- `/t/[slug]/dashboard/exchange/create` - Create listing

---

#### **Dashboard/Overview Screens** (8 screens)
Examples: Resident dashboard, Admin dashboard

**Components Needed:**
- Stat Cards (metrics)
- Chart/Graph (if analytics)
- Card (content sections)
- List (recent activity)
- Button (quick actions)
- Alert (announcements)

**Example Screens:**
- `/t/[slug]/dashboard` - Resident dashboard
- `/t/[slug]/admin/dashboard` - Admin dashboard
- `/backoffice/dashboard` - Super admin dashboard

---

#### **Settings Screens** (4 screens)
Examples: Profile settings, Privacy, Notifications

**Components Needed:**
- Tabs (different settings sections)
- Switch (toggle settings)
- Text Input (update profile)
- Button (Save changes)
- Alert (confirmation messages)

**Example Screens:**
- `/t/[slug]/dashboard/settings/profile`
- `/t/[slug]/dashboard/settings/privacy`
- `/t/[slug]/dashboard/settings/notifications`

---

#### **Map Screens** (4 screens)
Examples: Community map, Admin map, Location detail

**Components Needed:**
- Map Container (Mapbox/Google Maps)
- Location Pin (custom markers)
- Location Card (popup info)
- Legend (layer controls)
- Search Bar (location search)

**Example Screens:**
- `/t/[slug]/dashboard/map`
- `/t/[slug]/admin/map`
- `/t/[slug]/admin/map/import`

---

## Part 5: Library Component Selection

Now let's decide which components to use from which libraries.

### shadcn/ui Components (Foundation - 45 selected)

#### ✅ **Must Have** (Use on 40+ screens)

| Component | Screens Using | Priority | Notes |
|-----------|---------------|----------|-------|
| **Button** | All 61 | P0 | Primary action component |
| **Card** | 50+ | P0 | Main content container |
| **Input** | 30+ | P0 | Text fields everywhere |
| **Label** | 30+ | P0 | Form labels |
| **Select** | 20+ | P0 | Dropdowns for forms |
| **Textarea** | 15+ | P0 | Multi-line text (bios, descriptions) |
| **Badge** | 25+ | P0 | Status indicators |
| **Avatar** | 20+ | P0 | User photos |
| **Dialog** | 20+ | P0 | Modals, confirmations |
| **Dropdown Menu** | 15+ | P0 | Action menus |
| **Tabs** | 12+ | P0 | Dashboard, settings |
| **Alert** | All 61 | P0 | Success/error messages |
| **Separator** | 30+ | P0 | Visual dividers |

**Install Command:**
```bash
npx shadcn@latest add button card input label select textarea badge avatar dialog dropdown-menu tabs alert separator
```

---

#### ✅ **High Priority** (Use on 10-30 screens)

| Component | Screens Using | Priority | Notes |
|-----------|---------------|----------|-------|
| **Table** | 15+ | P1 | All list views |
| **Checkbox** | 10+ | P1 | Multi-select, agreements |
| **Radio Group** | 8+ | P1 | Single choice forms |
| **Switch** | 8+ | P1 | Settings toggles |
| **Toast** | All 61 | P1 | Quick feedback |
| **Tooltip** | 20+ | P1 | Icon explanations |
| **Popover** | 10+ | P1 | Extra info, filters |
| **Scroll Area** | 15+ | P1 | Long lists |
| **Skeleton** | All 61 | P1 | Loading states |
| **Progress** | 5+ | P1 | Onboarding, uploads |
| **Accordion** | 5+ | P1 | Collapsible sections |

**Install Command:**
```bash
npx shadcn@latest add table checkbox radio-group switch toast tooltip popover scroll-area skeleton progress accordion
```

---

#### ✅ **Medium Priority** (Use on 5-10 screens)

| Component | Screens Using | Priority | Notes |
|-----------|---------------|----------|-------|
| **Command** | 5+ | P2 | Search command palette |
| **Calendar** | 5+ | P2 | Event forms |
| **Drawer** | 8+ | P2 | Mobile side menus |
| **Sheet** | 8+ | P2 | Slide-over panels |
| **Breadcrumb** | 10+ | P2 | Navigation trail |
| **Pagination** | 15+ | P2 | Table pagination |
| **Context Menu** | 5+ | P2 | Right-click actions |
| **Slider** | 3+ | P2 | Filters (price range) |
| **Toggle** | 5+ | P2 | View modes |
| **Collapsible** | 8+ | P2 | Expandable sections |

**Install Command:**
```bash
npx shadcn@latest add command calendar drawer sheet breadcrumb pagination context-menu slider toggle collapsible
```

---

#### ⚪ **Low Priority** (Optional/Future)

| Component | Screens Using | Priority | Notes |
|-----------|---------------|----------|-------|
| **Carousel** | 2+ | P3 | Photo galleries |
| **Menubar** | 1 | P3 | Desktop only |
| **Navigation Menu** | 1 | P3 | Complex menus |
| **Resizable** | 0 | P4 | Advanced layouts |
| **Chart** | 2+ | P3 | Analytics (future) |
| **Form** | 0 | P3 | Already using custom |
| **Hover Card** | 3+ | P3 | Enhanced tooltips |
| **Input OTP** | 0 | P4 | 2FA (future) |
| **Sonner** | All 61 | P1 | Toast replacement (better) |

**Install Command:**
```bash
npx shadcn@latest add carousel menubar navigation-menu sonner
```

---

### MagicUI Components (Delight - 31 selected)

**Purpose:** Add "wow" moments, variants, and delightful interactions throughout the app

#### ✅ **Selected for Ecovilla**

| Component | Use Case | Screens | Priority | Notes |
|-----------|----------|---------|----------|-------|
| **Animated Circular Progress Bar** | Onboarding progress | Onboarding flow | P1 | Shows completion % |
| **Animated List** | Event previews | Onboarding, Lists | P1 | Smooth list animations |
| **Animated Theme Toggler** | Dark mode toggle | All screens | P1 | Delightful theme switch |
| **Avatar Circles** | Event attendees | Event cards | P1 | Multiple residents display |
| **Border Beam** | Card variants | Featured content | P2 | Animated border effect |
| **Animated Gradient** | Hero backgrounds | Landing, Dashboard | P2 | Dynamic backgrounds |
| **Bento Grid** | Feature showcase | Landing, About | P2 | Grid layout |
| **Blur Fade** | Content entrance | All pages | P1 | Smooth fade-in |
| **Confetti** | Celebrations | Milestones, Success | P1 | Celebration moments |
| **Cool Mode** | Button delight | Primary CTAs | P2 | Click effect |
| **Dock** | Mobile navigation | Bottom nav (iOS) | P1 | Animated dock |
| **Interactive Hover Button** | Button variant | CTAs | P2 | Enhanced hover |
| **Magic Card** | Card variant | Special content | P2 | Gradient card effect |
| **Marquee** | Scrolling lists | Announcements | P2 | Auto-scroll content |
| **Meteors** | Background effect | Landing page | P3 | Subtle animation |
| **Morphing Text** | Text transitions | Animations | P2 | Text morphing |
| **Number Ticker** | Stat animation | Dashboard stats | P2 | Count-up numbers |
| **Particles** | Background effect | Celebrations | P3 | Particle effects |
| **Progressive Blur** | Long lists | Scrolling content | P2 | Fade at edges |
| **Pulsating Button** | Button variant | Urgent actions | P2 | Pulse animation |
| **Rainbow Button** | Button variant | Special CTAs | P2 | Rainbow effect |
| **Ripple** | Loading screens | Loading states | P2 | Ripple effect |
| **Ripple Button** | Button variant | Interactive CTAs | P2 | Click ripple |
| **Scroll Progress** | Reading progress | Long pages | P2 | Progress indicator |
| **Shimmer Button** | Button variant | Premium actions | P2 | Shimmer effect |
| **Shine Border** | Card highlight | Featured items | P2 | Border shine |
| **Sparkles Text** | Text variant | Special text | P2 | Sparkle effect |
| **Text Animate** | Text animation | Headings | P2 | Text entrance |
| **Typing Animation** | Text reveal | Welcome messages | P1 | Typewriter effect |
| **Video Text** | Text animation | Login/Landing | P2 | Video background text |

**Why these?**
- **Variety of button variants** - Different contexts deserve different delights
- **Multiple text animations** - Keep content fresh and engaging
- **Card variants** - Different importance levels for different content
- **Progress indicators** - Show users where they are in flows
- **Celebration effects** - Make achievements feel special

**Installation:**
```bash
npm install magicui
# All components available from single package
```

---

### CultUI Components (Modern Patterns - 12 selected)

**Purpose:** Modern, trendy UI patterns with advanced interactions

#### ✅ **Selected for Ecovilla**

| Component | Use Case | Screens | Priority | Notes |
|-----------|----------|---------|----------|-------|
| **Canvas Fractal Grid** | Loading entertainment | Loading states | P2 | Engaging loading |
| **Expandable** | Card variant | Content expansion | P2 | Expandable cards |
| **Expandable Screen** | Modal variant | Full-screen modals | P2 | Smooth expansion |
| **Feature Card** | Feature highlights | Landing, About | P2 | Feature showcase |
| **Feature Carousel** | Onboarding flow | Onboarding | P1 | Swipeable features |
| **Hero Section** | Landing hero | Landing page | P1 | Hero layout |
| **Popover** | Info/Actions | Context menus | P2 | Enhanced popover |
| **Popover Form** | Feedback system | Quick forms | P1 | In-place forms |
| **Pricing Card** | Pricing tiers | Pricing page | P1 | Pricing display |
| **Stat Card** | Dashboard metrics | Dashboard | P1 | Stat display |
| **Team Member** | Team profiles | About page | P3 | Team cards |
| **Testimonial** | User quotes | Landing, About | P3 | Social proof |
| **Three D Carousel** | Browse items | Residents, Events | P2 | 3D browsing |
| **Timer** | Check-in countdown | Check-ins | P2 | Time remaining |

**Why these?**
- **Feature Carousel:** Perfect for onboarding education
- **Popover Form:** Quick feedback without leaving page
- **Three D Carousel:** Engaging way to browse residents/events
- **Timer:** Show how long check-ins last
- **Expandable Screen:** Modern modal experience

**Installation:**
```bash
npm install cultui
# Or install individually as needed
```

---

### ReactBits Components (Utility & Effects - 24 selected)

**Purpose:** Practical utilities, text animations, and visual effects

#### ✅ **Selected for Ecovilla**

**Text Animations (7)**
| Component | Use Case | Priority | Notes |
|-----------|----------|----------|-------|
| **Split Text** | Text variant | P2 | Character-by-character animation |
| **Shiny Text** | Loading states | P2 | Shimmer text effect |
| **Gradient Text** | Text variant | P2 | Gradient colored text |
| **True Focus** | Text variant | P2 | Focus effect |
| **Rotating Text** | Text variant | P2 | Word rotation |

**Animations & Effects (6)**
| Component | Use Case | Priority | Notes |
|-----------|----------|----------|-------|
| **Electric Border** | Danger zones | P2 | Animated border (delete, etc.) |
| **Laser Flow** | Login/Landing | P2 | Background effect |
| **Ghost Cursor** | Loading states | P2 | Cursor trail |
| **Splash Cursor** | Loading states | P2 | Click splash |

**Layout Components (6)**
| Component | Use Case | Priority | Notes |
|-----------|----------|----------|-------|
| **Animated List** | Scrolling lists | P2 | List animations |
| **Scroll Stack** | Scrolling content | P2 | Stack effect |
| **Magic Bento** | Bento variant | P2 | Alternative grid |
| **Stepper** | Onboarding/Forms | P1 | Step indicator |

**Card & Display (7)**
| Component | Use Case | Priority | Notes |
|-----------|----------|----------|-------|
| **Circular Gallery** | Browse residents/listings | P2 | Circular layout |
| **Tilted Card** | Card variant | P2 | 3D tilt effect |
| **Dome Gallery** | Resident animation | P2 | 3D dome layout |
| **Profile Card** | Card variant | P1 | User profiles |
| **Spotlight Card** | Card variant | P2 | Spotlight effect |
| **Dock** | Navigation | P1 | macOS-style dock |

**Utilities (2)**
| Component | Use Case | Priority | Notes |
|-----------|----------|----------|-------|
| **File Uploader** | Profile pics, GeoJSON | P1 | Enhanced upload |
| **Search** | Enhanced search | P2 | Better search UX |

**Backgrounds (1)**
| Component | Use Case | Priority | Notes |
|-----------|----------|----------|-------|
| **Orb** | Loading background | P2 | Animated orb |

**Why these?**
- **Multiple text animation variants:** Different contexts deserve different effects
- **Card variety:** Events vs residents vs resources can feel distinct
- **Loading state entertainment:** Make waiting enjoyable
- **Danger zone indicators:** Clear warnings for destructive actions
- **Stepper:** Critical for onboarding and multi-step forms
- **Profile Card:** Pre-built for resident profiles

**Installation:**
```bash
npm install reactbits
# Or import individual components as needed
```

---

## Part 6: Custom Ecovilla Components

These are components **unique to your domain** that don't exist in any library.

### Priority 1: Must Have for Alpha (15 components)

#### Layout Components (5)

**1. SectionCard**
- **What:** Reusable content container with title, description, collapsible
- **Used on:** Dashboard, Events, Exchange (20+ screens)
- **Reduces:** 50+ repeated card patterns
- **Example:**
```tsx
<SectionCard 
  title="Upcoming Events" 
  description="Your next community gatherings"
  collapsible
>
  <EventList />
</SectionCard>
```

---

**2. PageHeader**
- **What:** Consistent page title with actions and breadcrumbs
- **Used on:** Every page (61 screens)
- **Reduces:** 61 repeated header patterns
- **Example:**
```tsx
<PageHeader 
  title="Community Events"
  breadcrumbs={["Dashboard", "Events"]}
  actions={<Button>Create Event</Button>}
/>
```

---

**3. EmptyState**
- **What:** "Nothing here yet" screen with Río character
- **Used on:** Empty lists (20+ screens)
- **Reduces:** 20+ repeated empty patterns
- **Example:**
```tsx
<EmptyState
  icon={<CalendarIcon />}
  title="No events yet"
  description="Create your first community event!"
  action={<Button>Create Event</Button>}
  rioMessage="Let's get this party started! 🎉"
/>
```

---

**4. MobileNav**
- **What:** Bottom navigation bar (mobile-first)
- **Used on:** All resident screens (mobile)
- **Reduces:** Mobile navigation consistency
- **Example:**
```tsx
<MobileNav items={[
  { icon: HomeIcon, label: "Home", href: "/dashboard" },
  { icon: CalendarIcon, label: "Events", href: "/events" },
  { icon: MapIcon, label: "Map", href: "/map" },
  { icon: UserIcon, label: "Profile", href: "/settings" },
]} />
```

---

**5. ContentShell**
- **What:** Main layout wrapper with consistent padding/max-width
- **Used on:** All pages (61 screens)
- **Reduces:** Layout inconsistencies
- **Example:**
```tsx
<ContentShell>
  <PageHeader title="Events" />
  <SectionCard>Content</SectionCard>
</ContentShell>
```

---

#### Community Components (5)

**6. EventCard**
- **What:** Display event with date, location, attendees, RSVP
- **Used on:** Dashboard, Events list (10+ screens)
- **Reduces:** 30+ repeated event displays
- **Example:**
```tsx
<EventCard
  title="Build Day Tomorrow"
  date="2024-11-21T09:00:00"
  location="Common Area"
  attendees={[...avatars]}
  onRSVP={handleRSVP}
/>
```

---

**7. ResidentCard**
- **What:** Show neighbor profile with avatar, bio, interests
- **Used on:** Neighbors, Search (5+ screens)
- **Reduces:** 15+ repeated resident displays
- **Example:**
```tsx
<ResidentCard
  name="Sofia Martinez"
  avatar="/photos/sofia.jpg"
  bio="New to Ecovilla, excited to connect!"
  interests={["Gardening", "Yoga"]}
  status="online"
/>
```

---

**8. InterestBadge**
- **What:** Display interest/skill with icon and color
- **Used on:** Profiles, Onboarding (10+ screens)
- **Reduces:** Badge inconsistencies
- **Example:**
```tsx
<InterestBadge 
  label="Gardening"
  icon={<LeafIcon />}
  variant="forest" // uses design tokens
/>
```

---

**9. StatusIndicator**
- **What:** Online/offline/busy status with dot
- **Used on:** Profiles, Directory (8+ screens)
- **Reduces:** Status display inconsistencies
- **Example:**
```tsx
<StatusIndicator status="online" showLabel />
// → 🟢 Online
```

---

**10. TenantBadge**
- **What:** Community identification badge
- **Used on:** Admin screens, Multi-tenant views (5+ screens)
- **Reduces:** Tenant confusion
- **Example:**
```tsx
<TenantBadge name="Ecovilla San Mateo" logo="/logo.png" />
```

---

#### Resource Components (3)

**11. ResourceCard**
- **What:** Display tool/item for sharing (Carmen's exchange)
- **Used on:** Exchange directory (3+ screens)
- **Reduces:** Listing display inconsistencies
- **Example:**
```tsx
<ResourceCard
  title="Lawn Mower"
  category="Tools"
  availability="available"
  owner={resident}
  onBorrow={handleBorrow}
/>
```

---

**12. AvailabilityBadge**
- **What:** Available/borrowed/overdue/reserved status
- **Used on:** Exchange listings (3+ screens)
- **Reduces:** Status color inconsistencies
- **Example:**
```tsx
<AvailabilityBadge status="available" />
// → 🟢 Available
```

---

**13. ReservationCalendar**
- **What:** Mini calendar showing bookings
- **Used on:** Resource detail, Booking (2 screens)
- **Reduces:** Calendar complexity
- **Example:**
```tsx
<ReservationCalendar
  reservations={bookings}
  onSelectDate={handleSelect}
/>
```

---

#### Map Components (2)

**14. LocationPin**
- **What:** Custom map marker with type-based styling
- **Used on:** Map screens (3 screens)
- **Reduces:** Marker inconsistencies
- **Example:**
```tsx
<LocationPin
  type="facility"
  label="Pool"
  onClick={handleClick}
/>
```

---

**15. LotCard**
- **What:** Display lot/property information
- **Used on:** Map, Admin (3 screens)
- **Reduces:** Lot display complexity
- **Example:**
```tsx
<LotCard
  lotNumber="45A"
  address="123 Forest Lane"
  resident={resident}
  onClick={handleView}
/>
```

---

### Priority 2: Nice to Have (8 components)

**16. BorrowingHistory** - Recent activity list (2 screens)
**17. TipCard** - Contextual help tips (5+ screens)
**18. WelcomeCard** - First-time user greeting (3 screens)
**19. ProgressIndicator** - Profile completion (2 screens)
**20. MapLegend** - Map layer controls (2 screens)
**21. RíoAvatar** - Animated character placeholder (5+ screens)
**22. AnnouncementBanner** - Important updates (All screens)
**23. QuickActionButton** - Floating action button (Mobile)

---

## Part 7: Web vs Mobile Considerations

### Mobile-First Components (Primary Focus)

**These must work perfectly on mobile (320px-768px):**

#### Navigation
- ✅ **MobileNav** (bottom tabs) - Critical for mobile
- ✅ **Drawer** (side menu) - Better than dropdown on mobile
- ❌ **Menubar** - Desktop only, skip for mobile

#### Forms
- ✅ **Large touch targets** (44px minimum)
- ✅ **Date Picker** (native mobile picker preferred)
- ✅ **File Upload** (camera access on mobile)
- ✅ **Select** (native mobile select preferred)

#### Layout
- ✅ **Single column** layouts
- ✅ **Stacked cards** (not side-by-side)
- ✅ **Full-width buttons**
- ✅ **Collapsible sections** (save vertical space)

---

### Desktop Enhancement (Secondary)

**These improve experience on desktop (1024px+):**

#### Navigation
- ✅ **Sidebar** (permanent left menu)
- ✅ **Breadcrumbs** (more space for context)
- ✅ **Dropdown Menu** (more complex interactions)

#### Layout
- ✅ **Multi-column grids** (2-3 columns)
- ✅ **Side-by-side content** (form + preview)
- ✅ **Hover states** (more prominent)
- ✅ **Larger typography** (more readable)

---

### Responsive Strategy

**Every component must:**
1. **Start mobile-first** (320px base design)
2. **Enhance for tablet** (768px+) - 2 columns, larger text
3. **Optimize for desktop** (1024px+) - 3 columns, hover states

**Example: EventCard**
```tsx
// Mobile (default)
<EventCard className="w-full p-4 text-base" />

// Tablet
<EventCard className="md:w-1/2 md:p-6 md:text-lg" />

// Desktop
<EventCard className="lg:w-1/3 lg:p-8 lg:text-xl hover:shadow-lg" />
```

---

## Part 8: Final Component Selection

### Summary: Total Components Needed

#### From Libraries: **112 components**
- shadcn/ui: 45 components
- MagicUI: 31 components (updated)
- CultUI: 12 components (updated)
- ReactBits: 24 components (updated)

#### Custom Ecovilla: **23 components**
- Priority 1 (Must Have): 15 components
- Priority 2 (Nice to Have): 8 components

#### Total: **135 components** for complete system

**Note:** This is a comprehensive library. You won't use all 135 in alpha, but having them available gives creative flexibility when building screens in WP5-11. Think of it as a well-stocked toolbox - better to have options than to need a component and not have it.

---

### Installation Checklist

#### Phase 1: Foundation (Day 1)
```bash
# Core shadcn components (30 minutes)
npx shadcn@latest add button card input label select textarea badge avatar dialog dropdown-menu tabs alert separator

# High-priority shadcn (30 minutes)
npx shadcn@latest add table checkbox radio-group switch toast tooltip popover scroll-area skeleton progress accordion

# MagicUI essentials (15 minutes)
npm install magicui
```

#### Phase 2: Enhancement (Day 2)
```bash
# Medium-priority shadcn (30 minutes)
npx shadcn@latest add command calendar drawer sheet breadcrumb pagination context-menu slider toggle collapsible

# CultUI & ReactBits (15 minutes)
npm install cultui reactbits
```

#### Phase 3: Custom Components (Days 3-4)
- Build 15 Priority 1 custom components
- Test on mobile and desktop
- Document in Storybook

#### Phase 4: Polish (Day 5)
- Build 8 Priority 2 components (if time allows)
- Responsive testing
- Accessibility audit

---

### Next Steps

Now that you understand:
- ✅ What components are (LEGO blocks for UI)
- ✅ Your 61 screens and their needs
- ✅ Component taxonomy (navigation, input, display, etc.)
- ✅ Screen-to-component mapping
- ✅ Library selections (67 components)
- ✅ Custom component needs (23 components)
- ✅ Web vs mobile strategy

**We're ready to:**
1. Review this component selection together
2. Prioritize which to build first
3. Create detailed specs for custom components
4. Set up Storybook structure
5. Begin implementation

**What would you like to discuss first?**
- A) Review/adjust the component selections?
- B) Dive into specific custom component specs?
- C) Plan the Storybook organization?
- D) Start building immediately?

---

**End of Component Analysis & Mapping**