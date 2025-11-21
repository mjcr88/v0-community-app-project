# Screen Specification Template
## Ecovilla Community Platform

**Version**: 1.0  
**Created**: November 2024  
**Purpose**: Standard template for documenting every screen in WP5-11

---

## How to Use This Template

1. **Copy this entire template** for each new screen
2. **Fill in all sections** with specific details
3. **Keep the format consistent** - this helps Cursor understand patterns
4. **Be specific** - more detail = better implementation
5. **Update as you build** - treat as living documentation

---

## Template Structure

Every screen spec should include these 9 sections:

1. **Overview** - What, why, who, when
2. **Layout** - Visual structure (mobile + desktop)
3. **Components** - Which library/custom components to use
4. **Interactions** - What happens when users do things
5. **Data** - Where data comes from and how it flows
6. **States** - Loading, empty, error, success
7. **Tone of Voice** - Copy, messaging, personality
8. **Accessibility** - WCAG requirements
9. **Implementation** - Step-by-step Cursor prompts

---

# [SCREEN NAME]

## Section 1: Overview

### **Purpose**
What problem does this screen solve? (1-2 sentences)

**Example:** "The Dashboard gives residents a bird's-eye view of their community activity, upcoming events, and important announcements in one place."

---

### **User Personas**
Who uses this screen?

- [ ] Sofia (Newcomer) - needs: safety, clarity, reassurance
- [ ] Marcus (Coordinator) - needs: efficiency, quick-scan, status
- [ ] Elena (Balanced Resident) - needs: calm, selective emphasis
- [ ] Carmen (Resource Coordinator) - needs: data density, system management

**Primary:** [Who is the main user?]  
**Secondary:** [Who else might use it?]

---

### **Usage Context**
When and why do users visit this screen?

- **Entry points:** How do users get here? (nav link, deep link, notification)
- **Frequency:** How often do they visit? (daily, weekly, rarely)
- **Duration:** How long do they spend? (quick check, extended use)
- **Next actions:** Where do they go next?

---

### **Success Criteria**
How do we know this screen succeeds?

- [ ] User can complete primary task in < 30 seconds
- [ ] User understands content without instructions
- [ ] User feels [emotion goal: confident, informed, delighted]
- [ ] [Other measurable outcome]

---

## Section 2: Layout

### **Mobile Layout (320px - 767px)**

```
┌─────────────────────────────────────┐
│ [☰]   [Page Title]    [🔆/🌙] [👤]  │ ← Top bar
├─────────────────────────────────────┤
│                                     │
│ [Section 1]                         │
│ [Component A]                       │
│ [Component B]                       │
│                                     │
│ [Section 2]                         │
│ [Component C]                       │
│                                     │
│ [Section 3]                         │
│ [Component D]                       │
│                                     │
├─────────────────────────────────────┤
│ [MobileNav Dock]                    │
└─────────────────────────────────────┘
```

**Layout Notes:**
- Single column
- Full-width cards
- Padding: space-4 (16px)
- Gaps between sections: space-6 (24px)
- Safe area insets for notched devices

---

### **Desktop Layout (≥ 1024px)**

```
┌──────────┬──────────────────────────────────────┐
│ [Logo]   │ [Page Title]      [Search] [Actions] │ ← Header
│          ├──────────────────────────────────────┤
│ Sidebar  │                                      │
│ Nav      │ [Section 1]                          │
│          │ ┌────────┬────────┬────────┐         │
│ MY       │ │ Card A │ Card B │ Card C │         │
│ - Dash   │ └────────┴────────┴────────┘         │
│ - Annc   │                                      │
│          │ [Section 2]                          │
│ COMM.    │ ┌──────────────────────────┐         │
│ - Resid  │ │ [Component D]            │         │
│ - Map    │ └──────────────────────────┘         │
│ - Events │                                      │
│          │ [Section 3]                          │
│          │ [Component E]                        │
│          │                                      │
│          │                    [FAB: +]          │
└──────────┴──────────────────────────────────────┘
```

**Layout Notes:**
- Sidebar: 256px (collapsible to 80px)
- Content: max-width 1440px, centered
- Grid: 3 columns for cards (when applicable)
- Padding: space-8 (32px)
- Gaps: space-8 between sections

