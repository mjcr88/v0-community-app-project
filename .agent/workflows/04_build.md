---
description: Execute the build phase for a scoped issue. Includes implementation, verification, and work logging.
---

# /build - Issue Execution & Build

$ARGUMENTS

---

## Purpose

Activation of **BUILD MODE** for "Ready for Development" issues.
**Goal**: Transform a scoped issue into a "QA Ready" feature with passing tests, verified ACs, and complete documentation gaps.

## CRITICAL PROTOCOL: SEQUENTIAL EXECUTION

> 🛑 **SEQUENTIAL LOCKING**: You are **PROHIBITED** from executing multiple phases in a single tool call.
> *   You MUST output a **Handoff Log** between each phase.
> *   **Task Tracking**: Call `task_boundary` at the start of each phase: `TaskName="Build: Phase X - [Phase Name]"`.
> *   **Worklog as Truth**: All decisions, Q&A, and handovers must be logged in the issue's Worklog file.

---

## Behavior

When `/build` (or `/execute`) is triggered, follow this **6-Phase Process**:

### Phase 0: Context, Selection & Activation
> **Agents**: `product-manager`

1.  **PRD & Status Analysis**:
    *   **Action**: Ask the User for the target **Sprint PRD** (or find the active one).
    *   **Req Retrieval**: Locate the original requirement file in `docs/07-product/02_requirements`. Verify it matches the Issue and is referenced in the PRD.
    *   **Board Check**: Use `browser_subagent` to view **[https://github.com/users/mjcr88/projects/1/views/8](https://github.com/users/mjcr88/projects/1/views/8)**.
    *   **Analyze**:
        *   What is currently "In Progress"? (Prevent context switching/overload)
        *   What is "Ready for Development"?
        *   What is "QA"?
2.  **User Selection Gate (CRITICAL)**:
    *   **Action**: Present the findings (PRD, Req Doc, Board Status) to the User.
    *   **Ask**: "Based on the PRD and current Board Status, which issue should we build next and why?"
    *   **Wait**: Do NOT pick an issue automatically. Wait for User selection.
3.  **Activation**:
    *   **Constraint**: Once User selects the Issue, verify it matches the PRD scope.
    *   **Branch Validation**: `run_command` to check `git status`. Ensure clean state on `main` or correct feature branch.
    *   **Switch**: `git checkout -b feat/{issue_number}-{slug}`.
4.  **Status Update**:
    *   **Action**: Move the GitHub Issue to **"In Progress"** on the board.
5.  **Artifact Creation (Worklog)**:
    *   **Path**: `docs/07-product/04_logs/log_YYYY-MM-DD_{issue_slug}.md`.
    *   **Template**:
        ```markdown
        # Build Log: {Issue Title}
        **Issue:** #{number} | **Date:** {YYYY-MM-DD} | **Status:** In Progress
        
        ## Context
        - **PRD Link**: [Link]
        - **Req Link**: [Link to file in docs/07-product/02_requirements]
        - **Board Status**: [Snapshot of board at start]
        
        ## Clarifications (Socratic Gate)
        <!-- To be filled in Phase 1 -->
        
        ## Progress Log
        <!-- Timestamped entries of work -->
        
        ## Handovers
        <!-- Agent-to-Agent context transfers -->
        
        ## Blockers & Errors
        <!-- Issues encountered -->
        
        ## Decisions
        <!-- Technical decisions made -->
        
        ## Lessons Learned
        <!-- Candidates for nido_patterns.md -->
        ```
6.  **Pattern Reference (MANDATORY)**:
    *   **Action**: Read `docs/07-product/06_patterns/nido_patterns.md` and `lessons_learned.md`.
    *   **Log**: Note any relevant patterns in the Worklog `## Context` section.
7.  **Handoff**: `🔁 [PHASE 0 COMPLETE] Issue selected and context established. Handing off to Research...`

### Phase 1: Research & Socratic Gate
> **Agents**: Specialist (from PRD) or `orchestrator`

1.  **Deep Read**:
    *   Read the **PRD Implementation Section** for this issue.
    *   Read the **Original Requirements Doc** linked in the PRD.
    *   Read **Impacted Files** using `view_file` or `view_file_outline`.
2.  **🛑 Socratic Gate (MANDATORY)**:
    *   **Action**: The Agent MUST ask **minimum 2-3 clarifying questions**.
    *   **Topics**: Edge cases, assumptions, technical trade-offs, state management.
    *   **Constraint**: Do **NOT** write code until the User explicitly answers and confirms scope.
3.  **Log**: Record the Q&A in the Worklog `## Clarifications` section.
4.  **Handoff**: `🔁 [PHASE 1 COMPLETE] Research done & scope confirmed. Handing off to Implementation...`

### Phase 2: Implementation (Build Loop)
> **Agents**: Specialist(s) + `debugger` (if needed)

1.  **Git Safety**:
    *   **Action**: `git commit` frequently locally. Push to remote.
    *   **Draft PR**: Create a **Draft PR** early to capture the diff. Log PR link in Worklog.
2.  **Multi-Agent Coordination**:
    *   **Orchestrator**: Defines execution order (e.g., Backend → Frontend).
    *   **Handover**: Each agent writes to Worklog `## Handovers` before passing control.
3.  **Code Execution**:
    *   Implement changes per PRD.
    *   **Doc Gap Check**: If an undocumented feature is touched, append to `docs/documentation_gaps.md`.
4.  **Debugger Integration**:
    *   **Auto-Invoke**: If a tool fails (lint error, test failure) > 1 time, invoke `debugger` agent automatically.
    *   **Manual**: Specialist can call `debugger` for complex logic or root cause analysis.
5.  **Log**: Append timestamped updates to `## Progress Log`.
6.  **Handoff**: `🔁 [PHASE 2 COMPLETE] Code implemented. Handing off to Verification...`

### Phase 3: Verification Checkpoint
> **Agents**: Specialist + `qa-automation-engineer` (optional)

1.  **Automated Checks**:
    *   **Lint**: `npm run lint`
    *   **TypeCheck**: `npx tsc --noEmit`
    *   **Unit Tests**: `npm test` (or specific text run)
    *   **Action**: If ANY fail, **STOP** and return to Phase 2 (Fix).
2.  **Manual Verification**:
    *   **Action**: Walk through each **Acceptance Criteria (AC)** from the PRD.
    *   **Log**: Mark `[x]` in Worklog/PRD for each passed AC.
    *   **Evidence**: Capture screenshots/logs if verified via browser.
3.  **Handoff**: `🔁 [PHASE 3 COMPLETE] Verification passed. Handing off to User Approval...`

### Phase 4: User Approval Gate
> **Tool**: `notify_user`

1.  **Present to User**:
    *   Summary of implementation.
    *   List of Verified ACs.
    *   Link to **Draft PR** and **Worklog**.
2.  **User Action**:
    *   User tests changes locally or on Vercel Preview.
    *   **Gate**: Wait for explicit "Approved" or "Request Changes".
3.  **Branch**:
    *   **If Approved**: Proceed to Phase 5.
    *   **If Changes**: Return to Phase 2.

### Phase 5: Closeout & Transition
> **Agents**: `documentation-writer`, `orchestrator`

1.  **Documentation Gaps**:
    *   Final scan of `docs/`. Ensure all missing docs are logged in `docs/documentation_gaps.md`.
2.  **Lessons Learned**:
    *   Append any "Gotchas" or new Patternts to `docs/07-product/06_patterns/lessons_learned.md`.
    *   If reusable, suggest addition to `nido_patterns.md`.
3.  **PRD Update**:
    *   Mark ACs as `[x]` in the main PRD file.
    *   Add link to the Worklog.
    *   Add link to the PR/Commit.
4.  **GitHub Updates**:
    *   **Comment**: Post summary (Worklog link, PR link, QA notes) to the GitHub Issue.
    *   **Linked PR**: Use `update_project_item` or `update_issue` (or browser fallback) to Update the "Linked Pull Request" field (or description) with the Draft PR URL.
    *   **Status**: Move Issue to **"QA"** (or "Ready for QA").
    *   **PR**: Mark Draft PR as **"Ready for Review"**.
5.  **Completion**: `✅ [BUILD COMPLETE] Issue #{num} is ready for QA.`

---

## Key Principles

- **Worklog is King**: If it's not in the worklog, it didn't happen.
- **Visual Context**: Always check the Project Board (View 8) before starting.
- **Socratic First**: Never build without confirming "Why" and "How" first.
- **Pattern Compliance**: Ignorance of `nido_patterns.md` is not an excuse.
- **Draft PRs**: Visibility early (Draft), Review late (Phase 4).
- **Debugger Support**: Don't spin your wheels; call the expert.
