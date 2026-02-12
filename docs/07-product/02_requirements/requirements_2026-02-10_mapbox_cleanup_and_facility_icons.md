# Requirement: Mapbox Cleanup & Facility Icons

## 1. Context
- **Objective**: Improve map performance/visuals and allow facility icon customization.
- **Current State**: 
    - Facility markers are rendered twice due to a code duplication (lines 1100-1143 and 1196-1249 in `MapboxViewer.tsx`).
    - Facility icons are hardcoded or use a default emoji.
- **Dependencies**: 
    - `MapboxViewer.tsx` (Map rendering)
    - `MapboxEditorClient.tsx` (Editor logic)
    - `FacilityFields.tsx` (Admin form)
    - `locations` table (Database)

## 2. Problem Statement
The current map implementation suffers from a copy-paste error that duplicates facility markers, causing z-fighting and rendering inefficiency. Additionally, the lack of icon customization for facilities limits the map's expressiveness, preventing admins from distinguishing between different facility types (e.g., gym vs. pool) effectively.

## 3. User Stories
- **As a System Admin**, I want to **remove duplicate code** in the map viewer so that the codebase is cleaner and markers render without z-fighting artifacts.
- **As a Community Admin**, I want to **set a custom emoji** for a facility (e.g., 🏋️ for Gym) so that residents can easily identify it on the map.
- **As a Community Admin**, I want to **upload a custom image icon** for a facility so that I can use branded or specific icons (e.g., a specific clubhouse logo) instead of generic emojis.
- **As a Resident**, I want to see **distinct icons** for different facilities on the map so that I can quickly find what I'm looking for.

## 4. Dependencies
- `app/actions/locations.ts`: Ensure `icon` field updates are handled (logic exists).
- `components/photo-manager.tsx`: Reuse for image uploads.
- `app/api/upload/route.ts`: API for handling file uploads.

## 5. Documentation Gaps
- None identified. `locations` table schema matches requirements.

---
🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...

## 6. Technical Options (Phase 2)

### Option 1: Dual Input (Text/File)
A single form field group that allows the user to either:
1.  Type/Paste an emoji character.
2.  Behave like an image upload button (reusing `photo-manager` patterns).
Logic in `FacilityFields` will determine if the input is text (emoji) or a file object (upload). `MapboxViewer` will conditionally render text or an `<img>` tag based on the content (URL check).
- **Pros**:
    - Full flexibility (emoji or custom brand logos).
    - Reuses existing backend `icon` field without schema changes.
    - Minimal new UI components needed.
- **Cons**:
    - Slightly more complex validation logic (is it a URL or text?).
    - Map rendering needs careful styling to handle both text size and image dimensions consistently.
- **Effort**: Medium (Frontend Logic)

### Option 2: Strictly Emoji Picker
Implement a dedicated emoji picker library (e.g., `emoji-picker-react`) in the Admin UI. Remove image upload capability for icons.
- **Pros**:
    - Extremely consistent visual style (all vector/text).
    - Zero file storage costs/complexity for icons.
    - Simplified mental model for admins ("Pick an icon").
- **Cons**:
    - Cannot use custom brand assets or specific logos.
    - Limited to available unicode emojis.
- **Effort**: Low (npm install + UI component)

### Option 3: Lucide Icon Library Integration
Use the existing Lucide icon set (already used in the app) and provide a picker for a subset of these icons. Store the icon name string (e.g., "dumbbell") in the DB.
- **Pros**:
    - Matches the application's design system perfectly.
    - SVG scaling is perfect.
- **Cons**:
    - Admins cannot upload *their* specific logo.
    - Limited to the set we expose.
    - Requires mapping icon names to components in `MapboxViewer`.
- **Effort**: Medium-High (Mapping logic + Picker UI)

---
🔁 [PHASE 2 COMPLETE] Handing off to Product Owner...

## 7. Recommendation (Phase 3)

### Selected Option: Option 1 (Dual Input)
We recommend **Option 1** because it directly addresses the user's request for flexibility ("simple text input or upload an image") without imposing new constraints. It leverages existing infrastructure (`photo-manager` and `icon` field) while maximizing admin freedom.

### Classification
- **Priority**: P1 (High Value, Visual Bug Fix + User Request)
- **Size**: XS (Targeted Component Updates)
- **Horizon**: Q1 26 (Immediate)

---
🔁 [PHASE 3 COMPLETE] Handing off to User Review...