---

### **Component Tree**

Visual hierarchy of all components:

```
[ScreenName]
├── DesktopNav (desktop only)
├── MobileTopBar (mobile only)
│   ├── HamburgerMenu
│   ├── AnimatedThemeToggler
│   └── UserAvatar
├── PageHeader
│   ├── Title
│   ├── Description (optional)
│   ├── Breadcrumbs
│   └── Actions (buttons)
├── Section1
│   ├── ComponentA
│   ├── ComponentB
│   └── ComponentC
├── Section2
│   └── ComponentD
├── Section3
│   └── ComponentE
├── MobileNav (mobile only)
└── FAB (desktop only)
```

---

## Section 3: Components

### **Component Mapping**

For each visual element, specify which component to use:

| Element | Library Component | Custom Component | Props | Notes |
|---------|-------------------|------------------|-------|-------|
| **Page Header** | - | PageHeader | `{ title, description, breadcrumbs, actions }` | Custom Ecovilla component |
| **Stat Cards** | cultui/stat-card | - | `{ label, value, trend, icon }` | Use CultUI stat card |
| **Event List** | - | EventCard (repeated) | `{ title, date, location, attendees, onRSVP }` | Custom component |
| **Data Table** | shadcn/data-table | - | `{ columns, data, sorting, filtering }` | Use shadcn table |
| **Search Bar** | shadcn/input | - | `{ placeholder, onChange }` | Shadcn input with search icon |
| **Filters** | shadcn/select | FilterBar | `{ options, onFilter }` | Custom wrapper of shadcn selects |
| **Empty State** | - | EmptyState | `{ icon, title, description, action }` | Custom Ecovilla component |

---

### **Component Details**

For each major component, provide detailed specs:

#### **ComponentA: [Name]**

**Source:** `[shadcn/ComponentName]` or `components/ecovilla/path/component-name.tsx`

**Purpose:** [What does this component do?]

**Props:**
```tsx
interface ComponentAProps {
  data: DataType[]
  onAction: (id: string) => void
  variant?: 'default' | 'compact'
  className?: string
}
```

**Variants:**
- **Default:** Standard size with all details
- **Compact:** Smaller, key info only (mobile)

**States to Implement:**
- [ ] Default (idle)
- [ ] Hover (desktop)
- [ ] Loading (skeleton)
- [ ] Empty (no data)
- [ ] Error (failed to load)

**Example Usage:**
```tsx
<ComponentA
  data={items}
  onAction={handleAction}
  variant="default"
/>
```

---

## Section 4: Interactions

### **User Actions**

Document every interactive element:

#### **Action 1: [Name] (e.g., "Create Event Button")**

**Trigger:** User clicks "Create Event" button  
**Location:** Top right of page header  
**Component:** `shadcn/button` with variant="default"

**Flow:**
1. User clicks button
2. Create modal opens (Sheet from bottom on mobile, Dialog on desktop)
3. Modal shows event creation form
4. User fills required fields (title, date, location)
5. User clicks "Create" button
6. Loading state: Button shows spinner, text changes to "Creating..."
7. On success:
   - Modal closes
   - Toast notification: "Event created successfully!"
   - Event list refreshes
   - Scroll to new event (highlight briefly)
8. On error:
   - Modal stays open
   - Error message shows above form
   - Button re-enables

**Edge Cases:**
- If form has validation errors, highlight fields in red
- If user closes modal during loading, confirm "Are you sure?"
- If network fails, show retry option

---

#### **Action 2: [Next interaction]**

[Document all interactive elements this way]

---

### **Navigation Flow**

Where can users go from this screen?

**From this screen:**
- Click event card → Event detail page (`/events/[id]`)
- Click "See all events" → Events list page (`/events`)
- Click resident avatar → Resident profile (`/residents/[id]`)
- Click announcement → Announcement detail (modal or page)

**To this screen:**
- From nav: Dashboard link
- From notification: Direct link
- From deep link: Shared URL
- From login: Default redirect

---

## Section 5: Data

### **Data Requirements**

