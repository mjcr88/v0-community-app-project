---
description: QA workflow
---

---
description: Run Quality Assurance (Tests, Audits, Release) for a feature loop
---

# /run_qa - Quality Assurance & Release

$ARGUMENTS

---

## Purpose

Activation of **QA MODE** for "Ready for QA" issues.
**Goal**: Transform a "Ready for QA" issue into a "Done" feature by validating the Vercel Preview, enforcing strict quality gates, and merging to production.

## CRITICAL PROTOCOL: SEQUENTIAL PIPELINE

> 🛑 **PIPELINE INTEGRITY**: Validation is a rigid process. Do not skip steps.
> *   **Task Tracking**: Call `task_boundary` at the start of each phase.
> *   **Log Target Identity**: The "Worklog" is the **ACTIVE FEATURE LOG** (e.g., `docs/07-product/04_logs/log_YYYY-MM-DD_feature-name.md`). **DO NOT create a separate `qa_worklog.md`**. If no log exists, create one using the standard template.
> *   **Immediate Logging**: Findings (CodeRabbit, Audit, Limits) must be logged to the **Worklog** *immediately* when found. Do not wait for a summary phase. Use the headers defined below.

---

## Behavior

When `/run_qa` (or `/qa`) is triggered, follow this **Strategy-First Pipeline**:

### PART 1: AUDIT & STRATEGY (The "Gather" Phase)
*Gather all facts before taking action.*

#### Phase 0: Activation & Code Analysis
> **Agents**: `devops-engineer`, `orchestrator`
3.  **Issue Cross-Check**:
    *   **Action**: Search for "Ready for Development" or "In Progress" issues similar to findings.
    *   **Log**: Note if any finding is already covered by an existing issue (e.g., "PII leak covered by #75").
2.  **Deep Review Scan (CodeRabbit)**:
    *   **Action**: Use `mcp_github_pull_request_read(method="get_review_comments")` to fetch line-level feedback.
    *   **Action**: Use `mcp_github_pull_request_read(method="get_reviews")` to check for high-level summaries.
    *   **Log**: summarizing ALL critical/high-severity findings into the Worklog immediately.

#### Phase 1: Test Readiness Audit
> **Agent**: `qa-automation-engineer`
1.  **Context**: Read PRD & Implementation Plan.
2.  **Gap Analysis**:
    *   Do E2E tests exist?
    *   Are new tests needed?
    *   **Log**: Append the following to the Worklog:
        ```markdown
        ### Phase 1: Test Readiness Audit
        - **E2E Tests**: [Yes/No] (Path: ...)
        - **Unit Tests**: [Yes/No] (Path: ...)
        - **Coverage Gaps**: [List gaps]
        ```

#### Phase 2: Specialized Audit
> **Agents**: `security-auditor`, `performance-optimizer`
1.  **Security**: Run `vulnerability-scanner`. Check RLS policies.
    *   **Log**: Append "Security Findings" to Worklog.
2.  **Performance**: Check Bundle Size.
    *   **Log**: Append "Performance Stats" to Worklog.

#### Phase 3: Documentation & Release Planning
> **Agent**: `documentation-writer`
1.  **Doc Audit**: Compare Code vs Docs. Identify gaps.
2.  **Draft Release Notes**:
    *   **Action**: Draft a "Release Note" entry for the PRD (see Template below).
    *   **Style**: User-facing, exciting, emoji-rich (🚀, 🤝, 📱).
3.  **Log**: Append "Proposed Doc Plan & Release Note" to Worklog.

---

### PART 2: STRATEGY GATE (User Review)
> **Tool**: `notify_user`

#### Phase 4: Strategy Review
1.  **Present Findings**:
    *   CodeRabbit Summary (Phase 0)
    *   Test Gaps (Phase 1)
    *   Security/Perf Risks (Phase 2)
    *   Proposed Doc Plan (Phase 3)
2.  **Ask**:
    *   "What should be fixed vs. ignored?"
    *   "Do you approve the Test Plan?"
    *   "Do you approve the Release Note draft?"
3.  **Gate**: Wait for User direction.

---

### PART 3: EXECUTION & RELEASE (The "Do" Phase)
*Execute the strategy agreed upon in Phase 4.*

#### Phase 5: Test Creation & Execution
> **Agent**: `qa-automation-engineer`
1.  **Creation**: Write missing tests (if approved in Phase 4).
2.  **Execution**: Run suite against **Vercel Preview URL**.
3.  **Visual Check**: Verify "Vibe" manually.

#### Phase 6: The Fix Loop (Conditional)
> **Agents**: *Original Specialists*
*Triggered if Phase 5 fails OR User requested fixes in Phase 4.*
1.  **Fix**: Specialist applies fixes (Logic, Security, Tests).
2.  **Deploy**: Wait for Vercel (Green).
3.  **Loop**: Re-run Phase 5 until PASS.

#### Phase 7: Documentation Finalization
> **Agent**: `documentation-writer`
1.  **Apply Docs**: Update Manuals/Technical docs.
2.  **Release Notes**:
    *   **Action**: Append the approved Release Note to the **PRD** section `## Release Notes`.
    *   *Note*: If multiple features are in this sprint, append to the running list.

#### Phase 8: Merge & Close
> **Agent**: `devops-engineer`
1.  **Merge**: Squash & Merge PR.
2.  **Close Issue**: Move to "Done".
3.  **Completion**: `✅ [QA COMPLETE] Feature is Live.`

---

## Templates

### Release Note Style (For PRD)
```markdown
### Release Notes (Draft)
🚀 **[Feature Name]**
[One-line generic value prop]

[Emoji] **[Feature/Section]**
[Description of change]

[Emoji] **[Fix/Polish]**
[Description of fix]
```
