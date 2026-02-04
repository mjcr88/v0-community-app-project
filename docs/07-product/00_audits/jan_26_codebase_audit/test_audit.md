# Test Domain Audit Report
> **Date:** January 26, 2026
> **Environment:** Codebase (`/`)
> **Auditor:** Test Engineer
> **Readiness Status:** 🔴 **CRITICAL GAP**

## 📊 Executive Summary
**Health Grade: F**
The application is currently operating without a technical safety net. There are **zero** unit, integration, or end-to-end tests for the application logic. The existing `vitest` configuration is scoped exclusively to Storybook, leaving the core business logic (`api`, `actions`, `utils`) and critical UI flows completely unprotected against regressions. 

There is **no CI/CD pipeline** defined in the codebase, implying manual deployments and no automated checks before merging.

> **Note:** "Building out of my head" has resulted in a feature-rich but fragile codebase. Any refactor carries a 100% risk of undetected regression.

## 🚨 Critical Findings (P0)

### 1. Complete Absence of Tests
*   **Status:** 🔴 **CRITICAL**
*   **Finding:** 
    *   No `test` script in `package.json`.
    *   No usage of `vitest` or `jest` for app logic.
    *   No E2E specs (Playwright is installed but has no tests).
*   **Impact:** Every code change relies on manual verification. As the app grows, manual regression testing becomes impossible, leading to "fix one bug, create two more" cycles.
*   **Remediation:** Initialize a standard test suite immediately.

### 2. Missing CI/CD Pipelines
*   **Status:** 🔴 **CRITICAL**
*   **Finding:** `.github/workflows` does not exist.
*   **Impact:** Code is likely pushed directly or merged without checks. No enforcement of linting, type-checking, or testing integration.
*   **Remediation:** Create a basic `.github/workflows/ci.yml` to run lint, type-check, and (eventually) tests.

### 3. Zod Schema Duplication/Gaps
*   **Status:** 🟠 **High Risk**
*   **Finding:** Backend audit noted manual validation instead of Zod.
*   **Impact:** Testing validation logic is impossible without standardized schemas.
*   **Remediation:** Centralize Zod schemas to make them testable in isolation.

## 🔍 Detailed Domain Scan

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Unit Tests** | ❌ None | No `.test.ts` files found for logic. |
| **Component Tests** | ⚠️ Partial | Storybook exists, but no interaction tests. |
| **E2E Tests** | ❌ None | Playwright installed but unused. |
| **Test Config** | ⚠️ Misaligned | `vitest.config.ts` only targets Storybook. |
| **CI/CD** | ❌ Missing | No automation. |

## 🛠️ Remediation Roadmap

### Immediate (Next 24 Hours)
- [ ] **Initialize Test Script:** Add `"test": "vitest"` to `package.json`.
- [ ] **Config Split:** Create/Update `vitest.config.ts` to support both Storybook AND App tests (or create `vitest.app.config.ts`).
- [ ] **Smoke Test:** Write *one* E2E test for the critical path (e.g., "User can load the dashboard").

### Short Term (This Week)
- [ ] **Critical Utils:** Add unit tests for `lib/utils.ts` and date helpers.
- [ ] **Zod Actions:** Test 3 critical Server Actions (happy path + error case).
- [ ] **CI Pipeline:** Setup GitHub Action to run `npm run lint` and `npm run test`.

### Strategic (Q1)
- [ ] **Core Coverage:** Achieve 50% coverage on `lib/` and `actions/`.
- [ ] **E2E Suite:** Cover top 5 user flows (Sign Up, Create Resident, Check-in, Event RSVP, Search).
- [ ] **Test Culture:** Require 1 test per PR.

## 🏆 The Path to World-Class (Deep Dive Analysis)

You asked for a "Top in Class" roadmap. You already have the tools installed (Storybook, Chromatic, Playwright, A11y), but they are sitting in the garage. World-class engineering isn't about *having* the tools, it's about *orchestrating* them to prevent bugs from ever reaching production.

### 1. Visual Perfection (Zero UI Regressions)
*   **Current State:** You have `@chromatic-com/storybook` installed but seemingly not running in CI.
*   **The Gold Standard:** Every code push triggers a visual diff. If a button moves 1px, the build fails until a human approves it.
*   **Action:**
    *   Set up a `chromatic.yml` workflow.
    *   Enable "UI Tests" in Storybook to auto-run interaction tests (`playwright` is already in your `deps`).

### 2. Accessibility as a Gate (Not a Chore)
*   **Current State:** `.storybook/preview.ts` has `a11y: { test: 'todo' }`. This is passive. It documents failures but doesn't stop them.
*   **The Gold Standard:** Accessibility Violations = Build Failure.
*   **Action:**
    *   Change config to `test: 'error'` in your CI environment.
    *   Use `axe-core` in Playwright E2E tests to scan every page visited.

### 3. Synthetic Monitoring (Production Reality)
*   **Current State:** Zero visibility into user flows in production.
*   **The Gold Standard:** A "synthetic user" logs in every 15 minutes and tries to Create a Resident in `nido.prod`. If it fails, you get paged.
*   **Action:** Use Checkly or a scheduled GitHub Action triggering a Playwright smoke test against Prod.

### 4. Test Data Management (The hidden killer)
*   **Current State:** Likely manual seed or testing against unstable dev data.
*   **The Gold Standard:** Deterministic Factories.
    *   **Bad:** `const user = db.getUser(1)` (Who is user 1? Did they change?)
    *   **Good:** `const user = await UserFactory.create({ role: 'admin' })`
*   **Action:** Create a `tests/factories` directory.

---

## 🚫 Anti-Patterns to Avoid

As you build this out, avoid these common traps that kill velocity:

| Anti-Pattern | Why it hurts | Instead... |
| :--- | :--- | :--- |
| **"Testing Implementation"** | *Tests break when you refactor code, even if behavior works.* | Test public `props` and User Events (click, type), not internal state. |
| **"The Sleeping Test"** | `await wait(1000)` makes tests slow and flaky. | Use `await expect(ui).toBeVisible()`. |
| **"The Mocking Bird"** | Mocking *everything* (Prisma, Zod, network). Tests pass but app breaks. | **Don't mock the database.** Use a test Docker container. Limit mocks to 3rd party APIs (Stripe, Twilio). |
| **"Test Laundry"** | "It failed, I'll just run it again." | Flaky tests are a P0 bug. Delete the test or fix the root cause immediately. |

---

## 🛠️ Revised Remediation Roadmap (Top-Tier)

### Phase 1: The Safety Net (Immediate)
- [ ] **Initialize Test Script:** Add `"test": "vitest"` to `package.json`.
- [ ] **Config Split:** Create `vitest.app.config.ts`.
- [ ] **Smoke Test:** Write 1 E2E test for the critical path.

### Phase 2: The Guardrails (Short Term)
- [ ] **Strict A11y:** Update `.storybook/preview.ts` to block on a11y errors.
- [ ] **CI Pipeline:** `ci.yml` running Lint + Type Check + Unit Tests.

### Phase 3: The Engine (Strategic)
- [ ] **Visual CI:** Configure Chromatic to auto-reject UI changes.
- [ ] **Factories:** Build `UserFactory` and `ResidentFactory` for deterministic tests.
- [ ] **Synthetic Monitor:** Checkly script for `nido.prod` login flow.
