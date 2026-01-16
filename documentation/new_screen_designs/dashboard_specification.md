# Dashboard Redesign - Updated Specification
## Complete Design & Implementation Plan

**Date**: November 2024  
**Screen**: Resident Dashboard (Mobile + Desktop)  
**Status**: UPDATED - Ready for Implementation  
**Version**: 2.0

---

## ✅ Updated Decisions Summary

1. **Stats:** **NEW - Customizable stats system** - Build from scratch, replace current dashboard widgets
2. **What's Next:** Updated content types - announcements, upcoming/saved events, current check-ins, due listings/pickups (NO requests)
3. **Mobile Hamburger Menu:** Profile elements at top, then divider, then edit profile + theme toggle + log out
4. **Rio Placeholder:** Hand-drawn Macaw illustration (friendly, open, helpful look)
5. **Quick Actions:** Dynamic (context-aware)
6. **Mobile Fold:** Greeting + Stats + What's Next + Quick Actions
7. **Updates:** Real-time polling every 60s (subtle)
8. **Layout:** Equal stat cards for scannability
9. **Components:** Shine Border (What's Next), Scroll Stack (Announcements only)
10. **Profile Card:** Desktop top-right, Mobile hamburger menu

---

## 🆕 NEW: Customizable Stats System

### **Overview**

The dashboard will feature a **customizable stats system** that replaces the current dashboard widgets. Users can select which 4 stats to display from a library of 13 available community metrics.

### **Stat Configuration**

**User sees 4 stats at a time:**
- Mobile: 2x2 grid
- Desktop: 1x4 horizontal row

**13 Available Stats:**

| Stat Name | Description | Scope | Data Source |
|-----------|-------------|-------|-------------|
| **Active Neighbors** | Residents currently checked in | Neighborhood | real-time check-ins |
| **Total Neighbors** | All residents in scope | Community/Neighborhood | user count |
| **Upcoming Events** | Events in next 7 days | Community | events where date ≤ now+7d |
| **New Announcements** | Unread announcements | Community | unread count |
| **Active Requests** | Open help requests | Neighborhood | requests where status=open |
| **Available Listings** | Active marketplace items | Neighborhood | listings where available=true |
| **Current Check-ins** | People checked in right now | Community | check-ins where active=true |
| **Due Pickups** | Listings ready for pickup | Personal | user's listings where pickup_ready=true |
| **Your Events** | Events you're attending | Personal | user's RSVPs |
| **Saved Events** | Events you've saved | Personal | user's saved events |
| **Your Listings** | Your active listings | Personal | user's listings where active=true |
| **Response Rate** | % of requests you've helped with | Personal | responses/total_requests |
| **Connections** | Direct neighbor connections | Personal | mutual connections count |

### **Default Configuration (First-time users)**

**Sofia (Newcomer):**
1. Total Neighbors (Community)
2. Upcoming Events (Community)
3. New Announcements (Community)
4. Active Neighbors (Neighborhood)

**Marcus (Coordinator):**
1. Active Requests (Neighborhood)
2. Current Check-ins (Community)
3. Upcoming Events (Community)
4. New Announcements (Community)

**Elena (Balanced):**
1. Your Events (Personal)
2. Active Neighbors (Neighborhood)
3. New Announcements (Community)
4. Connections (Personal)

**Carmen (Resource Coordinator):**
1. Available Listings (Neighborhood)
2. Active Requests (Neighborhood)
3. Total Neighbors (Neighborhood)
4. Response Rate (Personal)

### **Stat Card Design**

```
┌─────────────────────┐
│ 42          ✏️      │ ← Number + Edit icon
│                     │
│ Active Neighbors    │ ← Label
│ 🏡 Neighborhood     │ ← Scope badge
└─────────────────────┘
```

**Visual Specs:**
- Background: `background: var(--card)`
- Border: `border: 1px solid var(--border)`
- Border radius: `rounded-lg` (8px)
- Padding: `p-4` (16px)
- Number: AnimatedNumber component, `text-4xl font-bold` (36px)
- Label: `text-sm font-medium text-muted-foreground` (14px)
- Scope badge: Small badge with icon, `text-xs` (12px)
- Edit icon: Top-right corner, `opacity-0 hover:opacity-100` transition

**Interactions:**
- Hover: Slight lift (`hover:shadow-md`, `hover:-translate-y-0.5`)
- Click Edit: Opens EditStatModal
- Number animates when value changes (AnimatedNumber from number-ticker)

### **Edit Stat Modal**

**Trigger:** Click ✏️ edit icon on any stat card

**Modal Layout:**
```
┌────────────────────────────────────┐
│ Customize Your Stats         ✕    │
├────────────────────────────────────┤
│                                    │
│ Choose 4 stats to display:        │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ [Selected] Active Neighbors  │  │
│ │ 🏡 Neighborhood              │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ [Selected] Upcoming Events   │  │
│ │ 🏙️ Community                 │  │
│ └──────────────────────────────┘  │
│                                    │
│ Available Stats (9 more):         │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ [ ] New Announcements        │  │
│ │ 🏙️ Community                 │  │
│ └──────────────────────────────┘  │
│                                    │
│ [... more stats ...]              │
│                                    │
│         [Cancel] [Save Changes]   │
│                                    │
└────────────────────────────────────┘
```

**Behavior:**
- User must select exactly 4 stats
- Save button disabled until 4 selected
- Selected stats show checkmark
- Stats ordered by: Selected first, then alphabetically
- On save: Update database, close modal, reload stats with animation

**Database Storage:**
```typescript
// users table
dashboard_stats_config: {
  stat1: 'active_neighbors',
  stat2: 'upcoming_events',
  stat3: 'new_announcements',
  stat4: 'active_requests'
}
```

---

## 🔄 UPDATED: What's Next Section

### **Updated Content Types**

**What's Next now includes:**
1. **Announcements** (new/unread)
2. **Upcoming Events** (next 7 days)
3. **Saved Events** (user's saved events)
4. **Current Check-ins** (people checked in now)
5. **Due Listings** (ready for pickup)
6. **Listing Pickups** (scheduled pickups)

**What's Next NO LONGER includes:**
- ❌ Requests (removed completely)

### **Priority Scoring (Updated)**

```typescript
function calculatePriority(item) {
  let score = 0;
  
  switch(item.type) {
    case 'announcement':
      score = 100; // Highest priority
      if (item.is_urgent) score += 50;
      if (item.created_within_24h) score += 25;
      break;
      
    case 'check_in':
      score = 90;
      if (item.is_new_neighbor) score += 30;
      if (item.mutual_connection) score += 20;
      break;
      
    case 'due_listing':
      score = 85; // Important personal item
      if (item.pickup_overdue) score += 40;
      break;
      
    case 'listing_pickup':
      score = 80;
      if (item.pickup_today) score += 30;
      break;
      
    case 'upcoming_event':
      score = 70;
      if (item.starts_within_24h) score += 40;
      if (item.user_rsvp_yes) score += 30;
      if (item.user_is_organizer) score += 25;
      if (item.spots_filling_up) score += 15;
      break;
      
    case 'saved_event':
      score = 60;
      if (item.starts_within_48h) score += 35;
      if (item.not_rsvped_yet) score += 20;
      break;
  }
  
  return score;
}
```

### **Hero Card (Top Priority Item)**

**Announcement Hero:**
```
┌─────────────────────────────────────────┐
│ 📢 Important Community Update          │
│                                         │
│ Water system maintenance scheduled     │
│ for tomorrow 8am-12pm. Please plan...  │
│                                         │
│ 2 hours ago • Urgent                   │
│                                         │
│ [View Details]                          │
└─────────────────────────────────────────┘
```

**Event Hero:**
```
┌─────────────────────────────────────────┐
│ 🎉 Community Potluck                   │
│                                         │
│ Tomorrow 6pm • 12 attending            │
│ Bring a dish to share!                 │
│                                         │
│ [View Event] [Going!]                   │
└─────────────────────────────────────────┘
```

**Check-in Hero:**
```
┌─────────────────────────────────────────┐
│ 👋 Sofia just checked in!              │
│                                         │
│ New neighbor • Common Garden           │
│ 5 minutes ago                          │
│                                         │
│ [Say Hi] [View Profile]                │
└─────────────────────────────────────────┘
```

**Due Listing Hero:**
```
┌─────────────────────────────────────────┐
│ 📦 Your listing is ready for pickup    │
│                                         │
│ Garden tools • Marcus is waiting       │
│ Pickup scheduled: Today 3pm            │
│                                         │
│ [Contact] [Mark Complete]              │
└─────────────────────────────────────────┘
```

### **List Items (2-3 items, then Load More)**

```
Coming Up:

• 🎨 Art Workshop - Saturday 2pm
• 👋 Carmen checked in - Workshop Area  
• 🌱 Your Seeds listing - Pickup tomorrow

[Load More (5 more) ↓]
```

---

## 📱 UPDATED: Mobile Hamburger Menu

### **New Menu Structure**

```
┌─────────────────────────────────────┐
│                                     │
│    👤 Profile Photo                 │
│                                     │
│    Sofia Martinez                   │
│    @sofia_eco                       │
│    Member since: Jan 2024           │
│                                     │
│    🟢 Checked In                    │
│    Common Garden • 1h 23m           │
│                                     │
├─────────────────────────────────────┤ ← Divider line
│                                     │
│    ✏️  Edit Profile                 │
│                                     │
│    🌙  Theme (with toggle icon)     │
│                                     │
│    🚪  Log Out                      │
│                                     │
└─────────────────────────────────────┘
```

**Top Section (Profile Elements):**
- Profile photo (80px circle)
- Full name (`text-lg font-semibold`)
- Username (`text-sm text-muted-foreground`)
- Member since date (`text-xs`)
- Check-in status (if active)
  - Green dot + "Checked In"
  - Location + duration
  - Updates every minute

**Divider:**
- Full-width horizontal line
- Color: `var(--border)`
- Margin: `my-4` (16px top/bottom)

**Bottom Section (Actions):**
- Edit Profile button
- Theme toggle (shows current theme icon: 🌙 for dark, ☀️ for light)
- Log Out button
- Each item has icon + label
- Spacing: `py-3` between items
- Hover: `hover:bg-accent`

---

## 🦜 NEW: Rio the Macaw Placeholder

### **Character Design Brief**

**Name:** Rio  
**Species:** Macaw (Costa Rican vibes)  
**Personality:** Friendly, helpful, welcoming, approachable  
**Art Style:** Hand-drawn, warm, slightly whimsical  

### **Visual Specifications**

**Drawing Style:**
- Hand-drawn aesthetic (not flat/geometric)
- Warm line work (not too sharp or angular)
- Friendly, open posture
- Bright but natural colors
- Slight texture/grain for warmth

**Color Palette:**
```css
/* Rio's Colors */
--rio-primary: #FF6B35;    /* Coral-orange (body) */
--rio-secondary: #4ECDC4;  /* Teal (wing accents) */
--rio-accent: #FFE66D;     /* Warm yellow (beak, highlights) */
--rio-dark: #2D3047;       /* Deep blue-grey (details) */
```

**Poses Needed:**

1. **Empty State - General** (Default)
```
Rio sitting on a branch, slightly tilted head,
one wing slightly raised in a welcoming gesture.
Expression: Friendly, curious, helpful.
Size: 200x200px
```

2. **Empty State - Encouraging**
```
Rio with wings spread wide in excitement.
Expression: Enthusiastic, supportive.
Size: 200x200px
```

3. **Empty State - Waiting**
```
Rio perched, looking to the side expectantly.
Expression: Patient, attentive.
Size: 200x200px
```

4. **Small Icon** (For inline use)
```
Rio's head only, friendly expression.
Size: 48x48px
```

### **Implementation for Cursor**

**Cursor Prompt for Rio Creation:**
```
Create a hand-drawn illustration of Rio the Macaw with these specs:

Character:
- Friendly macaw parrot
- Hand-drawn, warm aesthetic
- Open, welcoming posture
- Slightly whimsical but not cartoon-like

Colors:
- Primary body: Coral-orange (#FF6B35)
- Wing accents: Teal (#4ECDC4)
- Beak/highlights: Warm yellow (#FFE66D)
- Details: Deep blue-grey (#2D3047)

Pose: [Specify pose from above]

Style notes:
- Organic, hand-drawn lines
- Slight texture/grain
- Warm, inviting feel
- Costa Rican tropical vibe
- Professional but friendly

Export as SVG with transparent background.
```

### **Rio Usage in Empty States**

**Stats Empty State:**
```tsx
<div className="flex flex-col items-center justify-center p-8 text-center">
  <RioImage pose="general" size="lg" />
  <p className="mt-4 text-lg font-medium">
    Customize your stats to see your community pulse!
  </p>
  <p className="mt-2 text-sm text-muted-foreground">
    Click the ✏️ icon on any stat card to get started.
  </p>
</div>
```

**What's Next Empty State:**
```tsx
<div className="flex flex-col items-center justify-center p-8 text-center">
  <RioImage pose="waiting" size="lg" />
  <p className="mt-4 text-lg font-medium">
    All caught up! 🎉
  </p>
  <p className="mt-2 text-sm text-muted-foreground">
    Rio will let you know when something needs your attention.
  </p>
</div>
```

---

## 2. Complete Layout Specs

### **Mobile Layout (320px-767px)**

```
┌──────────────────────────────────────┐
│ [☰] Dashboard    [🌙/☀️] [👤]      │ ← 64px Top Bar
├──────────────────────────────────────┤
│ Good morning, Sofia! ☀️             │ ← Greeting (padding 16px)
│ Here's your community pulse         │
├──────────────────────────────────────┤
│ ┌─────────┬─────────┐              │ ← Stats (2x2 grid, gap 12px)
│ │  42  ✏️ │   3  ✏️ │              │
│ │Neighbors│ Events  │              │
│ │🏡       │  🏙️    │              │
│ └─────────┴─────────┘              │
│ ┌─────────┬─────────┐              │
│ │  5   ✏️ │   2  ✏️ │              │
│ │Announce │ Active  │              │
│ │🏙️       │  🏡    │              │
│ └─────────┴─────────┘              │
├──────────────────────────────────────┤
│ What's Next [Shine Border]          │ ← Priority Card
│ ┌────────────────────────────────┐  │
│ │ 📢 Water Maintenance Notice    │  │
│ │ Tomorrow 8am-12pm • Urgent     │  │
│ │ [View Details]                 │  │
│ └────────────────────────────────┘  │
│ Coming Up:                          │
│ • 🎉 Potluck - Tomorrow 6pm        │
│ • 👋 Carmen checked in             │
│ • 📦 Listing pickup - Today        │
│ [Load More (4 more) ↓]             │
├──────────────────────────────────────┤
│ Quick Actions                       │ ← Horizontal scroll
│ [Event][Check In][Neighbors...]    │
├──────────────────────────────────────┤
│ Community Announcements (3) ▼       │ ← Scroll Stack, expanded
│ [Stacked announcement cards]        │
├──────────────────────────────────────┤
│ Live Activity ▲                     │ ← Collapsed (nothing active)
├──────────────────────────────────────┤
│ Your Active Items (5) ▼             │ ← Tabs, expanded
│ [Listings][Events][Check-ins]      │
├──────────────────────────────────────┤
│ Your Neighborhood ▲                 │ ← Collapsed
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ [MobileNav Dock]                    │ ← 72px height
└──────────────────────────────────────┘
```

### **Desktop Layout (≥1024px)**

```
┌──────────┬────────────────────────────────────────────┬─────────┐
│          │ Dashboard                                  │         │
│ Sidebar  ├────────────────────────────────────────────┴─────────┤
│ 256px    │ Good morning, Sofia! ☀️                  👤 Profile │
│          │ Here's your community pulse              Card 300px │
│          │                                           ┌─────────┐│
│          │ ┌───┬───┬───┬───┐                       │ Sofia M.││
│          │ │42 │ 3 │ 5 │ 2 │  Stats (1x4 row)      │ @sofia  ││
│          │ │✏️ │✏️ │✏️ │✏️ │                       │         ││
│          │ └───┴───┴───┴───┘                       │ 🟢 In   ││
│          │                                           │ Garden  ││
│          │ What's Next [Shine Border]               │ 1h 23m  ││
│          │ ┌────────────────────────┐              └─────────┘│
│          │ │ 📢 Water Maintenance   │                         │
│          │ │ Tomorrow • Urgent      │                         │
│          │ │ [View Details]         │                         │
│          │ └────────────────────────┘                         │
│          │ Coming Up:                                         │
│          │ • Potluck - Tomorrow 6pm                          │
│          │ • Carmen checked in                                │
│          │ [Load More ↓]                                     │
│          │                                                     │
│          │ Quick Actions                                      │
│          │ [Event][Check In][Neighbors][Map]                 │
│          │                                                     │
│          │ Community Announcements (3) ▼                      │
│          │ [Announcement cards]                               │
│          │                                                     │
└──────────┴────────────────────────────────────────────────────┘
```

---

## 3. Component Library Usage

**From Our Installed 112 Components:**

**shadcn/ui:**
- Card - Base for all sections
- Button - Actions
- Badge - Counts, priority labels
- Skeleton - Loading states
- Tabs - Your Active Items switcher
- Collapsible - Optional sections
- Dialog - Edit Stat Modal
- Checkbox - Stat selection in modal

**MagicUI:**
- AnimatedNumber (number-ticker) - Stat cards
- ShineBorder - What's Next card
- Particles (optional) - Background effect

**ReactBits:**
- ScrollStack - Announcements list

**Custom (Build These):**
- StatCard - Stat display with edit capability
- EditStatModal - Stat customization interface
- PriorityHeroCard - What's Next hero
- PriorityListItem - What's Next list items
- ProfileCard - User info card (desktop + mobile hamburger)
- QuickActionsCarousel - Dynamic action buttons
- SmartSection - Conditional collapsible wrapper
- RioImage - Macaw illustration component

---

## 4. Implementation Plan for Cursor

### **Phase 1: Foundation (5-7 hours)**

**Step 1.1: Database Setup**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN dashboard_stats_config JSONB DEFAULT '{
  "stat1": "active_neighbors",
  "stat2": "upcoming_events", 
  "stat3": "new_announcements",
  "stat4": "total_neighbors"
}'::jsonb;

-- Create stat calculation functions
CREATE OR REPLACE FUNCTION calculate_stat(
  stat_name TEXT,
  user_id UUID,
  scope TEXT
) RETURNS INTEGER AS $$
-- Implementation for each stat type
$$ LANGUAGE plpgsql;
```

**Step 1.2: Rio Illustrations**
```
Cursor prompt:
"Create 4 hand-drawn Macaw illustrations named Rio with these specs:
[Copy specs from Rio section above]

Save as:
- /public/images/rio-general.svg
- /public/images/rio-encouraging.svg
- /public/images/rio-waiting.svg
- /public/images/rio-icon.svg"
```

**Step 1.3: Base Components**
```tsx
// Create these components:
- components/dashboard/StatCard.tsx
- components/dashboard/EditStatModal.tsx
- components/dashboard/RioImage.tsx
- components/dashboard/PriorityHeroCard.tsx
- components/dashboard/PriorityListItem.tsx
- components/dashboard/ProfileCard.tsx
```

### **Phase 2: Stats System (4-5 hours)**

**Step 2.1: Stat Configuration**
```typescript
// lib/dashboard/stats-config.ts
export const AVAILABLE_STATS = [
  {
    id: 'active_neighbors',
    label: 'Active Neighbors',
    scope: 'neighborhood',
    icon: '🏡',
    description: 'Residents currently checked in',
    calculateFn: calculateActiveNeighbors
  },
  // ... all 13 stats
];

export const DEFAULT_STATS_BY_PERSONA = {
  newcomer: ['total_neighbors', 'upcoming_events', 'new_announcements', 'active_neighbors'],
  coordinator: ['active_requests', 'current_checkins', 'upcoming_events', 'new_announcements'],
  // ...
};
```

**Step 2.2: Stat Calculation API**
```typescript
// app/api/dashboard/stats/route.ts
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const config = user.dashboard_stats_config;
  
  const stats = await Promise.all([
    calculateStat(config.stat1, user.id),
    calculateStat(config.stat2, user.id),
    calculateStat(config.stat3, user.id),
    calculateStat(config.stat4, user.id)
  ]);
  
  return NextResponse.json({ stats });
}
```

**Step 2.3: Edit Modal Implementation**
```tsx
// components/dashboard/EditStatModal.tsx
function EditStatModal({ isOpen, onClose, currentConfig }) {
  const [selected, setSelected] = useState(currentConfig);
  
  const handleSave = async () => {
    await updateUserStats(selected);
    onClose();
    // Trigger stats reload
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Modal content with stat selection */}
    </Dialog>
  );
}
```

### **Phase 3: What's Next System (3-4 hours)**

**Step 3.1: Priority Calculation**
```typescript
// lib/dashboard/priority.ts
export async function calculatePriority(userId: UUID) {
  const items = await Promise.all([
    getAnnouncements(userId),
    getUpcomingEvents(userId),
    getSavedEvents(userId),
    getCurrentCheckIns(userId),
    getDueListings(userId),
    getListingPickups(userId)
  ]);
  
  const scored = items
    .flat()
    .map(item => ({
      ...item,
      priority: calculatePriorityScore(item)
    }))
    .sort((a, b) => b.priority - a.priority);
  
  return {
    hero: scored[0],
    list: scored.slice(1, 4),
    remaining: scored.slice(4)
  };
}
```

**Step 3.2: Priority API**
```typescript
// app/api/dashboard/priority/route.ts
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const priority = await calculatePriority(user.id);
  
  return NextResponse.json(priority);
}
```

### **Phase 4: Mobile Menu (2 hours)**

**Step 4.1: Hamburger Menu Component**
```tsx
// components/navigation/MobileMenu.tsx
function MobileMenu({ isOpen, onClose }) {
  const { user, checkIn } = useUser();
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left">
        {/* Profile section */}
        <div className="space-y-4">
          <Avatar size="xl" src={user.avatar} />
          <div>
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="text-xs text-muted-foreground">Member since: {user.joinedDate}</p>
          </div>
          
          {checkIn && (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <span>Checked In</span>
              <span className="text-muted-foreground">
                {checkIn.location} • {checkIn.duration}
              </span>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Actions */}
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Moon className="mr-2 h-4 w-4" />
            Theme
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### **Phase 5: Polish & Testing (3-4 hours)**

**Step 5.1: Animations**
```tsx
// Add AnimatedNumber to stats
<AnimatedNumber value={stat.value} />

// Add Shine Border to What's Next
<ShineBorder>
  <PriorityHeroCard />
</ShineBorder>
```

**Step 5.2: Empty States**
```tsx
// Use Rio in empty states
{stats.length === 0 && (
  <EmptyState
    image={<RioImage pose="general" />}
    title="Customize your stats!"
    description="Click the ✏️ icon to get started."
  />
)}
```

**Step 5.3: Real-time Updates**
```tsx
// Polling hook
useEffect(() => {
  const interval = setInterval(async () => {
    const newStats = await fetchStats();
    setStats(newStats);
  }, 60000); // 60 seconds
  
  return () => clearInterval(interval);
}, []);
```

---

## 5. Testing Checklist

### **Stats System**
- [ ] All 13 stats calculate correctly
- [ ] Edit modal opens and closes
- [ ] Can select exactly 4 stats
- [ ] Save button enables/disables correctly
- [ ] Stats persist after page reload
- [ ] AnimatedNumber transitions smoothly
- [ ] Edit icon shows on hover
- [ ] Scope badges display correctly

### **What's Next**
- [ ] Priority calculation works correctly
- [ ] Hero card displays highest priority
- [ ] List shows 2-3 items
- [ ] Load More expands correctly
- [ ] No requests appear in list
- [ ] Announcements prioritized correctly
- [ ] Events show correctly
- [ ] Check-ins display properly
- [ ] Due listings appear
- [ ] Listing pickups shown

### **Mobile Menu**
- [ ] Profile photo displays
- [ ] Name and username correct
- [ ] Member since date shown
- [ ] Check-in status updates
- [ ] Divider line appears
- [ ] Edit Profile works
- [ ] Theme toggle functions
- [ ] Log Out works
- [ ] Menu opens/closes smoothly

### **Rio Illustrations**
- [ ] Rio general pose looks friendly
- [ ] Rio encouraging pose is enthusiastic
- [ ] Rio waiting pose is patient
- [ ] Rio icon works at small size
- [ ] All illustrations are hand-drawn style
- [ ] Colors match specifications
- [ ] SVG exports are clean
- [ ] Transparent backgrounds work

### **Responsive**
- [ ] 320px (iPhone SE) works
- [ ] 375px (iPhone 12) works
- [ ] 768px (iPad) works
- [ ] 1024px (Desktop) works
- [ ] 1440px+ (Large) works
- [ ] Stats grid adapts correctly
- [ ] Profile Card moves to hamburger on mobile
- [ ] Touch targets are 44px+

### **Performance**
- [ ] Page loads < 2s
- [ ] Stats query < 500ms
- [ ] Priority query < 500ms
- [ ] Animations are 60fps
- [ ] No jank on scroll
- [ ] Polling doesn't lag

---

## 6. Copy Specifications

### **Greetings**

**Time-based:**
- 5am-11am: "Good morning, [Name]! ☀️"
- 11am-5pm: "Good afternoon, [Name]!"
- 5pm-10pm: "Good evening, [Name]!"
- 10pm-5am: "Welcome back, [Name]"

**Subheading:**
- Default: "Here's your community pulse"
- Personalized: "You're connected with [X] neighbors"
- Quiet day: "Everything's peaceful today"

### **Stat Labels**

Use exact labels from stat configuration table above.

**Scope Indicators:**
- 🏙️ Community
- 🏡 My Neighborhood

### **What's Next**

**Section Title:** "What's Next"

**List Title:** "Coming Up:"

**Load More:** "Load More ([X] more) ↓"

**Empty State:**
- Title: "All caught up! 🎉"
- Description: "Rio will let you know when something needs your attention."

### **Quick Actions**

Standard labels:
- "Create Event"
- "Check In"
- "Browse Neighbors"
- "View Map"
- "Edit Profile"

Context-aware labels:
- "Complete Your Profile"
- "RSVP to [Event]"
- "Say Hi to [Name]"
- "Pick Up Listing"

---

## 7. Success Metrics

**Quantitative:**
- Page load time < 2s
- Stat query < 500ms
- 80% of users customize at least 1 stat
- 60% of users click What's Next hero
- 40% of users use Quick Actions
- Real-time updates work without lag

**Qualitative:**
- Users can scan dashboard in 5 seconds
- Users understand what needs attention
- Users feel connected to community
- Users find dashboard delightful
- No confusion about stat customization
- Positive feedback on profile card
- Rio illustrations feel welcoming

---

## Ready for Implementation! 🚀

**Total Estimated Time:** 17-23 hours

**Breakdown:**
- Phase 1 (Foundation): 5-7 hours
- Phase 2 (Stats System): 4-5 hours
- Phase 3 (What's Next): 3-4 hours
- Phase 4 (Mobile Menu): 2 hours
- Phase 5 (Polish): 3-4 hours

**This specification is complete and ready to hand to Cursor for implementation.**

All components, data requirements, layouts, copy, and implementation steps are fully documented.