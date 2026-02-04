# Security Audit Report & Leaderboard Roadmap
**Date:** January 26, 2025
**Auditor:** Antigravity (Security Auditor)
**Scope:** Configuration, Authentication, Dependencies, API Security, and Strategic Maturity

## 1. Executive Summary

This security audit focuses on two dimensions: immediate technical risks (Configuration/API) and the strategic gap to achieving "Leaderboard" (Top 1%) security status.

**Overall Health Grade:** **F (Critical Config & Auth Gaps)**
*   **Security Score:** 35/100
*   **Critical Issues (P0):** 1 (New) + 5 (Previous)
*   **Strategic Maturity:** Level 1 (Ad-hoc) -> Target: Level 4 (Automated)

---

## 2. Critical Findings (P0) - Immediate Action Required

### 2.1. Unprotected Admin API (Privilege Escalation)
**Location:** `app/api/link-resident/route.ts`
**Description:**
The `/api/link-resident` endpoint uses the `SERVICE_ROLE_KEY` to perform sensitive operations (deleting and re-creating user records) but performs **NO authentication checks** on the caller.
**Impact:**
An attacker can POST to this endpoint with any `residentId` and `authUserId` to hijack user accounts or corrupt resident data without logging in.
**Remediation:**
*   **Immediate Fix:** Add `supabase.auth.getUser()` check and Verify Admin Permissions before processing.

---

## 3. High Risk Findings (P1) - The "Silent Failures"

### 3.1. Build & Linting Safety Disabled
**Location:** `next.config.mjs`
**Description:**
Configuration explicitly ignores errors via `ignoreDuringBuilds: true`.
**Impact:**
Critical security linting errors (like `dangerouslySetInnerHTML`) are ignored during deployment, creating a "Blind Spot" where vulnerabilities ship to production unknowingly.

### 3.2. Missing Security Headers
**Location:** `middleware.ts`
**Description:**
No standard HTTP security headers (CSP, HSTS, X-Frame-Options) are configured.
**Impact:**
Susceptibility to Clickjacking, XSS, and MIME Sniffing attacks.

---

## 4. Medium Risk Findings (P2)

### 4.1. Mixed Dependency Management
**Location:** Root (`package-lock.json` + `pnpm-lock.yaml`)
**Impact:** Developers/CI using different dependency trees leads to unverified code running in production.

### 4.2. Bleeding Edge Versions
**Location:** `package.json` (`"react-toastify": "latest"`, etc.)
**Impact:** High supply chain risk. One malicious upstream update immediately compromises the app.

---

## 5. Strategic Gap Analysis: Road to Leaderboard

To move from "Functional" to "World-Class", Nido must shift from **manual discipline** to **automated assurance**.

| Domain | Current State (Ad-hoc) | Leaderboard State (Automated) | Gap Severity |
|--------|------------------------|-------------------------------|--------------|
| **CI/CD Security** | None. Manual deploys. | GitHub Actions block deploys on vulnerability/lint failure. | **CRITICAL** |
| **Audit Logging** | Console only. | Tamper-proof logs of WHO did WHAT to WHOM in DB. | **CRITICAL** |
| **Observability** | Basic PostHog. | Real-time Sentry alerts for runtime exceptions. | **HIGH** |
| **Secret Mgmt** | `.env.local` files. | Secret Ops (Doppler) + Rotation policies. | **HIGH** |
| **Testing** | Zero automated tests. | E2E Playwright Login/Critical flows running on PRs. | **HIGH** |

---

## 6. The "Leaderboard" Implementation Roadmap

**Phase 1: Emergency & Foundation (Week 1)**
1.  [ ] **Fix P0 API:** Add auth guard to `app/api/link-resident/route.ts`.
2.  [ ] **Enable Safety:** Remove ignore flags in `next.config.mjs`.
3.  [ ] **CI/CD Setup:** Create `.github/workflows/ci.yml` to run Lint/Build/Security on every PR.
    *   *Why:* This is the highest leverage move. It prevents future regressions.

**Phase 2: Observability & Integrity (Week 2)**
1.  [ ] **Sentry:** Install `@sentry/nextjs` for real-time error tracking.
2.  [ ] **Audit Logging:** Create `audit_logs` table (immutable) and instrument key actions (`createFamily`, `deleteUser`).
    *   *Why:* "Defense in Depth" requires knowing when an attack is happening.

**Phase 3: Scale & Verification (Month 1)**
1.  [ ] **Automated Tests:** Write 1 E2E Playwright test for the critical flow (Login -> Dashboard).
2.  [ ] **Secret Ops:** Move from `.env` files to Vercel/Doppler managed secrets.
3.  [ ] **External Audit:** Prepare for a formal pen-test.

---

## 7. Known Issues (Previous Penetration Audit)
*   Recall: Infinite Supply Exploit (P0), Inventory Race Condition (P0), Stored XSS (P0), Public Documents Bucket (P0).