What data does this screen need?

#### **Data Source 1: Dashboard Summary**

**API Endpoint:** `GET /api/v1/dashboard`

**Request:**
```typescript
// Query params
{
  tenantId: string // from auth context
  userId: string   // from auth context
}
```

**Response:**
```typescript
{
  stats: {
    activeResidents: number
    upcomingEvents: number
    newAnnouncements: number
    pendingRequests: number
  },
  recentEvents: Event[],
  announcements: Announcement[],
  checkIns: CheckIn[]
}
```

**Error Handling:**
- 401: Redirect to login
- 403: Show "Access denied" message
- 500: Show "Server error, try again" with retry button

---

#### **Data Source 2: [Next data source]**

[Document all data sources]

---

### **Data Flow**

```
Page Load
    ↓
Fetch dashboard data (parallel requests)
    ↓
├── GET /api/v1/dashboard/stats → stats
├── GET /api/v1/events?upcoming=true&limit=3 → recentEvents
├── GET /api/v1/announcements?unread=true → announcements
└── GET /api/v1/checkins?recent=true&limit=5 → checkIns
    ↓
Update UI with data
    ↓
Poll for updates every 60 seconds (announcements only)
```

---

### **Real-time Updates**

Does this screen need live updates?

- [ ] No (static content)
- [ ] Polling (check every X seconds)
- [ ] WebSocket (real-time push)
- [ ] Optimistic updates (update UI before server confirms)

**If yes, specify:**
- **What updates:** Announcement count, new check-ins
- **Update frequency:** Every 60 seconds
- **Technology:** Polling via React useEffect + interval
- **User feedback:** Subtle badge count update (no interruption)

---

## Section 6: States

### **Screen States**

Document all possible screen states:

#### **State 1: Initial Load (Skeleton)**

**When:** Page first loads, before data arrives  
**Duration:** 0.5-2 seconds (network dependent)

**Visual:**
```
┌─────────────────────────────┐
│ [Page Header - loaded]      │
├─────────────────────────────┤
│ [Skeleton Card] [Skeleton]  │
│ [Skeleton Card] [Skeleton]  │
│ [Skeleton List]             │
└─────────────────────────────┘
```

**Components:**
- Use `shadcn/skeleton` for loading placeholders
- Match layout of actual content (same sizes, positions)
- Subtle pulse animation (respect reduced motion)

**Implementation:**
```tsx
{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  <div className="grid grid-cols-3 gap-4">
    {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
  </div>
)}
```

---

#### **State 2: Loading (Subsequent)**

**When:** User action triggers loading (refresh, filter, sort)  
**Duration:** 0.5-2 seconds

**Visual:**
- Existing content remains visible
- Spinner appears in relevant section
- Content has reduced opacity (70%)
- Interactions disabled in loading section

**Implementation:**
```tsx
<div className={cn("relative", isRefreshing && "opacity-70")}>
  {isRefreshing && (
    <div className="absolute inset-0 flex items-center justify-center bg-earth-cloud/50">
      <Spinner className="w-8 h-8" />
    </div>
  )}
  {content}
</div>
```

---

#### **State 3: Empty (No Data)**

**When:** API returns successfully but with empty array  
**Example:** New user has no events yet

**Visual:**
```
┌─────────────────────────────┐
│ [Page Header]               │
├─────────────────────────────┤
│                             │
│        [Empty Icon]         │
│    No events yet            │
│  Be the first to create one!│
│                             │
│    [Create Event Button]    │
│                             │
└─────────────────────────────┘
```

**Component:** `EmptyState`

**Props:**
```tsx
<EmptyState
  icon={<CalendarIcon className="w-16 h-16 text-mist-gray" />}
  title="No events yet"
  description="Be the first to create one!"
  action={
    <Button onClick={() => setShowCreateModal(true)}>
      Create Event
    </Button>
  }
/>
```

---

#### **State 4: Error**

**When:** API request fails (network, server error)

**Visual:**
```
┌─────────────────────────────┐
│ [Page Header]               │
├─────────────────────────────┤
│                             │
│      [Error Icon ⚠️]         │
│  Couldn't load dashboard    │
│   Please try again          │
│                             │
│      [Retry Button]         │
│                             │
└─────────────────────────────┘
```

