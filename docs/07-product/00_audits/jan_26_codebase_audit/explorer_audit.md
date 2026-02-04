# Explorer Domain Audit
> **Date:** January 19, 2026
> **Environment:** Codebase (`app/`, `components/`) & Dependencies
> **Auditor:** Explorer Agent
> **Status:** 🟡 **Structurally Sound but Cluttered**

## 📊 Executive Summary

**Health Grade: C+** (Downgraded from B- due to Type Safety & Locking)

As a "new hire" exploring the codebase, the foundation is solid but shows signs of "Rapid Prototyping Debt". The **Next.js App Router** structure is correct, but the **Type Safety** confidence is low (380+ `any` usages) and **Vendor Lock-in** is high.

---

## 🏗️ Deep Code & Architecture Audit

### 1. Type Safety Trust Issues
*   **Finding:**
    *   **384 instaces of `: any`** in the codebase.
    *   **21 instances of `@ts-ignore`**.
*   **Impact:** TypeScript is being treated as a suggestion rather than a rule. This destroys the confidence required for refactoring. If I change a type, I cannot trust the compiler to catch all breaks.
*   **Remediation:** Enforce `no-explicit-any` in ESLint and embark on a "Type Hardening" sprint.

### 2. The "Design System" Abstraction Leak
*   **Finding:** `components/ui/button.tsx` (Shadcn) imports from `@/lib/design-system/component-states.ts`.
*   **Analysis:** You have wrapped Shadcn's simple `cva` logic with a custom `getButtonStateClasses` function.
*   **Risk:** This checks "Clean Code" boxes but fighting against the ecosystem. Updating Shadcn components will now be a manual conflict resolution nightmare. You have effectively forked the UI library.
*   **Remediation:** Evaluate if `component-states.ts` provides enough value to justify the maintenance cost.

### 3. Rendering Strategy (Client Heavy)
*   **Finding:** **343 files** use `"use client"`.
*   **Analysis:** For an App Router project, this is extremely high. It suggests that most of the application is running Client-Side (CSR), largely negating the performance benefits of React Server Components (RSC).
*   **Remediation:** Audit "Leaf Components". Are we making whole pages `use client` just to handle a single button click?

---

## 🕵️ External Due Diligence (Acquisition Lens)

> **Scenario:** An external technical auditor is reviewing this repo for a potential Series A or Acquisition.

### 1. 🚨 IP & Legal Risk (Critical)
*   **Finding:** No `LICENSE` file exists in the root directory.
*   **Impact:** Legally, this code is "All Rights Reserved" by the creator.
*   **Remediation:** Add a clear `LICENSE`.

### 2. 🔒 Vendor Lock-In (Infrastructure Risk)
*   **Finding:**
    *   **Vercel Crons**: `/api/cron/check-return-dates` relies on `vercel.json` scheduling.
    *   **Image Optimization**: Disabled in `next.config.mjs` (`unoptimized: true`) - likely to save costs or avoid Vercel limits, but hits performance.
*   **Impact:** Migrating off Vercel would break background jobs.
*   **Remediation:** Document "Infrastructure Dependencies".

### 3. 📉 "God Object" Maintainability Risk
*   **Finding:** Files > 1500 lines:
    *   `components/map/MapboxViewer.tsx` (~2000 lines)
    *   `app/actions/events.ts` (~1987 lines)
*   **Impact:** **High Bus Factor.**
*   **Remediation:** Urgent refactor.

### 4. 🌍 Data Sovereignty (GDPR/Compliance)
*   **Finding:** No region-aware code for Supabase connection.
*   **Impact:** Cannot guarantee data residency (e.g. "EU Data stays in EU").

---

## 🚨 Internal Critical Findings (P0 - Immediate Cleanup)

### 1. Production Route Pollution
*   **Finding:** `app/test-*` folders creating public routes.
*   **Remediation:** Move to `_playground/`.

### 2. Bleeding Edge Dependency Risk
*   **Finding:** `next: ^16.0.10`, `react: ^19.2.1`.
*   **Risk:** Extremely high stability risk.

---

## 🛠️ Remediation Roadmap

### Immediate (Next 24 Hours)
- [ ] **Legal:** Add `LICENSE` file.
- [ ] **Cleanup:** Delete `app/test-*` folders.
- [ ] **Type Check:** Run `tsc --noEmit` and log the error count baseline.

### Strategic (Q1)
- [ ] **Refactor:** Break `MapboxViewer.tsx` into 4-5 sub-components.
- [ ] **Type Hardening:** Reduce `any` usage by 50%.
- [ ] **Unwind Abstraction:** Revert `Button.tsx` to standard Shadcn pattern if possible.

### 🧠 Recommended System Upgrades (New Workflows)

#### 1. Workflow: `/harden-types` (Type Safety Automation)
*   **Why:** To attack the 384+ `any` instances systematically.
*   **Goal:** Iteratively find low-confidence files, generate Zod/Interfaces, and replace `any`.

#### 2. Workflow: `/decompose` (Safe Refactoring)
*   **Why:** To safely break down "God Files" like `MapboxViewer.tsx` (2000 lines).
*   **Goal:** A 4-step process: Extract State -> Isolate Renderers -> Define Strict Props -> Verify.
