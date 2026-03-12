---
description: Review and enrich a draft issue with security, testing, performance, and documentation analysis.
---

# /review - Expert Requirement Enrichment

$ARGUMENTS

---

## Purpose

Activation of **REVIEW MODE** for deep analysis and enrichment of "In Review" draft issues.

**Goal**: Transform a draft issue into a "Ready for Development" specification with complete context, security, testing, performance, and documentation plans.

## CRITICAL PROTOCOL: SEQUENTIAL PIPELINE

> 🛑 **PIPELINE INTEGRITY**: The output of each phase is the INPUT for the next, don't optimize for speed. Create a temporary review handoff log to ensure these hand-offs from agent to agent.
> *   You MUST output a **Handoff Log** between each phase.
> *   **Task Tracking**: Call `task_boundary` at the start of each phase: `TaskName="Review Pipeline: Phase X - [Name]"`.
> *   **Validation**: Verify file writes before proceeding.

---

## Behavior

When `/review` is triggered, follow this **6-Phase Pipeline**:

### Phase 0: Context Gathering (Retrieval, Map & History)
> **Agents**: `product-manager`, `explorer-agent`, `code-archaeologist`

1.  **Issue Retrieval (Product Manager)**:
    *   **Action**: Use `github_get_issue` (GitHub MCP) to fetch issue details.
    *   **Fallback**: If fails, use `open_browser` to go to the specific issue URL.
    *   **Action**: Extract details + requirement doc references.
    *   **Output**: Create/Append to artifact with **"Phase 0: Issue Details"**.
    *   **Internal Handoff**: `→ Handing off to Explorer Agent...`
2.  **Explorer Map**:
    *   **Action**: `explorer-agent` maps the dependency graph and impacted files for the requirement.
    *   **Output**: Append **"Phase 0: Impact Map"** to the artifact.
    *   **Internal Handoff**: `→ Handing off to Code Archaeologist...`
3.  **Historical Dig (Code Archaeologist)**:
    *   **Goal**: robustly identify recent changes and regressions.
    *   **Action**: Use `github_list_commits` (GitHub MCP) on the impacted files found in step 2.
    *   **Fallback**: Use `run_command` with `git log -n 5 -- [file]` only if MCP fails.
    *   **Output**: Append **"Phase 0: Historical Context"** to the artifact.
    *   **Artifact Setup**: Locate the linked `requirements_*.md` file. **This file is the Target Artifact**. Append a new top-level header `## 8. Technical Review` to it. All subsequent phases will write to this section.
4.  **Handoff**: `🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...`

### Phase 1: Vibe & Security Audit
> **Agent**: `security-auditor`

1.  **Vibe Check**: Apply `vibe-code-check` principles (Backend-First, Zero Policy RLS).
2.  **Attack Surface**: Analyze the "Impact Map" from Phase 0, but **verification is mandatory**. Do not trust the map blindly; perform independent research to identify hidden vectors.
3.  **Output**: Append **"Phase 1: Security Audit"** to the artifact.
4.  **Handoff**: `🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...`

### Phase 2: Test Strategy
> **Agent**: `test-engineer`

1.  **Sad Paths**: specific "sad path" scenarios (e.g., offline, emojis, bad input).
2.  **Test Plan**: Define Unit, Integration, and E2E tests required.
3.  **Output**: Append **"Phase 2: Test Plan"** to the artifact.
4.  **Handoff**: `🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...`

### Phase 3: Performance Assessment
> **Agent**: `performance-optimizer`

1.  **Schema Static Analysis**: Read `db/schema.ts` to identify new tables, indexes, or potential N+1 bottlenecks.
2.  **Live Introspection (Optional)**: If `supabase_list_projects` is available, verify table sizes on `nido.prod` (Ref: `csatxwfaliwlwzrkvyju`) to estimate query impact for large tables.
3.  **Output**: Append **"Phase 3: Performance Review"** to the artifact.
4.  **Handoff**: `🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...`

### Phase 4: Documentation Logic
> **Agent**: `documentation-writer`

**Mandatory Audit**: Loop through ALL documentation categories for relevance:

1.  **User Manuals (`docs/01-manuals/`)**:
    *   *Check*: Does this change UI or user workflows?
    *   *Action*: Update `admin-guide/` or `resident-guide/`.
2.  **Analytics (`docs/02-technical/analytics/`)**:
    *   *Check*: New events/metrics? Action: Update `analytics-events.md`.
3.  **API (`docs/02-technical/api/`)**:
    *   *Check*: New endpoints? Action: Update `api-reference.md`.
4.  **Architecture (`docs/02-technical/architecture/`)**:
    *   *Check*: New System/Domain? Action: Create `domains/[domain].md`.
5.  **Flows (`docs/02-technical/flows/`)**:
    *   *Check*: Business logic change? Action: Update diagrams.
6.  **Infrastructure (`docs/02-technical/infrastructure/`)**:
    *   *Check*: Env vars/services? Action: Update setup docs.
7.  **Schema (`docs/02-technical/schema/`)**:
    *   *Check*: DB changes?
        *   **Tables**: Update `tables/[table].md`.
        *   **Policies (RLS)**: **MANDATORY**: Update `policies/[table].md` with the RLS rules in plain English.

**Output**:
1.  Append new documentation needs as **"Phase 4: Documentation Plan"** to the artifact, and listing specific missing files around related features which should exist already to docs/documentation_gaps.md.

### 🛑 GAP LOGGING (CRITICAL)

> [!IMPORTANT]
> **Gap Logging**: Append any critical missing documentation (e.g., missing Domain/Schema docs) to `docs/documentation_gaps.md` using the format: `- **YYYY-MM-DD**: [Description]`.

4.  **Handoff**: `🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...`

### Phase 5: Strategic Alignment & Decision
> **Agents**: `product-manager`, `product-owner`

1.  **Context (Product Manager)**:
    *   **Tool**: `open_browser` -> `https://github.com/users/mjcr88/projects/1/views/6?sortedBy%5Bdirection%5D=asc&sortedBy%5BcolumnId%5D=Status`
    *   **Action**: Scan "In Progress", "In Review", "Ready for development", "Backlog" "Todo" columns for conflicts.
    *   **Internal Handoff**: `→ Handing off to Product Owner...`
2.  **Decision (Product Owner)**:
    *   **Review**: Analyze Phase 0-4 outputs + PM Context.
    *   **Sizing**: Estimate Sprint sizing (XS-XL).
    *   **Decision**: Recommendation to "Prioritize" (Ready for Dev) or "Backlog".
3.  **Execution**:
    *   **Convert & Status (Browser)**:
        *   If "Prioritize": Use `browser_subagent` to Navigate to the Project Item -> Click "Convert to Issue" -> Select Repo -> Set Status to "Ready for development". capture the new Issue Number.
        *   If "Backlog": Use `browser_subagent` to Set Status to "Backlog" (no need to convert yet).
    *   **Update Req Doc**: **MANDATORY**: Update the original Requirement Document to link to the *newly created Issue URL* (replace the draft item link).
    *   **Comment (MCP)**: Use `add_issue_comment` (GitHub MCP) to post the "Technical Review Summary" and "Definition of Done" checklist to the new Issue.
4.  **Completion**: `✅ [REVIEW COMPLETE] Issue [NAME] is now [STATUS].`

---

## Key Principles

- **Context First**: Technicians (Phase 1-3) rely on the Map (Phase 0).
- **Security Logic**: `vibe-code-check` is NOT optional.
- **Product Reality**: PM checks the *actual* board, not just the plan.