**Component:** `ErrorState` (or custom error component)

**Props:**
```tsx
<ErrorState
  title="Couldn't load dashboard"
  message={error.message || "Something went wrong"}
  action={
    <Button onClick={retry} variant="outline">
      <RefreshIcon className="w-4 h-4 mr-2" />
      Try Again
    </Button>
  }
/>
```

---

#### **State 5: Success (Populated)**

**When:** Data loaded successfully, content displays

**Visual:** [The main design from Section 2]

**Transitions:**
- Skeleton → Success: Fade in (200ms)
- Empty → Success: Fade in new items
- Error → Success: Replace error with content

---

## Section 7: Tone of Voice & Copy

### **Reference Documents**

Before writing copy for this screen, review:
- **WP7_Tone_of_Voice_Guide.md** - Complete voice & personality guide
- **WP7_Copy_Patterns.md** - Reusable templates for common UI elements
- **WP7_Component_Copy_Specs.md** - Examples from login and navigation

---

### **Context for This Screen**

#### **User Emotion**
What emotional state are users in when they visit this screen?

- [ ] **Calm & Browsing** - Exploring casually, no stress
- [ ] **Focused & Goal-Oriented** - Here to complete specific task
- [ ] **Stressed or Anxious** - Problem to solve, time-sensitive
- [ ] **Excited or Celebrating** - Positive milestone or achievement
- [ ] **Confused or Lost** - Uncertain about what to do

**Primary emotion:** [Choose one]  
**Why:** [Brief explanation of what brings users here]

**Voice adjustment:**
- Calm → Warm and inviting
- Focused → Clear and efficient  
- Stressed → Professional and reassuring
- Excited → Celebratory and next-step oriented
- Confused → Patient and guiding

---

#### **Primary Persona**
Which persona uses this screen most?

- [ ] **Sofia (Newcomer)** - Needs reassurance, explanation, encouragement
- [ ] **Marcus (Coordinator)** - Needs efficiency, status, quick-scan
- [ ] **Elena (Balanced Resident)** - Needs calm, optional engagement
- [ ] **Carmen (Resource Coordinator)** - Needs organization, data, management

**Persona-specific adjustments:**

**Sofia:** More explanatory without condescension, extra encouragement in empty states, celebrate small wins

**Marcus:** Direct and scannable, status-focused, data-dense when appropriate, skip flowery language

**Elena:** Gentle and non-urgent, optional engagement, respectful of boundaries, warm but not pushy

**Carmen:** Systematic with clear status, management-focused, helpful groupings, enable batch actions

---

### **Voice Characteristics for This Screen**

Based on emotion + persona + screen purpose:

**Primary characteristic:** [Warm, Helpful, Efficient, Calm, Playful]  
**Secondary characteristic:** [Supporting trait]  
**Avoid:** [What would be inappropriate]

**Formality level:**
- [ ] Very casual ("Hey there!")
- [ ] Casual-conversational ("Hi Sofia!") ← Default
- [ ] Professional ("Welcome")

**Río appearance:**
- [ ] None (serious/professional context)
- [ ] Occasional (empty states, celebrations) ← Most screens
- [ ] Featured (onboarding, major milestones)

---

### **Key Messages**

What must users understand from this screen's copy?

1. **Primary Message:** [Most important thing]
   - Example: "Your community is active and connected"

2. **Secondary Messages:**
   - [Supporting point 1]
   - [Supporting point 2]  
   - [Supporting point 3]

3. **Call to Action:** [What should users do?]
   - Example: "Create your first event to bring neighbors together"

---

### **Complete Copy Specification**

Document ALL copy on this screen:

#### **Page Header**

**Page Title:**
```
[Screen Name]
```

**Meta Description (for SEO):**
```
[Brief description]
```

**Breadcrumbs (if applicable):**
```
[Home] > [Section] > [Current Page]
```

**Page Description/Subheading:**
```
[Optional supporting text]
```

---

#### **Section Headings**

List all section headings on this screen:

