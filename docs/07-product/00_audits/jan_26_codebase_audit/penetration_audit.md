# Penetration Audit Report
**Date:** January 26, 2025
**Auditor:** Antigravity (Google Deepmind)
**Scope:** Full Codebase (Frontend, Backend, Database, Business Logic)

## 1. Executive Summary

The penetration audit of the `v0-community-app-project` has identified **multiple Critical (P0)** vulnerabilities that pose immediate risks to data integrity, user privacy, and system availability.

**Overall Health Grade:** **F (Critical Logic Flaws & Vulnerabilities)**
*   **Security Score:** 20/100
*   **Critical Issues (P0):** 5
*   **High Issues (P1):** 3
*   **Medium Issues (P2):** 2

**Top Risks:**
1.  **Infinite Supply Exploit:** Users can generate infinite inventory of non-returnable items due to flawed transaction logic.
2.  **Stored XSS Chain:** Unsanitized user inputs in descriptions allow execution of malicious scripts.
3.  **Data Exposure:** RLS disabled on `reservations`, public storage buckets, and PII leaks in API responses.

---

## 2. Critical Findings (P0) - Immediate Action Required

### 2.1. Infinite Supply Exploit (Business Logic)
**Location:** `app/actions/exchange-transactions.ts` (`markItemPickedUp`)
**Description:**
The `markItemPickedUp` function incorrectly restores the `available_quantity` of a listing for "non-returnable" categories (e.g., Food & Produce) immediately after pickup usage.
**Impact:**
A user can list 1 item, have it "picked up" by a neighbor, and the system automatically restores the stock to 1. This allows the item to be "given away" infinitely, breaking the economy and trust model.
**Remediation:**
*   **Fix Logic:** Do NOT restore quantity for non-returnable items upon pickup. The quantity decrement at confirmation should be final.
*   **Audit Data:** Check `exchange_listings` for items with suspiciously high transaction counts relative to initial stock.

### 2.2. Inventory Race Condition
**Location:** `app/actions/exchange-listings.ts` (`confirmBorrowRequest`)
**Description:**
The `confirmBorrowRequest` function performs a `SELECT` followed by an `UPDATE` to decrement inventory. This non-atomic operation is vulnerable to race conditions where two simultaneous requests can both be confirmed for the last available item, potentially driving inventory negative (or failing later).
**Impact:**
Overselling of items, negative inventory states, and user frustration.
**Remediation:**
*   **Atomic Update:** Use a SQL RPC or an atomic decrement query (e.g., `available_quantity = available_quantity - quantity`) in the `UPDATE` statement, coupled with a `check` constraint or `where` clause (`available_quantity >= quantity`).

### 2.3. Stored Cross-Site Scripting (XSS)
**Locations:**
*   `app/actions/events.ts` (`createEvent`)
*   `app/actions/exchange-listings.ts` (`createExchangeListing`)
*   `components/ecovilla/dashboard/PriorityFeed.tsx`
*   `components/exchange/exchange-listing-detail-modal.tsx`
**Description:**
Server actions accept `description` strings without sanitization. These strings are then rendered using `dangerouslySetInnerHTML` in client components.
**Impact:**
An attacker can inject malicious JavaScript (e.g., `<img src=x onerror=alert(1)>`) into an event or listing. When other users view the feed or listing, the script executes, potentially stealing sessions or performing actions on their behalf.
**Remediation:**
*   **Sanitize on Input/Output:** Use `isomorphic-dompurify` to sanitize HTML content before rendering or before saving.
*   **CSP:** Implement a Content Security Policy to restrict script execution sources.

### 2.4. Row Level Security (RLS) Bypass
**Location:** Database (`reservations` table)
**Description:**
The `reservations` table has RLS explicitly disabled (`rowsecurity = false`).
**Impact:**
Any authenticated user can query *all* reservations in the system, viewing private booking details of other neighbors.
**Remediation:**
*   **Enable RLS:** `ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;`
*   **Add Policy:** Create policies restricting view access to the tenant AND (the specific user creating/owning the reservation OR the tenant admin).

