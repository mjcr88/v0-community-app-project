# Comprehensive Mobile Domain & Native Gap Audit
> **Date:** January 21, 2026
> **Environment:** Mobile Web / PWA (`app/`, `components/ecovilla`)
> **Auditor:** Mobile Web Specialist
> **Readiness Status:** 🔴 **NOT READY for Native Migration**

## 📊 Executive Summary
The application performs decently as a PWA but faces **Critical Architectural Blockers** for a Native (Expo) migration. While the visual design is "App-like," the implementation relies heavily on Web-only paradigms (Server Actions, DOM Primitives) that require a rewrite, not a port. Additionally, basic Mobile UX patterns (Touch Targets, Input Enhancements) are missing.

| Domain | Gap Level | Primary Blocker / Risk |
| :--- | :---: | :--- |
| **Native Architecture** | **Critical** | **Server Actions** (`"use server"`) & **Radix UI** (`shadcn`) are incompatible with Native. |
| **Touch Ergonomics** | **Critical** | **Micro-Buttons** (28px) found in core feeds cause "rage taps". |
| **Data & Auth** | **High** | Heavy reliance on **Cookies** (Web) vs Tokens (Native). Offline support missing. |
| **UX Polish** | **Medium** | Missing `inputMode`, `enterKeyHint`. Over-reliance on `next/image` without mobile sizes. |

---

## 🏗️ Part 1: Native Migration Gap Analysis (The "Rewrite" Reality)

### 1. The "Radix" Wall (UI Components)
*   **Finding:** The app uses `shadcn/ui`, built on `@radix-ui` primitives that interact directly with the DOM (`div`, `portal`, `document`).
*   **Native Reality:** React Native cannot render `<div>`. It uses `<View>`. Radix Primitives **will not work**.
*   **Remediation:** Adopt **NativeWind** + **Reusables** (Native port of shadcn) or standard React Native components.
    *   *Effort:* **High** (Rewrite every UI component).

### 2. The "Server Action" Wall (Data Layer)
*   **Finding:** ~50 Client Components import backend functions directly:
    ```tsx
    import { rsvpToEvent } from "@/app/actions/events" // "use server"
    ```
*   **Native Reality:** A packaged native app cannot import server code. It must make HTTP requests to an API.
*   **Remediation:** Refactor Server Actions into public API endpoints (`app/api/...`) and use a standard fetch client.
    *   *Effort:* **High** (Architectural shift).

### 3. The "Cookie" Wall (Select-None)
*   **Finding:** Auth relies on HTTP-Only Cookies via `@supabase/ssr`.
*   **Native Reality:** Native apps struggle with cookies. Best practice is JWT Bearer Tokens via `AsyncStorage`.
*   **Remediation:** Implement a dual-auth strategy (Cookie for Web, Token for Mobile).

### 4. The "Canvas" Wall (Maps)
*   **Finding:** Maps use `mapbox-gl-js` (WebGL Canvas).
*   **Native Reality:** WebGL maps significantly underperform native SDKs (`@rnmapbox/maps`).
*   **Remediation:** Fork Map components: `MapWeb` (GL JS) vs `MapNative` (Native SDK).

---

## 📲 Part 2: PWA & Mobile Web Audit (Immediate Fixes)

### 1. Touch Target Violations (Crucial)
*   **Finding:** `PriorityFeed` and other list items use **28px buttons** (Standard: 44px).
*   **Evidence:** `className="h-7 w-7"` in interactive elements.
*   **Impact:** High mis-tap rate.
*   **Fix:** Enforce `min-w-[44px] min-h-[44px]` using padding or pseudo-elements.

### 2. Home Indicator Collision (Safe Areas)
*   **Finding:** `MobileDock` uses `bottom-6` (fixed 24px), ignoring the iPhone Home Indicator.
*   **Risk:** UI occlusion on iPhone X+.
*   **Fix:** Use `pb-[calc(1.5rem+env(safe-area-inset-bottom))]`.

### 3. Input UX (The "Smart" Keyboard)
*   **Finding:** Inputs lack semantic hints for the virtual keyboard.
    *   Missing `inputMode` (e.g., `decimal`, `email`, `tel`).
    *   Missing `enterKeyHint` (e.g., `done`, `next`, `search`).
*   **Impact:** Users must manually switch keyboard layers.
*   **Fix:** Audit all `<Input>` usages. Add `enterKeyHint="done"` to final form inputs to check-in/submit.

---

## ⚡ Part 3: Performance & Resilience

### 1. Network Resilience (Offline)
*   **Finding:** No `SWRConfig` provider found. Default SWR behavior used.
*   **Risk:** App likely loses data state on reload if offline. No "background sync" apparent.
*   **Fix:** Wrap app in `SWRConfig` with `localStorage` provider for basic offline persistence.

### 2. Image Optimization (Bandwidth)
*   **Finding:** `next/image` used heavily, but mobile `sizes` checks were inconclusive/missing in component wrappers.
*   **Risk:** Downloading 100vw images for 50vw cards.
*   **Fix:** Ensure correct `sizes="(max-width: 768px) 100vw, 50vw"` prop on all responsive images.

---

## 🤖 Part 4: Recommended Workflows (Roadmap)

To support this transition, I recommend adding the following automation workflows to `.agent/workflows`:

### 1. `/audit-mobile` (Automated Touch Safety)
*   **Purpose:** Automatically greps for common mobile sins before a PR merge.
*   **Checks:**
    *   Finds `onClick` on non-button elements (Accessibility).
    *   Finds inputs missing `inputMode`.
    *   Finds interactive elements smaller than 44px (via class checking).
*   **Value:** Prevents regression of the "PWA Polish" phase.

### 2. `/migration-check` (The Native Watchdog)
*   **Purpose:** Scans the codebase for "forbidden" architectural patterns designed for Web-only.
*   **Checks:**
    *   Imports of `"use server"` files inside `components/`.
    *   Usage of `document` or `window` outside of `useEffect`.
    *   Direct imports of `@radix-ui` primitives (should import from `components/ui`).
*   **Value:** Keeps the code "Universal-ready" even before the actual migration starts.

### 3. `/design-sync` (Token Consistency)
*   **Purpose:** Ensures that changes to `globals.css` (Tailwind Config) act as the single source of truth for both Web and future Native apps.
*   **Action:** If `tailwind.config.ts` changes, it validates that all colors/spacings are compatible with `NativeWind` (e.g., no complex `calc()` or `viewport` units that Native doesn't support).
*   **Value:** Prevents design drift between platforms.

---

## ✅ Combined Remediation Roadmap

### Phase 1: PWA Polish (The "Low Hanging Fruit")
1.  [ ] **Touch Targets:** Refactor generic `Button` variants or specific `PriorityFeed` actions to ensure 44px hit area.
2.  [ ] **Safe Areas:** Patch `MobileDock` and `layout.tsx` padding.
3.  [ ] **Input UX:** Add `enterKeyHint="done"` to Check-In modal inputs.

### Phase 2: Native Prep (The "Architecture Shift")
4.  [ ] **API Abstraction:** Stop importing Server Actions directly. Create a `useAction` hook facade that can eventually swap between Server Action (Web) and API Fetch (Native).
5.  [ ] **Style Abstraction:** Begin migrating custom CSS/Tailwind to `NativeWind` compatible patterns (avoiding complex selectors like `group-hover` which struggle in Native).

**Strategic Recommendation:**
Do not "port" this repo. Build a **Companion Expo App** in a separate workspace that consumes the business logic via a newly created API layer.
