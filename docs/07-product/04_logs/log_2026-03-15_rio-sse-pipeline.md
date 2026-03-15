# Build Log: Río S0.3: Validate SSE pipeline Railway → Vercel BFF → Browser
**Issue:** #168 | **Date:** 2026-03-15 | **Status:** Finished

## Context
- **PRD Link**: [Phase 3 roadmap in blueprint_rio_agent.md](../01_idea/blueprint_rio_agent.md)
- **Req Link**: N/A (Technical spike in Epic #158)
- **Board Status**: Issue moved to In Progress
- **Patterns**: Reviewed `fail-fast` initialization and PaaS var collisions from Issue #167 in `nido_patterns.md`.

## Clarifications (Socratic Gate)
- **Testing Surface**: Test UI will be placed at `/t/rio-sse-test/page.tsx` as a temporary playground.
- **Authentication**: Implementing full Supabase auth check in the BFF using our standard Server Client to ensure tenant isolation. The BFF extracts `tenantId` securely.
- **Stream Transformation**: Will use Mastra's `@mastra/ai-sdk` utility `toAISdkStream()` inside the BFF to map tokens.

## Progress Log
- 2026-03-15: Verified token-by-token streaming, English response enforcement, and session memory persistence.

## Handovers
- 🔁 **[PHASE 1 COMPLETE]** Research done & scope confirmed. Handing off to Implementation...
- 🛂 **[AGENT HANDOFF: Orchestrator → Backend Specialist]** `backend-specialist` built the `app/api/v1/ai/chat/route.ts` BFF route featuring Supabase Server Client Auth for tenant isolation. We skipped `@mastra/ai-sdk` (not installed) and wrote a custom TransformStream to format SSE chunks as Vercel AI SDK expects (`0:"message"`).
- 🛂 **[AGENT HANDOFF: Backend Specialist → Frontend Specialist]** `frontend-specialist` built `app/t/rio-sse-test/page.tsx` utilizing `@ai-sdk/react` `useChat` hooked into `/api/v1/ai/chat`. Included tenant testing input field and UI tailored to handle streaming correctly.
- ✅ **[PHASE 5 COMPLETE]** Feature implemented, verified, and documented. Ready for QA.
- 🛠️ **[PR FEEDBACK FIXES]** Addressed feedback from PR #222 review:
    - **Memory Isolation**: Implemented `threadId` forwarding in BFF and enforced it in the Agent to ensure conversation context isolation.
    - **Request Robustness**: Added 30s timeout with `AbortController` and 504 Gateway Timeout handling in the BFF.
    - **Frontend Polish**: Integrated stable `threadId` in `page.tsx`, removed debug logs, and fixed duplicate text rendering logic.
    - **RLS Hardening**: Fixed a critical "Cardinal Sin" by enabling RLS on all 27 Mastra tables. Patched it with a database trigger that extracts identity from session variables/metadata to ensure tenant isolation. Verified that message-save failures were caused by trigger-metadata mismatch in Mastra 1.x.

## Blockers & Errors
- `TypeError: append is not a function`: Fixed by using `sendMessage` in `@ai-sdk/react` v3.x.
- `AI_UIMessageStreamError`: Fixed by implementing a specific `text-start` and `text-delta` JSON envelope in the BFF proxy.
- Mastra v1.x breaking changes: Fixed by migrating from positional message arguments to a nested `memory` object config and using `.textStream` property.

## Decisions
- Custom TransformStream: Decided against installing more dependencies (`@mastra/ai-sdk`) to maintain a lean BFF. Wrote a standard `TransformStream` to map tokens.
- Native Mastra Server: Utilized the `registerApiRoute` patterns to move away from legacy Fastify routes.

## Lessons Learned
- Always check the internal Zod schema (`uiMessageChunkSchema`) of the Vercel AI SDK when writing custom proxy routes; it expects specific event sequences (`text-start` -> `text-delta`).
- Mastra v1.x `stream()` returns an object with nested streams; direct iteration is no longer the standard for text-only proxying.

## 📋 QA Findings: Issue #168 Review
### Phase 0-1: Alignment & Readiness
- **PRD Alignment**: [Pass] Features align with the Technical Spike PRD.
- **Git Strategy**: [Pass] Correct branch hierarchy used.
- **Test Readiness**: [Pass/Partial] Test page verified; automated E2E gap noted for future sprints.

### Phase 2: Specialized Audit
- **Security Check**:
    - [FAIL] **"Cardinal Sin"**: `mastra_*` tables on `nido.dev` have `rowsecurity: false` (RLS disabled).
    - [PASS] BFF correctly enforces Supabase Auth for Railway agent proxy.
    - [PASS] No leaked secrets in client-side code.
- **Vibe Code Check**: [FAIL] due to the RLS policy gap mentioned above.
- **Performance**: [Pass] Minimal overhead in BFF transformation stream.

### Phase 3: Documentation & Release Planning
- **Doc Gaps**:
    - Missing `rio-agent/overview.md`.
    - Missing API reference for `/health` and `POST /api/chat`.
- **Release Strategy**: Ready for merge once RLS policy status is clarified/addressed.