**Section 1:**
```
[Heading text]
```
**Why this wording:** [Brief rationale]

**Section 2:**
```
[Heading text]
```
**Why this wording:** [Brief rationale]

---

#### **Buttons & CTAs**

Document every button with context:

| Button | Context | Text | Aria-Label |
|--------|---------|------|------------|
| **Primary CTA** | Main action | [Button text] | [Screen reader text] |
| **Secondary CTA** | Alternative | [Button text] | [Screen reader text] |
| **Destructive** | Delete action | [Button text] | [Screen reader text] |

**Examples:**
```
Primary: "Create Event" (aria-label: "Create a new community event")
Secondary: "Maybe Later" (aria-label: "Skip event creation")
Destructive: "Yes, Delete" (aria-label: "Permanently delete this event")
```

---

#### **Form Labels & Helpers**

For each form field:

**Field 1: [Field Name]**
```
Label: [Label text]
Placeholder: [Example input]
Helper text: [Explanatory text if needed]
Aria-label: [Full description for screen readers]
```

**Example:**
```
Field: Email
Label: Email
Placeholder: your@email.com
Helper text: Your email for login and notifications
Aria-label: Email address for login
```

---

#### **Empty States**

**Scenario:** [When does this appear?]

**Copy structure:**
```
[Río Illustration]

[Heading]
[Clear statement of absence]

[Context/Encouragement]
[1-2 sentences]

[Primary CTA] [Optional: Secondary CTA]
```

**Example:**
```
[Río looking at empty calendar]

No events yet

Time to bring your neighbors together!
Río can't wait to see what you plan.

[Create Your First Event] [Browse Past Events]
```

---

#### **Loading States**

**Quick load (< 2 seconds):**
```
[Just spinner, no text]
```

**Medium load (2-5 seconds):**
```
Loading your [content]...
```

**Long load (> 5 seconds):**
```
[Río animation]
Río is gathering [what]...
```

---

#### **Success Messages**

**Small wins:**
```
[Action completed]
Example: "Saved", "Updated", "Created"
```

**Medium wins:**
```
[Action] + [brief detail]
Example: "Event created. Neighbors will see it on the calendar"
```

**Big wins:**
```
[Celebration!] + [what happened] + [next step?]
Example: "Event created! 🎉 Your neighbors will see it on the calendar"
```

---

#### **Error Messages**

For each potential error:

**Error 1: [Type]**
```
Message: [Clear problem] + [Solution]
Example: "Couldn't save your changes. Check your connection and try again?"
```

**Error 2: [Type]**
```
Message: [What happened] + [How to fix]
Example: "That email is already in use. Want to log in instead?"
```

**Error 3: [Generic]**
```
Message: Hmm, that didn't work. Try again?
```

---

#### **Confirmation Dialogs**

**Destructive action:**
```
Heading: [Action]?
Message: [Consequence]
Buttons: [Explicit confirm] + [Cancel]

Example:
Heading: Delete this event?
Message: This can't be undone.
Buttons: Yes, Delete | Cancel
```

**Non-destructive:**
```
Heading: [Action]?
Message: [Context]
Buttons: [Confirm] + [Cancel]

Example:
Heading: Leave without saving?
Message: You'll lose your changes.
Buttons: Yes, Leave | Keep Editing
```

---

#### **Microcopy & Helper Text**

List all small copy elements:

**Tooltips:**
```
[i icon] → "Tooltip text here"
Example: [i icon] → "Visible to all community members"
```

**Character counters:**
```
[Number] characters remaining
```

**Badge labels:**
```
[Number] new
[Number] pending
```

**Time references:**
```
2 minutes ago
Yesterday
Tomorrow at 10am
```

---

### **Copy Review Checklist**

Before finalizing, verify:

**Voice & Tone:**
- [ ] Feels warm and casual (not formal or robotic)
- [ ] User-focused (you/your prominent)
- [ ] Community language feels natural (not forced)
- [ ] Appropriate for user emotion and context
- [ ] Matches persona needs if applicable
- [ ] Río appears only when appropriate (5-10% of copy)

