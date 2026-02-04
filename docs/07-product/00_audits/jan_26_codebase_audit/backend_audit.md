# Backend Domain Audit Report
> **Date:** January 19, 2026
> **Environment:** Production (`nido.prod`) & Codebase
> **Auditor:** Backend Specialist

## 📊 Executive Summary
**Health Grade: B-**
The backend core supports multi-tenancy well, but critical security gaps in production configuration and a lack of standardized input validation pose significant risks. 

> **See [Database Audit Report](database_audit.md) for deep-dive on Schema & RLS.**

Immediate remediation is required for database security policies.

## 🚨 Critical Security Findings (P0)

### 1. `reservations` Table: RLS Disabled
*   **Status:** 🔴 **CRITICAL**
*   **Finding:** The `reservations` table has Row Level Security (RLS) explicitly disabled (`rowsecurity = false`) in `nido.prod`.
*   **Impact:** ALL reservation data is accessible to ANY authenticated user (or potentially anonymous users if table permissions allow) who bypasses the UI. This is a massive data leak vector.
*   **Remediation:** `ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;` and add tenant/owner isolation policies immediately.

### 2. `documents` Storage Bucket Public Access
*   **Status:** 🔴 **CRITICAL**
*   **Finding:** The `documents` storage bucket is configured as `public`. The RLS policy "Public Access Documents" allows unrestricted access.
*   **Impact:** Sensitive resident documents (leases, ID scans) are publicly accessible if the URL is known or guessed.
*   **Remediation:**
    *   Assess if documents *must* be public.
    *   If sensitive, make bucket Private and restrict `storage.objects` policies to authenticated tenant members only.

### 3. "Active Check-ins" View Security
*   **Status:** 🟠 **High Risk**
*   **Finding:** The `active_check_ins` view might not be enforcing `security_invoker = true`.
*   **Analysis:** If a view is created without `security_invoker = true`, it runs with the permissions of the view owner (usually postgres/admin), potentially bypassing the underlying `check_ins` table's RLS policies.
*   **Remediation:** Recreate the view with `WITH (security_invoker = true)`.

## ⚠️ High Priority Debt (P1)

### 4. Input Validation Gaps (No Zod)
*   **Status:** ⚠️ **High**
*   **Finding:** Server Actions (`events.ts`, `check-ins.ts`, `resident-requests.ts`) manually validate inputs (e.g., `if (!data.title)`).
*   **Impact:** Fragile security, potential for bad data/injection, and inconsistent error messages.
*   **Remediation:** **Zod Mandate**. All Server Actions must use Zod schemas for input validation.

### 5. Dev/Prod Parity
*   **Status:** ⚠️ **High**
*   **Finding:** `nido.dev` database is empty.
*   **Impact:** Updates are "tested in production" or not tested against realistic data schema.
*   **Remediation:** Sync Production schema to Development.

## 🔍 Detailed Domain Scan

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Auth** | ✅ Pass | Middleware & Server Actions correctly use `supabase.auth`. |
| **Multi-tenancy** | ✅ Pass | `tenant_id` consistently applied in Data Layer & API. |
| **Encryption** | ⚪ Unknown | Check if sensitive fields (PII) need pgcrypto. |
| **RPC Functions** | ⚠️ Warning | 14 functions use `SECURITY DEFINER`. Review required. |
| **API V1** | ⚠️ Early | Basic implementation. Needs Swagger/OpenAPI gen. |

## 🛠️ Remediation Roadmap

### Immediate (Next 24 Hours)
- [ ] **Fix RLS:** Enable RLS on `reservations` table.
- [ ] **Fix Storage:** Lock down `documents` bucket.
- [ ] **Secure View:** Recreate `active_check_ins` with `security_invoker = true`.

### Short Term (This Week)
- [ ] **Sync Dev DB:** Apply schema to `nido.dev`.
- [ ] **Zod Refactor:** Convert `events.ts`, `check-ins.ts`, and `resident-requests.ts` to use Zod.

### Strategic (Q1)
- [ ] **Security Workflow**: Create `/verify-security` workflow to automate RLS/View/Storage checks.
- [ ] **API Expansion**: Build out full V1 API with auto-docs.
- [ ] **Edge Functions**: Move heavy logic (e.g., stats aggregation) to Edge.
