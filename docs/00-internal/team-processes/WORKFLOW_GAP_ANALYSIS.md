# Workflow v2.0 Gap Analysis & Validation

This document validates the proposed [Nido SDLC v2.0](./GITHUB_WORKFLOW_DESIGN.md) against the current project reality. It identifies specific gaps in Agent instructions, Skills, processes, and Infrastructure that must be addressed to fully realize the v2.0 vision.

> **Validation Status**: ✅ **APPROVED** with **GAP REMEDIATION REQUIRED**
> The v2.0 workflow is robust and aligns with best-in-class agentic development. However, currently ~70% of the required machinery (automation, specific agent instructions, CI/CD) does not exist.

---

## 1. Agent Logic Gaps (Required Updates to `.agent/agents/`)

The following agents exist but lack the specific "Mental Models" required for v2.0:

### `@product-manager`
*   **Gap**: Unaware of "Dual-Track" model. Thinks in linear "Idea -> Plan" terms.
*   **Gap**: Missing "Browser Gap Analysis" trigger instructions (how to check Board views).
*   **Gap**: Unaware of new "Validation" stage metrics requirements.
*   **Remediation**: Update system prompt to include `Discovery Track` responsibilities and strict `GITHUB_WORKFLOW_DESIGN.md` adherence.

### `@project-planner`
*   **Gap**: Unaware of "Sprint Planning" ceremony (Day 1).
*   **Gap**: Missing logic for "Task Breakdown Strategy" (Markdown List vs. Sub-issues).
*   **Gap**: Doesn't know when to invoke the "Expert Panel" vs just assigning tasks.
*   **Remediation**: Update system prompt to support "Sprint Mode" and "In Review" detailed steps.

### `@devops-engineer`
*   **Gap**: Unaware of "DevOps First" pre-flight checks (Git state, Branching Strategy) as a *mandatory* Step 2.1.
*   **Gap**: Lacks specific instructions for "Worktree" management.
*   **Remediation**: Massive update to prioritize "Pre-Flight Analysis" over just "deployment".

### `@documentation-writer`
*   **Gap**: Unaware of the new **Metadata Block** requirement for all docs.
*   **Gap**: Unaware of the "Triad" linkage requirements (Parent/Child/Related).
*   **Remediation**: Update `documentation-templates` skill to enforce new metadata schema.

---

## 2. Skill Gaps (New Capabilities Needed)

To support the v2.0 workflow, agents need new executable skills:

| Skill Name | Status | Purpose |
|------------|--------|---------|
| `github-browser-automation` | ❌ Missing | Enabling PM/Planner to read Project Board views and move cards (MCP limitation). |
| `sprint-management` | ❌ Missing | Logic for "Sprint Planning", "Retrospective", and managing "Iteration" fields. |
| `feature-flag-implementation` | ❌ Missing | Standardized code patterns for implementing flags (requested in Step 2.2). |
| `worktree-manager` | ❌ Missing | Scripts to safely manage git worktrees for parallel agent work. |

---

## 3. Infrastructure Gaps (The "Projects 1-6")

The user correctly identified these as "Not Started". This is the biggest friction point. Without these, the workflow is theoretical.

| Project | Priority | Impact on Workflow |
|---------|----------|--------------------|
| **1. Automated Testing** | 🔴 CRITICAL | Stage 3 (Pre-PR QA) is impossible without this. |
| **2. Linting & Code Quality** | 🔴 CRITICAL | Stage 3 & 4 (PR Review) rely on this. |
| **3. Security Scanning** | 🟠 HIGH | Stage 3 (Pre-PR QA) relies on this. |
| **4. Multi-Env Setup** | 🟠 HIGH | Stage 5 (Deployment) relies on this. |
| **5. Feature Flag System** | 🟡 MEDIUM | Stage 2 (Development) logic relies on this. |
| **6. Monitoring & Observability** | 🟡 MEDIUM | Stage 6 (Validation) relies on this. |

---

## 4. Implementation Validation

### Socratic Critiques & Adjustments

*   **Sprint Cadence (2 Weeks)**: Valid. However, agents have no internal clock. *Adjustment*: We must create a `/sprint-start` and `/sprint-end` workflow trigger to define time boundaries for agents.
*   **Tech Debt Allocation (15-20%)**: Valid. *Adjustment*: The `@project-planner` needs a specific instruction to checks strictly for `label:tech-debt` during planning and force-insert them.
*   **Escalation Protocol**: Excellent addition. *Adjustment*: This shouldn't just be a doc; it should be a **Global Rule** injected into all agents via `GEMINI.md` or a base skill.

## 5. Next Steps Recommendation

1.  **Adopt v2.0 Design**: Overwrite `GITHUB_WORKFLOW_DESIGN.md` with the new content (User's version is superior).
2.  **Update Implementation Plan**: Replace the generic "Phase 2" with specific creation tasks for the missing Skills and Infrastructure Projects.
3.  **Execute Phase 2 (Foundation)**:
    *   Setup `linting` and `testing` infrastructure FIRST (Project 1 & 2).
    *   Update `@devops-engineer` and `@documentation-writer` to support the basics.