**Clarity:**
- [ ] Scannable (user understands in 2 seconds)
- [ ] No jargon or technical terms
- [ ] Action is clear (what happens when I click?)
- [ ] No ambiguity
- [ ] Non-native English speakers will understand

**Helpfulness:**
- [ ] Errors include solutions (not just problems)
- [ ] Empty states encourage action (not just state absence)
- [ ] Success messages confirm what happened
- [ ] Next steps are obvious
- [ ] Helper text provides actual value

**Consistency:**
- [ ] Button text follows verb + object pattern (see WP7_Copy_Patterns.md)
- [ ] Similar actions use similar words across screens
- [ ] Tone matches other copy on this screen
- [ ] Grammar and style rules followed (see WP7_Tone_of_Voice_Guide.md)
- [ ] Matches navigation copy (if applicable)

**Emojis & Personality:**
- [ ] Emojis used sparingly (celebrations and empty states only)
- [ ] Río personality enhances, doesn't distract
- [ ] Playfulness appropriate for context
- [ ] Professional when needed (errors, security, account)

**Accessibility:**
- [ ] All buttons have descriptive aria-labels
- [ ] Form fields have labels (not just placeholders)
- [ ] Error messages announced clearly
- [ ] No reliance on color/icons alone for meaning
- [ ] Screen reader will understand context

---

### **Copy Testing Plan**

**Internal Review:**
- [ ] Read all copy aloud - does it sound natural?
- [ ] Check against WP7_Tone_of_Voice_Guide.md
- [ ] Verify patterns from WP7_Copy_Patterns.md
- [ ] Compare to WP7_Component_Copy_Specs.md examples

**User Testing:**
- [ ] Show to 3-5 alpha users from different personas
- [ ] Ask: "What do you think this screen does?"
- [ ] Ask: "What would you click first?"
- [ ] Ask: "How does this make you feel?"
- [ ] Gather feedback on confusing copy

**Accessibility Testing:**
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify error announcements work
- [ ] Check that context is clear without visual cues

---

### **Copy Iteration Notes**

Track changes and rationale:

**Version 1.0** (Initial draft)
- [Date]
- [What was written and why]

**Version 1.1** (After user feedback)
- [Date]
- Changed: [What]
- Why: [Feedback or insight]
- Result: [Improvement]

**Future considerations:**
- [ ] [Copy that might need review later]
- [ ] [Alternative phrasings to test]
- [ ] [Questions for team discussion]

---

## Section 8: Accessibility

### **WCAG 2.1 AA Requirements**

#### **Semantic HTML**
- [ ] Use correct heading hierarchy (h1 → h2 → h3)
- [ ] Use `<nav>` for navigation areas
- [ ] Use `<main>` for main content
- [ ] Use `<article>` for independent content
- [ ] Use `<button>` for actions (not `<div onClick>`)
- [ ] Use `<a>` for navigation (not `<button>`)

#### **Keyboard Navigation**
- [ ] All interactive elements reachable by Tab
- [ ] Logical tab order (top-to-bottom, left-to-right)
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate lists (when appropriate)
- [ ] Skip to content link at top
- [ ] Focus trapped in modals

#### **Screen Reader Support**
- [ ] All images have alt text (descriptive for content, empty for decorative)
- [ ] All form inputs have associated labels
- [ ] All icon buttons have `aria-label`
- [ ] Loading states announced with `aria-live="polite"`
- [ ] Error messages announced with `aria-live="assertive"`
- [ ] Dynamic content changes announced
- [ ] Current page indicated with `aria-current="page"`

#### **Visual Accessibility**
- [ ] Color contrast ≥ 4.5:1 for normal text
- [ ] Color contrast ≥ 3:1 for large text (18px+)
- [ ] Color contrast ≥ 3:1 for UI components
- [ ] Focus indicators visible (2px ring, 2px offset)
- [ ] Text resizable up to 200% without breaking layout
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Motion effects respect `prefers-reduced-motion`

#### **Specific Requirements for This Screen**

**[List screen-specific accessibility needs]**

Example:
- Event cards must have unique accessible names (include date + title)
- Stat cards must announce values clearly ("42 active residents")
- Filter controls must announce when results change
- Infinite scroll must not trap keyboard users

