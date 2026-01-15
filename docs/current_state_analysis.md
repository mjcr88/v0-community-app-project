# Current Notification Page Analysis

## Overview
The notification page (`/t/[slug]/dashboard/notifications`) serves as a central hub for user updates and actions. It is currently built as a hybrid server/client page:
- **Server-Side**: Authenticates the user and fetches the initial batch of notifications to ensure fast first paint.
- **Client-Side**: Uses `SWR` for real-time updates (polling every 30 seconds) and manages UI state (tabs, filters).

## Component Structure

### 1. Page Layout (`page.tsx` & `notifications-client.tsx`)
- **Header**: Simple title "Notifications" and subtitle.
- **Controls**:
    - **Tabs**: "All", "Exchange", "Events" (Disabled), "Check-ins" (Disabled), "Announcements" (Disabled).
    - **Filters**: "All", "Unread", "Action Required", "Archived".
    - **Global Actions**: "Mark All as Read" button (appears when there are unread items).
- **Badges**: Dynamic counters for "Unread" and "Action Required" counts.

### 2. Notification Cards
The list renders one of two card types based on the notification `type`:

#### A. Standard Notification Card (`notification-card.tsx`)
Used for generic updates.
- **Visuals**: Avatar, Title, Message, Time (relative), "New" badge.
- **Actions**:
    - **Mark as Read**: Button or click-to-read.
    - **Archive**: Button to hide from main view.
- **States**:
    - **Unread**: Highlighted with accent background and primary border.
    - **Action Required**: Shows red badge (though mostly used in Exchange card).

#### B. Exchange Notification Card (`exchange-notification-card.tsx`)
A complex, interactive card for the "Borrow/Lend" feature.
- **Context**: Shows the item image, category badge, and transaction details (dates, quantity).
- **Interactive Workflows**:
    - **Borrow Requests**: Lender can "Confirm" or "Decline" directly from the card.
    - **Pickups**: Lender can "Mark as Picked Up".
    - **Returns**: Lender can "Mark as Returned" (with condition assessment).
- **Status Indicators**:
    - **Badges**: "Approved", "Declined", "Reminder" (Yellow), "Overdue" (Red).
    - **Messages**: Displays borrower/lender messages inline.

## Data & Business Logic

### Notification Types
The system currently handles these specific types (defined in `notification-utils.ts`):
1.  **Exchange**:
    - `exchange_request`: New borrow request.
    - `exchange_confirmed` / `exchange_rejected`: Response to request.
    - `exchange_picked_up` / `exchange_returned`: Transaction status updates.
    - `exchange_reminder` / `exchange_overdue`: Time-sensitive alerts.
    - `exchange_cancelled`: Cancellation updates.
2.  **Events** (Placeholder logic exists):
    - `event_invite`, `event_rsvp`, `event_cancelled`, `event_updated`.
3.  **Announcements** (Placeholder logic exists):
    - `announcement`.
4.  **Check-ins** (Placeholder logic exists):
    - `checkin_invite`, `checkin_joined`.

### Filtering & Sorting
- **Tabs**: Currently hardcoded. "Events", "Check-ins", and "Announcements" tabs are visible but show "Coming soon" empty states.
- **Filters**: Client-side filtering for Unread/Action Required/Archived.
- **Sorting**: Implicitly by order received (array order from API).

## Current Design Observations
- **Styling**: Uses standard Shadcn UI components (Card, Button, Badge).
- **Aesthetics**: Functional but lacks the specific "Ecovilla" branding (Forest/Sunrise palette, organic shapes).
- **UX Gaps**:
    - "Coming Soon" tabs clutter the interface if features aren't ready.
    - Visual hierarchy between "Action Required" items and informational updates could be stronger.
    - Mobile responsiveness relies on standard stacking; complex exchange cards might be dense on small screens.

## Proposed Scope for Redesign
Based on your request, we need to:
1.  **Align with Design System**: Apply the Forest/Sunrise palette and organic typography.
2.  **Refine Layout**: Improve how different notification types are grouped or distinguished.
3.  **Activate Missing Types**: Implement actual logic for Announcements and Private Event invites.
4.  **Enhance UX**: Make "Action Required" items prominent and distinct from passive updates.