### 2.5. Public Document Exposure
**Location:** Supabase Storage (`documents` bucket)
**Description:**
The `documents` storage bucket is configured as "Public".
**Impact:**
Any file uploaded to this bucket uses a predictable URL pattern. Anyone with the URL (or guessing it) can access private resident documents (leases, IDs, etc.) without authentication.
**Remediation:**
*   **Make Private:** specific buckets containing sensitive data must be private.
*   **Signed URLs:** Use Supabase Signed URLs for time-limited, authorized access to these files.

---

## 3. High Risk Findings (P1)

### 3.1. PII exposure in API Responses
**Location:** `lib/data/exchange.ts`, `app/actions/exchange-listings.ts`
**Description:**
The `enrichWithCreator` function joins the `users` table and selects sensitive fields: `email` and `phone`. This data is passed to the frontend for any user viewing a listing.
**Impact:**
Mass scraping of resident contact information by any authenticated user.
**Remediation:**
*   **Limit Fields:** Only select `first_name`, `last_name`, and `profile_picture_url`.
*   **Conditional Access:** Only expose contact info *after* a transaction is confirmed.

### 3.2. Supply Chain Vulnerability (Bleeding Edge Versions)
**Location:** `package.json`
**Description:**
Many critical dependencies (e.g., `@supabase/supabase-js`, `react-toastify`) are set to `"latest"`.
**Impact:**
Highly susceptible to supply chain attacks (malicious updates) or breaking changes that could crash the production app unexpectedly.
**Remediation:**
*   **Pin Versions:** Lock all dependencies to specific versions (e.g., `2.45.0` instead of `latest`).
*   **Use Lockfile:** Ensure `package-lock.json` or `bun.lockb` is committed and used in CI/CD.

### 3.3. Permissive Event Creation Policy
**Location:** `scripts/events/10_create_rls_policies.sql`
**Description:**
"Residents can create events" policy allows any user to create "published" events with "community" visibility immediately.
**Impact:**
Risk of spam, phishing, or inappropriate content being blasted to the entire community without moderation.
**Remediation:**
*   **Draft by Default:** Force new events to `status = 'draft'` or `status = 'pending_approval'`.
*   **Rate Limiting:** Limit number of events created per user per hour.

---

## 4. Medium Risk Findings (P2)

### 4.1. Sensitive Data in Server Logs
**Location:** `app/api/dashboard/priority/route.ts` (and others)
**Description:**
`console.error(error)` logs the full error object.
**Impact:**
Potential leak of database connection strings, query parameters, or internal paths into server logs (which might be accessible to devs or third-party logging services).
**Remediation:**
*   **Sanitize Logs:** Log only the error message or a generic code. Avoid dumping full objects.

### 4.2. Lack of API Rate Limiting
**Location:** All API Routes (`app/api/*`)
**Description:**
No rate limiting middleware or logic is implemented, despite `@upstash/ratelimit` being in `package.json`.
**Impact:**
Vulnerable to Denial of Service (DoS) or brute-force attacks against specific endpoints.
**Remediation:**
*   **Implement Ratelimit:** Use `@upstash/ratelimit` in a middleware or per-route wrapper.

---

## 5. Remediation Roadmap

**Phase 1: Emergency Fixes (Today)**
1.  [ ] **Fix Infinite Supply:** Update `markItemPickedUp` in `app/actions/exchange-transactions.ts` to remove quantity restoration for non-returnables.
2.  [ ] **Enable RLS:** Enable RLS on `reservations` table and add restrictive policies.
3.  [ ] **Sanitize XSS:** Install `isomorphic-dompurify` and sanitize descriptions in `PriorityFeed.tsx` and `exchange-listing-detail-modal.tsx`.
4.  [ ] **Secure Storage:** Change `documents` bucket to Private.

**Phase 2: Hardening (This Week)**
1.  [ ] **Fix Race Condition:** Refactor `confirmBorrowRequest` to use robust atomic updates.
2.  [ ] **Remove PII:** Update `lib/data/exchange.ts` to exclude `email` and `phone` from default fetch.
3.  [ ] **Pin Dependencies:** Update `package.json` to replace `latest` with actual versions.

**Phase 3: Systematic Improvements (Next Sprint)**
1.  [ ] **Rate Limiting:** Implement global API rate limiting.
2.  [ ] **Logging Wrapper:** Create a safe logger utility that sanitizes inputs.