---

## Section 9: Implementation

### **Build Order**

Recommended sequence for implementation:

#### **Phase 1: Layout & Structure (Step 1)**
**Goal:** Get the basic page structure in place

**Cursor Prompt:**
```
Create the page layout for [ScreenName].

Context:
@WP2_Design_Tokens_Specification.md
@WP2_Component_Guidelines.md
@components/ecovilla/navigation/mobile-nav.tsx
@components/ecovilla/navigation/desktop-nav.tsx

Task:
1. Create app/t/[slug]/[route]/page.tsx
2. Set up page metadata (title, description)
3. Add PageHeader component with title, breadcrumbs, actions
4. Create sections for content (use semantic HTML)
5. Add placeholder text for each section
6. Ensure responsive layout (mobile single column, desktop grid)
7. Apply WP2 design tokens for spacing and colors

Don't implement data fetching yet - just the structure.
```

**Validation:**
- [ ] Page renders without errors
- [ ] Responsive layout works (test 320px, 768px, 1440px)
- [ ] Navigation shows active state correctly
- [ ] Design tokens applied consistently

---

#### **Phase 2: Static Components (Step 2)**
**Goal:** Add UI components with mock data

**Cursor Prompt:**
```
Add components to [ScreenName] with mock data.

Context:
@app/t/[slug]/[route]/page.tsx (structure from Phase 1)
@components/ui/* (shadcn components)
@components/ecovilla/* (custom components)
@[ScreenSpecification].md (this document - component section)

Task:
1. Import needed components
2. Add ComponentA with mock data
3. Add ComponentB with mock data
4. Add ComponentC with mock data
5. Implement all 8 component states (see Section 3)
6. Add empty states where applicable
7. Make all interactive elements functional (even if they just console.log)

Mock data structure:
```typescript
const mockData = {
  stats: [
    { label: "Active Residents", value: 42, trend: +5, icon: UsersIcon },
    // ... more stats
  ],
  events: [
    { id: 1, title: "Build Day", date: "2024-11-21", location: "Common Area", attendees: 12 },
    // ... more events
  ]
}
```

Don't connect to API yet - use mock data defined in component.
```

**Validation:**
- [ ] All components render correctly
- [ ] Mock data displays properly
- [ ] Hover states work (desktop)
- [ ] Click handlers log to console
- [ ] Empty states show when mock data is empty array
- [ ] Loading skeletons match content layout

---

#### **Phase 3: Data Integration (Step 3)**
**Goal:** Connect to real API endpoints

**Cursor Prompt:**
```
Connect [ScreenName] to API.

Context:
@app/t/[slug]/[route]/page.tsx (components from Phase 2)
@lib/data/* (data layer functions)
@[ScreenSpecification].md (data section)

Task:
1. Remove mock data
2. Import data fetching functions from lib/data
3. Use async/await in server component or use client hooks
4. Implement loading state (show skeletons)
5. Handle empty state (no data returned)
6. Handle error state (API failure)
7. Add error boundaries for unexpected errors

Example data fetching:
```typescript
// Server Component approach
const dashboardData = await getDashboardData(tenantId, userId)

// Client Component approach (if interactions needed)
'use client'
const { data, isLoading, error } = useDashboardData(tenantId, userId)
```

Error handling:
- Network errors: Show retry button
- Auth errors: Redirect to login
- 404 errors: Show "not found" message
- 500 errors: Show generic error + contact support
```

**Validation:**
- [ ] Real data loads successfully
- [ ] Loading state shows briefly
- [ ] Empty state shows if no data
- [ ] Error state shows on API failure
- [ ] Error boundaries catch unexpected errors
- [ ] No console errors

---

#### **Phase 4: Interactions (Step 4)**
**Goal:** Make everything fully functional

