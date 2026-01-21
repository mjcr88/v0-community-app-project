# Database Audit Report (External Audit Ready)
> **Date:** January 19, 2026
> **Environment:** `nido.prod` (Supabase)
> **Auditor:** Database Architect

## 📊 Executive Summary
**Health Grade: C**
**Status:** ⚠️ **Vulnerable**

This expanded audit reveals a system that has good foundational intent (multi-tenancy is technically enforced in most places) but suffers from **significant implementation gaps**. We are currently failing "Secure by Default" in three critical categories: **Access Control (RLS)**, **Data Leakage (Storage/Views)**, and **Performance Hygiene (Indexes)**.

An external audit would flag us immediately for:
1.  **Publicly Accessible Sensitive Data**: `reservations` table and `documents` bucket.
2.  **Performance Time Bombs**: 23 Missing Indexes on Foreign Keys.
3.  **Privilege Escalation Risks**: `can_view_resident` is a complex `SECURITY DEFINER` function that could be exploited.

---

## 🚨 Critical Security Findings (P0) -- IMMEDIATE FIX REQUIRED

### 1. RLS Disabled on Core Tables
*   **Finding**: The following tables have RLS **completely disabled**:
    *   ❌ `reservations` (Contains user schedules/locations)
    *   ❌ `secrets` (Unknown content, but name implies high sensitivity)
    *   ❌ `subscription`
    *   ❌ `sql_features`, `sql_parts`, `sql_sizing` (Likely safe metadata, but violates policy)
*   **External Audit Risk**: **HIGH**. This is an automatic fail.
*   **Remediation**: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` immediately.

### 2. Public Storage Bucket (`documents`)
*   **Finding**: `documents` bucket is `public: true`. Policies allow `SELECT` for `role: public`.
*   **External Audit Risk**: **CRITICAL**. PII exposure (Leases, IDs).
*   **Remediation**: Make private. Restrict policy to `(bucket_id = 'documents' AND auth.uid() = created_by)`.

### 3. Insecure View (`active_check_ins`)
*   **Finding**: View created without `security_invoker = true`.
*   **External Audit Risk**: **HIGH**. Bypasses RLS of underlying `check_ins` table.
*   **Remediation**: Recreate view with `WITH (security_invoker = true)`.

### 4. Risky `SECURITY DEFINER` Function
*   **Finding**: `public.can_view_resident(target_user_id)` runs as Superuser (`SECURITY DEFINER`).
*   **Risk**: Logic leakage. If this function has a bug, any user can "view" any resident.
*   **Remediation**: Audit logic thoroughly. Ensure it cannot return true for cross-tenant ID guessing.

---

## 📉 Performance Debt (Scale Risks)

### ⚠️ Missing Foreign Key Indexes (23 Found)
An external audit would flag these as "Performance Risks". Cascading deletes will lock these tables, causing production outages under load.

**Top Priority Missing Indexes:**
1.  `auth.mfa_challenges(factor_id)`
2.  `notifications(actor_id)` (High churn table, critical for performance)
3.  `resident_requests(resolved_by)`
4.  `check_in_invites(created_by)`
5.  `documents(created_by)` & `documents(tenant_id)`

**Remediation**: Run the `create_missing_indexes.sql` script (generated below).

---

## 🧼 Code Hygiene & Integrity

### ✅ Good Practices
-   **Strict Tenancy**: Most functional tables correctly link to `tenants`.
-   **Type Safety**: No obvious `text` abuse for numbers/dates.
-   **Policies**: Most tables (40+) have RLS enabled.

### ⚠️ Debt
-   **Zod Missing**: Input validation in Server Actions is manual.
-   **Permissive Policies**: Many policies use `PERMISSIVE` (default). Review if `RESTRICTIVE` is needed for "Block Lists".
-   **Orphaned Functions**: Helper functions like `update_updated_at_column` are duplicated or not standardized across all tables.

---

## 🗓️ Comprehensive Remediation Plan

### Phase 1: Security Shield (Next 24h)
1.  [ ] **Enable RLS**: `reservations`, `secrets`, `subscription`.
2.  [ ] **Lock Storage**: `documents` bucket.
3.  [ ] **Patch View**: `active_check_ins`.

### Phase 2: Performance (This Week)
1.  [ ] **Index FKs**: Create indexes for `notifications`, `documents`, and `check_in_invites` FKs.
2.  [ ] **Audit `can_view_resident`**: Review logic for cross-tenant leaks.

### Phase 3: Architecture (Q1)
1.  [ ] **Zod Governance**: Enforce Zod in CI/CD pipeline for Actions.
2.  [ ] **PITR Verification**: Confirm Point-in-Time Recovery usage.

---

## 🧠 System Recommendations (Agents & Workflows)
To prevent regression, we recommend the following system updates:

### 1. Agent Rules (`database-architect`)
-   **Mandate "Secure by Default"**: Storage buckets must be `public: false` unless fully justified.
-   **View Security**: All views must use `security_invoker = true`.
-   **Performance**: All Foreign Keys must be indexed.

### 2. Skill Updates
-   **`clean-code`**: Explicitly enforce Zod for **all** Server Action arguments.
-   **`database-design`**: Add warning section about Supabase defaults (RLS off, Public buckets).

### 3. New Workflow: `/verify-security`
Implement a specialized workflow that automates the SQL checks used in this audit:
-   Check `pg_class` for tables with `rls_enabled = false`.
-   Check `pg_policies` for permissive/public access.
-   Check `pg_constraint` vs `pg_index` for missing FK indexes.

