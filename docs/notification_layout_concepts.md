# Notification Page Layout Concepts

We are redesigning the notifications page to align with the **Exchange Directory** aesthetic and the **Ecovilla** tone of voice.

**Core Requirements:**
- **Search**: Prominent, similar to Exchange.
- **Filter 1 (Type)**: Dropdown (Requests, Exchange, Announcements, Events).
- **Filter 2 (Status)**: Dropdown (All, Unread, Action Required, Archived).
- **Default View**: Unread + Action Required.
- **Action**: "Mark all as read" button.

---

## Option A: The "Directory" Standard (Inline)
*Aligns perfectly with the Exchange Directory layout.*

**Layout:**
```text
[ Header: Notifications ]                                         [Create Button (Hidden)]

[ Search Bar (Full Width) ----------------------------------------------------------- ]

[ Filter: Type v ]  [ Filter: Status v ]                          [ Mark all as read ]
```

**Pros:**
- **Consistency**: Matches the Exchange page exactly.
- **Scannability**: All controls are in one predictable place.
- **Space Efficient**: Uses the full width effectively.

**Cons:**
- "Mark all as read" might get lost if there are many filters.

---

## Option B: The "Action First" (Split Header)
*Prioritizes the primary maintenance action.*

**Layout:**
```text
[ Header: Notifications ]

[ Search Bar (70%) ---------------------------------- ]  [ Button: Mark all as read ]

[ Filter: Type v ]  [ Filter: Status v ]
```

**Pros:**
- **Prominence**: "Mark all as read" is very easy to find (good for "inbox zero" users).
- **Clarity**: Separates "finding things" (search) from "managing things" (mark read).

**Cons:**
- Uses more vertical space (two distinct control rows).

---

## Option C: The "Toolbar" (Unified)
*A compact, modern approach.*

**Layout:**
```text
[ Header: Notifications ]

[ Search (40%) ]  [ Type v ]  [ Status v ]  [ Spacer ]  [ Icon: Check (Mark Read) ]
```

**Pros:**
- **Compact**: Very clean, takes up minimal vertical space.
- **Modern**: Feels like a modern email client or task manager.

**Cons:**
- Search bar is smaller.
- "Mark read" is an icon, which might be less obvious than a text button (though we can use a tooltip).

---

## Recommendation
**Option A** is the safest choice for consistency with the Exchange Directory. However, **Option B** might be better if "Mark all as read" is a frequent action users struggle to find.

## Tone of Voice & Empty States
Regardless of the layout, we will use **Río** for empty states:

**No Unread Notifications:**
> *[Río sleeping illustration]*
> **All caught up!**
> You've seen everything new. Río is taking a siesta too. ☀️
> [View Archived]

**No Filter Matches:**
> *[Río with magnifying glass]*
> **No notifications found**
> Try adjusting your filters? Río is still looking!
> [Clear Filters]