**Cursor Prompt:**
```
Implement interactions for [ScreenName].

Context:
@app/t/[slug]/[route]/page.tsx (data from Phase 3)
@components/ui/dialog.tsx (modals)
@components/ui/sheet.tsx (drawers)
@[ScreenSpecification].md (interactions section)

Task:
1. Implement Action1 (see Section 4):
   - Create modal/dialog component
   - Add form with validation
   - Handle form submission
   - Show success/error feedback
   - Refresh data on success

2. Implement Action2:
   - [Details from interaction docs]

3. Add toast notifications for feedback
4. Implement optimistic updates where appropriate
5. Add loading states for async actions
6. Handle edge cases (see interaction docs)

Use Sonner for toasts:
```typescript
import { toast } from "sonner"

toast.success("Event created successfully!")
toast.error("Failed to create event. Please try again.")
```

**Validation:**
- [ ] All buttons trigger correct actions
- [ ] Forms validate correctly
- [ ] Success toasts appear
- [ ] Error toasts appear with helpful messages
- [ ] Data refreshes after mutations
- [ ] Optimistic updates work smoothly
- [ ] Edge cases handled gracefully

---

#### **Phase 5: Polish & Testing (Step 5)**
**Goal:** Ensure quality and accessibility

**Manual Testing Checklist:**

**Functionality:**
- [ ] All user actions work as expected
- [ ] All states transition smoothly
- [ ] All data displays correctly
- [ ] All error scenarios handled

**Responsive:**
- [ ] Test at 320px (iPhone SE)
- [ ] Test at 375px (iPhone 12)
- [ ] Test at 768px (iPad)
- [ ] Test at 1024px (Desktop)
- [ ] Test at 1440px+ (Large desktop)

**Accessibility:**
- [ ] Tab through entire page (logical order)
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Check color contrast (DevTools)
- [ ] Test keyboard shortcuts (Escape, Enter, Arrow keys)
- [ ] Verify focus indicators visible
- [ ] Test with zoom at 200%
- [ ] Enable reduced motion and test animations

**Performance:**
- [ ] Page loads in < 2 seconds
- [ ] Images optimized (Next.js Image)
- [ ] No console errors or warnings
- [ ] Lighthouse score > 90

**Cross-browser:**
- [ ] Chrome (primary)
- [ ] Safari (iOS + macOS)
- [ ] Firefox
- [ ] Edge

---

### **Cursor Prompt Library**

Common prompts you'll use for most screens:

**Add loading skeleton:**
```
Add loading skeletons to [ComponentName] using shadcn/skeleton.
Match the layout of the actual content.
```

**Add empty state:**
```
Add empty state to [Section] using EmptyState component.
Show when data array is empty.
Props: icon, title, description, action button.
```

**Add error handling:**
```
Add error boundary to [Page/Component].
Catch errors and display ErrorState component.
Include retry functionality.
```

**Add toast notifications:**
```
Add toast notifications for [Action] using Sonner.
Success: "Action completed successfully!"
Error: "Action failed. Please try again."
Position: bottom-right
```

**Implement form validation:**
```
Add form validation to [FormName] using react-hook-form + Zod.
Validate: [list fields and rules]
Show errors inline below fields.
Disable submit until valid.
```

---

## Completion Checklist

Before marking this screen complete:

**Documentation:**
- [ ] All 9 sections filled out completely
- [ ] Component mapping documented
- [ ] Data sources documented
- [ ] Interactions documented
- [ ] Tone of voice guidelines applied

**Implementation:**
- [ ] All 5 phases complete
- [ ] All components implemented
- [ ] All states working
- [ ] All interactions functional
- [ ] Copy reviewed for tone consistency

**Quality:**
- [ ] Manual testing complete
- [ ] Accessibility tested
- [ ] Responsive tested
- [ ] Cross-browser tested
- [ ] No console errors
- [ ] Tone of voice consistent

**Handoff:**
- [ ] Git commit with clear message
- [ ] PR created (if using PR workflow)
- [ ] Screenshots added to documentation
- [ ] Copy reviewed by team
- [ ] Ready for review/QA

---

**End of Screen Specification Template**

---

## Next Steps

1. Copy this template for your first screen
2. Fill in all 9 sections with specific details
3. Hand to Cursor with Phase 1 prompt
4. Build iteratively through all 5 phases
5. Test thoroughly before moving to next screen
6. Review tone of voice with team

**Remember:** The more detailed your spec, the better Cursor can implement it!