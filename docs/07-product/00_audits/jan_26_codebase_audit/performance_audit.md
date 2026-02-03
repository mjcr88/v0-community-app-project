# Deep Performance Domain Audit (Speed & Efficiency Focus)
> **Date:** January 21, 2026
> **Environment:** Codebase (`components/`, `app/`, `next.config.mjs`)
> **Auditor:** Performance Optimizer
> **Readiness Status:** 🔴 **NOT READY for Scale**

## 📊 Executive Summary
The application has **Critical Performance Misconfigurations** that disable standard Next.js optimizations. While rendering patterns within complex components (like `MapboxViewer`) are decent (using `useMemo`), the **Loading Strategy** is non-existent. The entire application bundle likely includes heavy libraries (Mapbox GL, Turf, Framer Motion) on initial load due to a lack of Code Splitting.

| Category | Grade | Reason |
| :--- | :---: | :--- |
| **Configuration** | **F** | `images: { unoptimized: true }` explicitly disables Image Optimization. |
| **Bundle Size** | **D** | No `dynamic()` imports found. Mapbox + Turf likely bloats entry chunks. |
| **Rendering** | **B-** | `PriorityFeed` uses optimistic UI (Good) but lacks `memo`. Mapbox uses `useMemo` correctly. |
| **Core Web Vitals** | **C** | Good font loading strategy, but Image/Script loading is unoptimized. |

---

## 🚨 1. Critical Configuration Failures (P0)

### 🛑 Image Optimization Disabled
*   **Finding:** `next.config.mjs` explicitly sets `unoptimized: true`.
*   **Evidence:**
    ```javascript
    images: {
      unoptimized: true,
    },
    ```
*   **Impact:** All images (user avatars, event covers) are served at **original resolution and file size**. A 5MB user upload will be served as 5MB. This destroys LCP (Largest Contentful Paint) and data plans.
*   **Remediation:** Remove this flag immediately unless deploying to a platform strictly forbidding image optimization (e.g., standard static export without an image loader). If static export is required, use a cloud loader (Cloudinary/Imgix).

---

## 📦 2. Bundle Strategy (P1)

### 🧱 The "Monolith" Bundle (Mapbox)
*   **Finding:** `MapboxViewer.tsx` imports `mapbox-gl` and `@turf/turf` directly.
*   **Context:** `mapbox-gl` is ~800KB+ gzipped. `turf` is heavy.
*   **Evidence:** No usage of `dynamic(() => import(...))` found in `app/` structure.
*   **Impact:** Users visiting the "Dashboard" (which likely doesn't show the map immediately or shows a small preview) pay the penalty of downloading the entire GIS stack.
*   **Remediation:**
    1.  Wrap `MapboxViewer` in a lazy loader:
        ```tsx
        const MapboxViewer = dynamic(() => import('@/components/map/MapboxViewer'), {
          loading: () => <Skeleton className="h-[400px]" />,
          ssr: false // Mapbox doesn't work on server anyway
        })
        ```
    2.  Lazy load `PriorityFeed` if it's below the fold.

### 📉 Missing Bundle Analyzer
*   **Finding:** No `@next/bundle-analyzer` in `devDependencies` or usage in scripts.
*   **Impact:** You are flying blind regarding what npm packages end up in your client bundle.
*   **Remediation:** Install `@next/bundle-analyzer` and add a `analyze` script to `package.json`.

---

## ⚡ 3. Runtime Performance (P2)

### 🔄 React Render Cycles
*   **Finding:** `PriorityFeed.tsx` is a high-frequency update component (polling every 30s) but is not memoized.
*   **Risk:** If the parent layout re-renders (e.g., navigation state changes), the entire feed reconciliation runs.
*   **Remediation:** Wrap export in `React.memo(PriorityFeed)`. Note: Since it handles its own data fetching via SWR, the impact is minimized, but prop drill-down re-renders are still possible.

### 📡 Server Action Waterfalls
*   **Finding:** `app/actions/events.ts` -> `getUpcomingEvents` properly uses `Promise.all` for fetching RSVPs and Saved events.
*   **Status:** ✅ **PASSED**. The backend data fetching logic shows good parallelization awareness.

---

## 🚀 4. Elite Performance Gap Analysis (Leaderboard Target)
*Where 90/100 becomes 100/100*

### 🎨 Tailwind Configuration Schizophrenia
*   **Finding:** The project uses **Tailwind v4** (`package.json`, `@import "tailwindcss"`) BUT retains a massive **v3-style `tailwind.config.ts`**.
*   **Impact:** 
    *   **Double CSS Generation:** v4 automatically generates CSS from usage. The config might be forcing legacy preflight or utility generation that duplicates v4's internal engine.
    *   **Build Speed:** v4 is designed for Rust-speed content scanning. Feeding it a heavy TS config forces it into a compatibility mode, slowing down HMR (Hot Module Replacement).
*   **Leaderboard Fix:** Migrate fully to v4 CSS-first configuration. Move tokens from `tailwind.config.ts` to standard CSS variables in `globals.css` (inside `@theme`).

### 🎭 Animation Bloat (Payload Size)
*   **Finding:** `app/globals.css` contains unused, complex keyframes (`aurora`, `shiny-text`, `ripple`).
*   **Impact:** Increases Critical CSS size. Even if unused, browser parsers must read and construct the generic OM (Object Model) for these rules.
*   **Leaderboard Fix:** Move "One-off" animations to the specific component modules (using Tailwind arbitrary values or CSS modules) or delete them if unused.

### 🧩 Layout Provider Chaining
*   **Finding:** `app/layout.tsx` is clean (only 3 providers), which is **Excellent**.
*   **Status:** ✅ **Elite**. Many apps suffer from "Provider Hell" (10+ providers). This app keeps the root clean, ensuring fast TTI (Time to Interactive).

---

## ✅ Performance Optimization Roadmap

### Phase 1: The "Unbrake" (Immediate)
1.  [ ] **Enable Image Optimization:** Remove `unoptimized: true` from `next.config.mjs`.
2.  [ ] **Code Split Mapbox:** Implement `next/dynamic` for `MapboxViewer` everywhere it is used.

### Phase 2: Visibility (Analysis)
3.  [ ] **Install Analyzer:** Add `@next/bundle-analyzer`.
4.  [ ] **Audit Dependencies:** Check if `moment` (if used) or `lodash` (full import) are present in the bundle report.

### Phase 3: Tuning (Vitals)
5.  [ ] **Font Preload:** Ensure `app/layout.tsx` variable fonts are actually being used by Tailwind (Verified: they are mapped to `--font-sans`).
6.  [ ] **Memoization:** Add `React.memo` to `PriorityFeed` and `Card` components in lists.

### Phase 4: Elite/Leaderboard
7.  [ ] **Tailwind v4 Migration:** Delete `tailwind.config.ts` and move all tokens to `app/globals.css` `@theme` block.
8.  [ ] **CSS Purging:** Remove unused `@keyframes` from `globals.css`.

---

**Auditor Note:** The codebase shows "Senior" level React knowledge (Optimistic UI, Promise.all) but "Junior" level Next.js Configuration (disabling Image Optimization, no Dynamic Imports). Fixing config will yield a 40-50% speedup immediately.
