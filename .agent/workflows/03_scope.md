---
description: Transform "Ready for Development" issues into a concrete Implementation Strategy, Git Plan, and Sprint Scope.
---

# /scope - Sprint & Implementation Planning

$ARGUMENTS

---

## Purpose

Activation of **SCOPING MODE** for "Ready for Development" issues.
**Goal**: Transform prioritized issues into **PRD(s) (Implementation Plans)** for the sprint, with clear technical breakdown, git strategy, and agent assignments.
**Scope**: If the scope is too large for one sprint, multiple PRDs may be created.

## CRITICAL PROTOCOL: SEQUENTIAL EXECUTION

> 🛑 **SEQUENTIAL LOCKING**: The output of each phase is the INPUT for the next.
> *   You MUST output a **Handoff Log** between each phase.
> *   **Task Tracking**: Call `task_boundary` at the start of each phase: `TaskName="Scoping: Phase X - [Name]"`.
> *   **Verification**: Phase 1 requires explicit USER CONFIRMATION before proceeding.

---

## Behavior

When `/scope` (or `/sprint-plan`) is triggered, follow this **4-Phase Process**:

### Phase 1: Context, Clarification & Selection
> **Agents**: `product-manager` (Context), `product-owner` (Scoping)

1.  **Context Gathering (Product Manager)**:
    *   **Tool**: Use `browser_tools` to navigate to **[https://github.com/users/mjcr88/projects/1/views/7](https://github.com/users/mjcr88/projects/1/views/7)**.
    *   **Action**: Review all "Ready for Development" issues relevant to the current request.
    *   **Capture**: Memorize relevant issue details (Numbers, Titles, Labels, Priorities).
    *   **Enrich**: Once identified, use `mcp_github-mcp-server` tools (e.g., `get_issue`) to fetch full descriptions and comments.
    *   **Clarification**: Ask the User specific clarifying questions for potential candidates.
        *   *Topics*: Data requirements, missing links, credentials, specific logic, ordering/dependencies.
    *   **Log**: "Phase 1A: Context & Clarification Complete".
2.  **Selection & Prioritization (Product Owner)**:
    *   **Action**: Select the specific issues for this sprint.
    *   **Reasoning**: Explicitly state WHY each issue is selected (e.g., "Unlocks dependency X", "User priority").
    *   **Sizing Check**: If the selection is too large, recommend splitting into multiple sprints/PRDs.
    *   **⚠️ Sizing Estimates (MANDATORY)**:
        *   Convert T-shirt sizes (XS/S/M/L/XL) into **hour ranges**:
            | Size | Hours | Points |
            |------|-------|--------|
            | XS | 2-4h | 1 |
            | S | 4-8h | 2 |
            | M | 1-2d | 3-5 |
            | L | 2-4d | 8 |
            | XL | 5+d | 13+ |
        *   Include these estimates in the PRD for capacity planning.
    *   **⚠️ Complexity Risk Flagging**:
        *   If an issue touches core infrastructure (auth, middleware, DB schema), flag it as **HIGH RISK**.
        *   Recommend pairing or senior review for HIGH RISK items.
    *   **Log**: "Phase 1B: Selection Complete".
3.  **User Confirmation Gate (CRITICAL)**:
    *   **Action**: Present the `Selected Issues`, `Reasoning`, and `Sizing Estimates` to the user.
    *   **STOP**: Do NOT proceed to Phase 2 until the user reviews and confirms the selection.

### Phase 2: Architecture, Git Strategy & Setup
> **Agents**: `orchestrator`, `devops-engineer`

1.  **PRD Setup (Orchestrator)**:
    *   **Create File**: `docs/07-product/03_prds/prd_YYYY-MM-DD_{sprint_name}.md`.
        *   *Note*: If multiple sprints/groups are needed, create multiple files.
    *   **Content**: Add standard header + the `Selected Issues` list from Phase 1.
2.  **DevOps Deep Dive (DevOps)**:
    *   **Tool**: Use `github-mcp-server` to inspect `main`, active branches, and PRs.
    *   **Git Strategy**: Define and **WRITE** the specific branching model into the PRD (Reviewer Section).
    *   **Pipeline Advice**: **WRITE** any CI/CD warnings or migration needs into the PRD.
3.  **Dependency Mapping (Orchestrator)**:
    *   **Analysis**: Check for Shared Infrastructure or Hard Dependencies.
    *   **Output**: **WRITE** findings to `## Architecture & Git Strategy` section of the PRD.
4.  **Handoff**: `→ Handing off to Project Planner...`

### Phase 3: PRD Creation (Implementation Plan)
> **Agents**: `project-planner` + Specialists (`backend-specialist`, `frontend-specialist`, etc.)

1.  **Delegation (Project Planner)**:
    *   **Input**: Read the PRD (now containing Arch/DevOps context).
    *   **Assign**: Identify the best Specialist Agent for each issue.
    *   **⚠️ Implementation Order (MANDATORY)**:
        *   Define the **suggested order** of implementation based on:
            1.  Security-critical issues first.
            2.  Quick wins (XS/S) for momentum.
            3.  Complex items last (can be parallelized if independent).
        *   Write this order explicitly in the PRD.
2.  **Breakdown (Specialists)**:
    *   Each agent contributes to the **Shared PRD**:
        *   **Reference**: Quote/Link specific sections from the Original Requirement File (MANDATORY).
        *   **Code Changes**: Specific files (`src/components/X.tsx`), Schema changes, API routes.
        *   **⚠️ Acceptance Criteria (MANDATORY)**:
            *   Write testable ACs using **Given/When/Then** or checklist format:
                ```
                - [ ] AC1: When [action], then [expected result].
                - [ ] AC2: Given [condition], when [action], then [expected result].
                ```
            *   Do NOT use vague descriptions like "Manual: Check the page".
        *   **Handovers (CRITICAL)**: Explicitly state inputs/outputs for other agents.
            *   *Example*: "Backend-Specialist will expose `POST /api/rsvp` returning `{ status: 'ok' }`. Frontend-Specialist waits for this endpoint before implementing the form."
        *   **⚠️ Rollback Strategy (For HIGH RISK items)**:
            *   If an issue is flagged as HIGH RISK (Phase 1), document a rollback plan:
                *   *Example*: "Revert commit X, clear cookies via hotfix, redeploy."
3.  **Review (Planner + PO)**:
    *   Review the combined plan for logic gaps.
    *   Verify strict handovers are defined.
    *   Verify Acceptance Criteria are testable.
4.  **⚠️ Definition of Done (MANDATORY)**:
    *   Include a **DoD Checklist** section in every PRD:
        ```markdown
        ## Definition of Done
        - [ ] Code passes `npm run lint` & `npx tsc --noEmit`
        - [ ] PR reviewed by at least 1 team member
        - [ ] Manual QA verification completed per ACs
        - [ ] No new P0 bugs introduced
        - [ ] Documentation updated (if applicable)
        ```
5.  **Handoff**: `→ Handing off to User for Sign-off...`

### Phase 4: Sign-off & Sprint Scheduling
> **Tools**: `notify_user`, `browser_subagent`

1.  **Present PRD**:
    *   Present the **Sprint PRD(s)** to the user.
    *   Highlight the **Implementation Order** and **Sizing Estimates**.
2.  **⚠️ Sprint Scheduling (MANDATORY)**:
    *   **Ask User**: "When should this sprint start?" (default: next business day).
    *   **Calculate Dates**: Based on sizing estimates, calculate sequential target dates:
        | Issue | Size | Est. Hours | Start Date | Target Date |
        |-------|------|------------|------------|-------------|
        | #1 | XS | 2-4h | User Date | Start + 1 day |
        | #2 | M | 1-2d | #1 End | Start + 2 days |
        *   **Parallel Work**: If issues are independent (no handover dependency), they can share the same Start Date.
        *   **Buffer**: Add 1 day buffer between complex (M/L/XL) items.
    *   **Log Dates**: Document the calculated dates in the PRD under a new `## Sprint Schedule` section.
3.  **⚠️ Update Project Board (Browser Automation)**:
    *   **Tool**: Use `browser_subagent` to update GitHub Project fields.
    *   **⚠️ CALENDAR NAVIGATION RULES (CRITICAL)**:
        > GitHub's date picker opens to the CURRENT month. If the target date is in a FUTURE month, you MUST:
        > 1. Click the **FORWARD/RIGHT arrow** (→) to navigate to the target month
        > 2. Do NOT click the back arrow - that navigates to PAST months
        > 3. Verify the month/year header shows the correct month BEFORE clicking a day
        > 4. Click the specific DAY NUMBER to select the date
    *   **For Each Issue**:
        1.  Navigate to the project board: `https://github.com/users/mjcr88/projects/1/views/7`
        2.  Click on the issue row to open the sidebar.
        3.  Click the **Start date** field to open the calendar.
        4.  Navigate to the correct month using the FORWARD arrow if needed.
        5.  Click the specific day number to set the Start date.
        6.  Click the **Target date** field to open the calendar.
        7.  Navigate to the correct month using the FORWARD arrow if needed.
        8.  Click the specific day number to set the Target date.
        9.  Close the sidebar (click X or outside) before moving to next issue.
    *   **Verification**: After all issues, take a screenshot showing the updated dates.
    *   **Fallback**: If browser automation fails after 2 attempts, log the dates in the PRD and ask user to update manually.
4.  **Final Approval**:
    *   Ask for approval to proceed to **EXECUTION (Sprint Start)**.

---

## Global Rules & Constraints

> ⚠️ **MANDATORY ADHERENCE**: The following rules must be followed throughout the entire scoping process.

1.  **Strict Search Scope**:
    *   **Rule**: ALWAYS restrict GitHub searches to the `mjcr88` owner or `v0-community-app-project` repository.
    *   **Restriction**: NEVER perform global GitHub searches. Do NOT search other users' repositories.
    *   **Example Query**: `repo:mjcr88/v0-community-app-project is:issue ...`
2.  **Permissions Protocol**:
    *   **Rule**: If a tool (e.g., `list_projects`) fails due to permissions (403), IMMEDIATELY fallback to `browser_tools` or ask the user for guidance.
    *   **Restriction**: Do not retry the same failed tool call blindly.
3.  **Documentation First**:
    *   **Rule**: Verify all assumptions against `docs/` before making planning decisions.
    *   **Restriction**: Do not plan features that contradict existing ADRs or Architecture docs.

## Key Principles

- **Unified Truth**: The PRD in `docs/07-product/03_prds/` is the Bible for the sprint.
- **Traceability**: Every item in the PRD must trace back to an Original Requirement File.
- **Context Before Content**: DevOps/Arch findings MUST be in the document *before* specialists start planning.
- **Verification**: User must approve the SCOPE (Phase 1) before we plan the TECH (Phase 2/3).
