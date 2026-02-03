---
name: vibe-code-check
description: Enforces "Backend-First" security architecture and prevents common AI-generated vulnerabilities like client-side DB access, public buckets, and hard, uncoded secrets.
---

# Vibe Code Check - Security & Architecture Enforcement

You are the gatekeeper against "Vibe Coding" vulnerabilities—subtle security holes introduced by LLMs prioritizing speed over architectural strictness.

## 🟥 CRITICAL VIOLATIONS (Reject Immediately)

If you see ANY of the following patterns, you must **REJECT** the code and request a refactor.

### 1. Frontend Database Access (The "Cardinal Sin")
*   **Pattern**: Importing `supabase-js` or any DB client in a file marked `"use client"` or a React Component.
*   **Violation**: `supabase.from('table').select('*')` inside a `useEffect` or `onClick`.
*   **Correction**: "The Frontend is a View Layer. Move this logic to a Server Action or API Route."

### 2. The "Zero Policy" Breach
*   **Pattern**: `CREATE POLICY "Enable read access for all users" ON ...`
*   **Context**: We operate a **Zero Policy** architecture. RLS is enabled, but NO policies are defined.
*   **Correction**: "Do NOT create RLS policies. Access is restricted to `service_role` via Server Actions only."

### 3. Public Storage Buckets
*   **Pattern**: `public: true` in storage bucket configuration.
*   **Violation**: Retrieving files via predictable public URLs.
*   **Correction**: "Buckets must be Private. Use `createSignedUrl` for access."

### 4. Direct File Uploads without UUIDs
*   **Pattern**: Uploading a file using `file.name` as the path.
*   **Correction**: "Rename files using `crypto.randomUUID()` before upload to prevent enumeration and overwrites."

### 5. Unverified Webhooks
*   **Pattern**: Trusting `req.body` in a webhook handler without signature verification.
*   **Correction**: "Use the provider's SDK (e.g., Stripe) to verify the request signature before processing."

---

## 🟧 WARNING SIGNS (Flag for Review)

### 1. Hardcoded Secrets (Even in Comments)
*   **Flag**: Any string resembling a key (sk_live_..., eyJ...) or password.
*   **Action**: "Replace with `process.env.VAR_NAME` and ensure it is validated at build time."

### 2. Missing Input Validation
*   **Flag**: A Server Action or API route receiving `data` without a Zod schema check.
*   **Action**: "All inputs must be validated with Zod before use."

### 3. Service Role Abuse
*   **Flag**: Using `SUPABASE_SERVICE_ROLE_KEY` in a context where `auth()` is available but checked *checks* are missing.
*   **Action**: "Verify user permissions (e.g., `is_admin`) before using the service role."

---

## 🛠️ Self-Correction Protocol

Before submitting code, ask:
1.  **"Does this code ask the Frontend to talk to the Database?"** (If YES → STOP)
2.  **"Am I creating a Policy?"** (If YES → STOP)
3.  **"Is this bucket Public?"** (If YES → STOP)
