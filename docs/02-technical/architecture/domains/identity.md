# Identity & Authentication Domain

> **Domain Owner**: Backend Guard
> **Status**: Draft
> **Last Updated**: 2026-02-09

## Overview
This domain manages user identity, authentication, and session persistence. It leverages Supabase Auth for core identity management and custom middleware/server actions for session enforcement.

## Session Management

### 1. Idle Timeout (Auto Logout)
To enhance security on shared devices, the application enforces an automatic logout after a period of inactivity.

*   **Timeout Duration**: 2 Hours (Strict Mode)
*   **Mechanism**:
    *   **Strict Mode (Default)**: If "Remember Me" is NOT checked, the session is treated as ephemeral.
    *   **Trusted Mode**: If "Remember Me" IS checked, the session persists for 30 days.

### 2. Cookie Strategy
We use HTTP-Only cookies to manage session state securely and prevent client-side tampering.

| Cookie Name | Purpose | Expiry | Security |
| :--- | :--- | :--- | :--- |
| `remember-me` | Indicates a Trusted Device. Bypasses strict timeout. | 30 Days | HttpOnly, Secure, Lax |
| `last-active` | Tracks the timestamp of the last user request. | 2 Hours | HttpOnly, Secure, Lax |

### 3. Middleware Logic
The `middleware.ts` intercepts requests to protected routes:

1.  **Check `remember-me`**:
    *   If **Present**: Session is valid. Skip timeout checks.
    *   If **Absent**: Proceed to timeout validation.
2.  **Check `last-active`**:
    *   If **Expired (> 2h)** or **Missing**: Sign out the user (`supabase.auth.signOut()`) and redirect to Login with `?reason=timeout`.
    *   If **Valid**: Update `last-active` to current time (rolling session).

### 4. Implementation Details
*   **Server Action**: `setSessionPersistence(rememberMe: boolean)` in `app/actions/auth-actions.ts` handles setting/clearing cookies upon login.
*   **Client**: `login-form.tsx` captures user preference via a Checkbox and invokes the server action.

## Future Improvements
*   [ ] Implement specific "Session Expired" modal instead of generic redirect.
*   [ ] Add "Activity Logs" for users to see active sessions (Supabase supported).
