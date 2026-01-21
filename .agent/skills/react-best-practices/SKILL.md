---
name: react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance.
---

# React Best Practices

**Version 1.0.0**
Vercel Engineering
January 2026

> **Note:**
> This document is mainly for agents and LLMs to follow when maintaining,
> generating, or refactoring React and Next.js codebases at Vercel. Humans
> may also find it useful, but guidance here is optimized for automation
> and consistency by AI-assisted workflows.

---

## Abstract

Comprehensive performance optimization guide for React and Next.js applications, designed for AI agents and LLMs. Contains 40+ rules across 8 categories, prioritized by impact from critical (eliminating waterfalls, reducing bundle size) to incremental (advanced patterns). Each rule includes detailed explanations, real-world examples comparing incorrect vs. correct implementations, and specific impact metrics to guide automated refactoring and code generation.

---

## Table of Contents

1. [Eliminating Waterfalls](#1-eliminating-waterfalls) — **CRITICAL**
2. [Bundle Size Optimization](#2-bundle-size-optimization) — **CRITICAL**
3. [Server-Side Performance](#3-server-side-performance) — **HIGH**
4. [Client-Side Data Fetching](#4-client-side-data-fetching) — **MEDIUM-HIGH**
5. [Re-render Optimization](#5-re-render-optimization) — **MEDIUM**
6. [Rendering Performance](#6-rendering-performance) — **MEDIUM**
7. [JavaScript Performance](#7-javascript-performance) — **LOW-MEDIUM**
8. [Advanced Patterns](#8-advanced-patterns) — **LOW**

---

## 1. Eliminating Waterfalls
**Impact: CRITICAL**

Waterfalls are the #1 performance killer. Each sequential await adds full network latency. Eliminating them yields the largest gains.

### 1.1 Defer Await Until Needed
**Impact: HIGH (avoids blocking unused code paths)**

Move `await` operations into the branches where they're actually used to avoid blocking code paths that don't need them.

**Incorrect: blocks both branches**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)
  
  if (skipProcessing) {
    // Returns immediately but still waited for userData
    return { skipped: true }
  }
  
  // Only this branch uses userData
  return processUserData(userData)
}
```

**Correct: only blocks when needed**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    // Returns immediately without waiting
    return { skipped: true }
  }
  
  // Fetch only when needed
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

### 1.2 Dependency-Based Parallelization
**Impact: CRITICAL (2-10× improvement)**

For operations with partial dependencies, use `Promise.all` or parallel execution structures to maximize parallelism.

**Incorrect: profile waits for config unnecessarily**

```typescript
const [user, config] = await Promise.all([
  fetchUser(),
  fetchConfig()
])
const profile = await fetchProfile(user.id)
```

**Correct: config and profile run in parallel**

```typescript
// Start independent fetches immediately
const userPromise = fetchUser()
const configPromise = fetchConfig()

const user = await userPromise
// Profile only depends on user, can run same time as config
const [profile, config] = await Promise.all([
  fetchProfile(user.id),
  configPromise
])
```

### 1.3 Prevent Waterfall Chains in API Routes
**Impact: CRITICAL (2-10× improvement)**

In API routes and Server Actions, start independent operations immediately, even if you don't await them yet.

**Incorrect: config waits for auth, data waits for both**

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

**Correct: auth and config start immediately**

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id)
  ])
  return Response.json({ data, config })
}
```

### 1.4 Promise.all() for Independent Operations
**Impact: CRITICAL (2-10× improvement)**

When async operations have no interdependencies, execute them concurrently using `Promise.all()`.

**Incorrect: sequential execution, 3 round trips**

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**Correct: parallel execution, 1 round trip**

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```

### 1.5 Strategic Suspense Boundaries
**Impact: HIGH (faster initial paint)**

Instead of awaiting data in async components before returning JSX, use Suspense boundaries to show the wrapper UI faster while data loads.

**Incorrect: wrapper blocked by data fetching**

```tsx
async function Page() {
  const data = await fetchData() // Blocks entire page
  
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <DataDisplay data={data} />
      </div>
      <div>Footer</div>
    </div>
  )
}
```

**Correct: wrapper shows immediately, data streams in**

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />
        </Suspense>
      </div>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // Only blocks this component
  return <div>{data.content}</div>
}
```

---

## 2. Bundle Size Optimization
**Impact: CRITICAL**

Reducing initial bundle size improves Time to Interactive and Largest Contentful Paint.

### 2.1 Avoid Barrel File Imports
**Impact: CRITICAL (200-800ms import cost, slow builds)**

Import directly from source files instead of barrel files to avoid loading thousands of unused modules.

**Incorrect: imports entire library**

```tsx
import { Check, X, Menu } from 'lucide-react'
// Loads 1,583 modules, takes ~2.8s extra in dev
```

**Correct: imports only what you need**

```tsx
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
// Loads only 3 modules (~2KB vs ~1MB)
```

**Alternative: Next.js optimizePackageImports**

```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mui/material']
  }
}
```

### 2.2 Conditional Module Loading
**Impact: HIGH (loads large data only when needed)**

Load large data or modules only when a feature is activated.

**Example: lazy-load animation frames**

```tsx
function AnimationPlayer({ enabled }) {
  const [frames, setFrames] = useState(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== 'undefined') {
      import('./animation-frames.js').then(mod => setFrames(mod.frames))
    }
  }, [enabled, frames])
  // ...
}
```

The `typeof window !== 'undefined'` check prevents bundling this module for SSR.

### 2.3 Defer Non-Critical Third-Party Libraries
**Impact: MEDIUM (loads after hydration)**

Analytics, logging, and error tracking don't block user interaction. Load them after hydration.

**Correct: loads after hydration**

```tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => m.Analytics),
  { ssr: false }
)
```

### 2.4 Dynamic Imports for Heavy Components
**Impact: CRITICAL (directly affects TTI and LCP)**

Use `next/dynamic` to lazy-load large components not needed on initial render.

**Correct: Monaco loads on demand**

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)
```

### 2.5 Preload Based on User Intent
**Impact: MEDIUM (reduces perceived latency)**

Preload heavy bundles before they're needed (on hover/focus).

```tsx
function EditorButton() {
  const preload = () => {
    if (typeof window !== 'undefined') void import('./monaco-editor')
  }
  return <button onMouseEnter={preload}>Open Editor</button>
}
```

---

## 3. Server-Side Performance
**Impact: HIGH**

### 3.1 Cross-Request LRU Caching
**Impact: HIGH (caches across requests)**

`React.cache()` only works within one request. For data shared across sequential requests, use an LRU cache.

```typescript
import { LRUCache } from 'lru-cache'
const cache = new LRUCache<string, any>({ max: 1000, ttl: 300000 })

export async function getUser(id: string) {
  if (cache.has(id)) return cache.get(id)
  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}
```

### 3.2 Minimize Serialization at RSC Boundaries
**Impact: HIGH (reduces data transfer size)**

Only pass fields that the client actually uses.

**Incorrect: serializes all 50 fields**
```tsx
return <Profile user={user} /> // user object has huge graph
```

**Correct: serializes only 1 field**
```tsx
return <Profile name={user.name} />
```

### 3.3 Parallel Data Fetching with Component Composition
**Impact: CRITICAL (eliminates server-side waterfalls)**

Restructure with composition to parallelize data fetching.

**Correct: both fetch simultaneously**

```tsx
async function Header() { ... }
async function Sidebar() { ... }

export default function Page() {
  return (
    <div>
      <Header />
      <Sidebar />
    </div>
  )
}
```

### 3.4 Per-Request Deduplication with React.cache()
**Impact: MEDIUM (deduplicates within request)**

Use `React.cache()` for non-fetch async work (DB queries, auth checks).

```typescript
import { cache } from 'react'
export const getCurrentUser = cache(async () => {
  return await db.user.findUnique(...)
})
```

### 3.5 Use after() for Non-Blocking Operations
**Impact: MEDIUM (faster response times)**

Use Next.js's `after()` to schedule work (logging, analytics) after response is sent.

```tsx
import { after } from 'next/server'

export async function POST(request: Request) {
  await updateDatabase(request)
  
  after(async () => {
    await logUserAction()
  })
  
  return Response.json({ status: 'success' })
}
```

---

## 4. Client-Side Data Fetching
**Impact: MEDIUM-HIGH**

### 4.1 Deduplicate Global Event Listeners
**Impact: LOW**
Use `useSWRSubscription` or a module-level Map to share global event listeners.

### 4.2 Use Passive Event Listeners
**Impact: MEDIUM**
Add `{ passive: true }` to touch/wheel listeners to enable immediate scrolling.

### 4.3 Use SWR for Automatic Deduplication
**Impact: MEDIUM-HIGH**
Use SWR/TanStack Query to deduplicate requests across components.

### 4.4 Version and Minimize localStorage Data
**Impact: MEDIUM**
Add version prefix (`userConfig:v1`) and store only needed fields to avoid schema conflicts.

---

## 5. Re-render Optimization
**Impact: MEDIUM**

### 5.1 Defer State Reads to Usage Point
Don't subscribe to `useSearchParams` or context if you only need the value inside a callback. Read it from `window.location` or a ref in the callback.

### 5.2 Extract to Memoized Components
Extract expensive UI parts (charts, complex lists) to `memo()` components.

### 5.3 Narrow Effect Dependencies
Use `[user.id]` instead of `[user]` to prevent effects running on irrelevant field changes.

### 5.4 Subscribe to Derived State
Subscribe to `isMobile` (boolean) instead of `windowWidth` (number) to reduce re-renders.

### 5.5 Use Functional setState Updates
Use `setItems(curr => [...curr, newItem])` to avoid adding `items` to dependency arrays.

### 5.6 Use Lazy State Initialization
Use `useState(() => expensiveCalc())` to run calculation only on mount.

### 5.7 Use Transitions for Non-Urgent Updates
Use `startTransition(() => setScrollY(y))` for frequent updates to keep UI responsive.

---

## 6. Rendering Performance
**Impact: MEDIUM**

### 6.1 Animate SVG Wrapper Instead of SVG Element
Wrap SVG in a `div` and animate the div to enable GPU acceleration.

### 6.2 CSS content-visibility for Long Lists
Use `content-visibility: auto` in CSS for list items to skip rendering off-screen content.

### 6.3 Hoist Static JSX Elements
Extract static JSX (icons, skeletons) outside the component to avoid recreation.

### 6.4 Optimize SVG Precision
Reduce SVG coordinate precision (e.g. 1 decimal place) to reduce DOM size.

### 6.5 Prevent Hydration Mismatch
Use `dangerouslySetInnerHTML` with an IIFE to set initial state/class based on localStorage before hydration to avoid flicker.

### 6.6 Use Activity Component
Use `<Activity mode="hidden">` (if available) or `display: none` to preserve state of expensive hidden components.

### 6.7 Use Explicit Conditional Rendering
Use `count > 0 ? <Badget /> : null` instead of `count && <Badge />` to avoid rendering "0".

---

## 7. JavaScript Performance
**Impact: LOW-MEDIUM**

### 7.1 Batch DOM CSS Changes
Use CSS classes or `cssText` instead of setting individual style properties.

### 7.2 Build Index Maps
Convert arrays to Maps (`const map = new Map(users.map(u => [u.id, u]))`) for O(1) lookups.

### 7.3 Cache Property Access
Store `obj.deep.prop` in a variable before looping.

### 7.4 Cache Repeated Function Calls
Use module-level `Map` to cache results of pure functions (like slugify) across renders.

### 7.5 Cache Storage API Calls
Cache `localStorage` and `cookie` reads in a module-level variable/Map.

### 7.6 Combine Multiple Array Iterations
Use a single `for` loop instead of multiple `.filter` passes.

### 7.7 Early Length Check
Check `arr1.length !== arr2.length` before doing deep comparison.

### 7.8 Early Return
Return as soon as an invalid condition is met.

### 7.9 Hoist RegExp Creation
Define Regex constants outside components.

### 7.10 Loop for Min/Max
Use a loop to find min/max instead of sorting the array.

### 7.11 Best Data Structures
Use `Set` for membership checks (`set.has(x)` is O(1)).

### 7.12 Immutable Sorting
Use `.toSorted()` instead of `[...arr].sort()` (if supported) or carefully copy.

---

## 8. Advanced Patterns
**Impact: LOW**

### 8.1 Store Event Handlers in Refs
Use `useEffectEvent` or `useLatest` ref pattern to avoid breaking effects when handlers change.

### 8.2 useLatest
```ts
function useLatest(val) {
  const ref = useRef(val)
  useEffect(() => { ref.current = val }, [val])
  return ref
}
```
Use this to access fresh props/state in effects without adding them as dependencies.

---

## 9. UX Resilience (Stability)
**Impact: CRITICAL**

### 9.1 Global Error Boundaries
**Rule**: Every Route Group/Layout must have an `error.tsx`.
**Why**: Isolates crashes to the component, preventing "White Screen of Death".

### 9.2 Instant Feedback Chains
**Rule**: Every async Page must have a `loading.tsx` or `Suspense` boundary.
**Why**: Prevents the browser from hanging while the server works.
