# Deep Frontend Domain Audit (External Readiness Focus)
> **Date:** January 19, 2026
> **Environment:** Codebase (`components/`, `app/`, `lib/design-system`)
> **Auditor:** Frontend Specialist (Forensic Mode)
> **Readiness Status:** 🔴 **NOT READY for External Audit**

## 📊 Executive Summary
While the tech stack (Next.js 16, React 19) is modern, the codebase contains **Critical Security Vulnerabilities** (XSS) and **Fundamental Accessibility Violations** that would cause an instant failure in any SOC 2, WCAG, or technical due diligence audit. The application lacks "UX Resilience" (Error Boundaries/Suspense), meaning minor errors can crash the entire application.

| Category | Grade | Reason |
| :--- | :---: | :--- |
| **Security** | **D** | **Critical XSS vectors** confirmed in core feeds. |
| **Accessibility** | **F** | Keyboard navigation broken in core interactive elements. |
| **Resilience** | **F** | Missing `error.tsx`/`loading.tsx` safety nets. |
| **Code Quality** | **C** | Good stack, but "God Files" and Abstraction Leaks hurt velocity. |

---

## 🚨 1. Security Vulnerabilities (Critical - P0)

### 💀 Cross-Site Scripting (XSS) Vectors
*   **Finding:** Raw HTML injection without on-site sanitization.
*   **Locations:**
    *   `components/ecovilla/dashboard/PriorityFeed.tsx` (Line 440)
    *   `components/exchange/exchange-listing-detail-modal.tsx` (Line 574)
*   **Evidence:**
    ```tsx
    <div dangerouslySetInnerHTML={{ __html: item.description }} />
    ```
*   **Risk:** If a malicious user injects `<script>` tags into a listing description/event summary, they can execute code in every other user's browser (stealing session tokens, redirection). **You cannot rely solely on backend sanitization.**
*   **Remediation:** Implement `DOMPurify.sanitize()` immediately before rendering.

---

## ♿ 2. Accessibility Violation (Legal/Compliance - P0)

### ⛔ The "Div Button" Anti-Pattern
*   **Finding:** Interactive elements implemented as `<div>`s without accessibility attributes.
*   **Location:** `PriorityFeed.tsx` (Use of `onClick` on a container div).
*   **Evidence:**
    ```tsx
    <div className="..." onClick={() => handleItemClick(item)}>
    ```
*   **Violation:** WCAG 2.1 Criteria 2.1.1 (Keyboard).
    *   No `role="button"`.
    *   No `tabIndex="0"` (cannot tab to it).
    *   No `onKeyDown` handler (cannot activate with Enter/Space).
*   **Impact:** The app is unusable for users relying on screen readers or keyboards.
*   **Remediation:** Replace with `<button>` or add full ARIA support (`role`, `tabIndex`, key handlers).

---

## 🛡️ 3. UX Resilience (Stability - P1)

### 🧱 Missing Safety Nets
*   **Finding:** `loading.tsx` and `error.tsx` are missing from `app/` root and subdirectories.
*   **Impact:**
    *   **Crash Risk:** An unhandled error in *any* component will crash the *entire* React tree (White Screen of Death) instead of showing a nice "Something went wrong" UI.
    *   **UX:** No instant loading skeletons during navigation; users see blank screens or frozen UI.
*   **Remediation:** Create global `app/loading.tsx` and `app/error.tsx` immediately.

---

## 🏗️ 4. Structural Findings (Maintenance - P2)

### The "Component State" Split-Brain
*   **Finding:** `lib/design-system/component-states.ts` vs `shadcn/cva`.
*   **Impact:** Forked ecosystem. Hard to maintain.
*   **Remediation:** Deprecate `component-states.ts`.

### The "God Object"
*   **Finding:** `MapboxViewer.tsx` (~2000 lines).
*   **Impact:** High regression risk.
*   **Remediation:** Split into sub-components.

---

## ✅ External Audit Action Plan

To pass an external audit, execute this plan in order:

### Phase 1: Security Shield (Immediate)
1.  [ ] **Patch XSS:** Wrap all `dangerouslySetInnerHTML` in a sanitized helper:
    ```tsx
    import DOMPurify from "isomorphic-dompurify";
    // ...
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    ```
2.  [ ] **Fix Deprecated Code:** Delete `components/_deprecated` to reduce audit surface area.

### Phase 2: Compliance (Accessibility)
3.  [ ] **Fix Interactive Divs:** Convert Feed items to real `<button>` elements or correct ARIA controls.
4.  [ ] **Run Lighthouse:** Achieve >90 on Accessibility score for Dashboard.

### Phase 3: Stability (Resilience)
5.  [ ] **Global Error Boundary:** Add `app/error.tsx` (Client Component) to catch crashes.
6.  [ ] **Global Suspense:** Add `app/loading.tsx` for instant feedback.

### Phase 4: Clean Up (Tech Debt)
7.  [ ] **Decompose Map:** Break `MapboxViewer.tsx`.
8.  [ ] **Unify Styles:** Migrate `component-states.ts` logic into `cva`.

---

**Auditor Note:** The visual design system matches the "Premium" requirement, but the underlying engineering lacks the "Safety" and "Inclusivity" strictness required for a production-ready Series A product.
