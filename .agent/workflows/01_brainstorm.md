---
description: Structured brainstorming for projects and features. Explores multiple options before implementation.
---

# /brainstorm - Structured Idea Exploration

$ARGUMENTS

---

## Purpose

Activation of **BRAINSTORM MODE** for structured idea exploration, requirement gathering, and technical feasibility analysis.

**Goal**: Move from "Idea" to "Reviewable Project Item" with full context.

## CRITICAL PROTOCOL: SEQUENTIAL EXECUTION

> 🛑 **SEQUENTIAL LOCKING**: You are **PROHIBITED** from executing multiple phases in a single tool call or turn.
> *   You MUST output a **Handoff Log** between each phase.
> *   You must NOT generate "Technical Options" (Phase 2) until "Definition" (Phase 1) is fully written and saved.
> *   **Validation**: Phase 1 ends with `write_to_file`. Phase 2 cannot start until the system confirms the file write is successful.
> *   **Task Tracking**: You MUST call `task_boundary` at the start of each phase with `TaskName="Brainstorming: Phase X - [Phase Name]"`. Do NOT reuse the same task name for different phases.

---

## Behavior

When `/brainstorm` is triggered, follow this **5-Phase Process**:

### Phase 1: Definition (Product Manager)
> **Agent**: `product-manager`

1.  **Socratic Gate (Clarification)**:
    *   **Analyze Input**: Analyze the user's triggering request.
    *   **Stop & Ask**:
        *   **IF** vague: Ask the **Mandatory 3 Questions** (Purpose, Users, Scope).
        *   **IF** clear: Ask **one confirmation question** to ensure alignment.
    *   **Wait**: Do NOT proceed to artifact creation until specific user confirmation is received.
2.  **Artifact Creation**: Use your analysis to decide the artifact type:
    *   **IF** concrete requirement: Create in `docs/07-product/02_requirements` named: `requirements_YYYY-MM-DD_{topic_name}.md`.
    *   **IF** requires research/feedback (Idea): Create in `docs/07-product/01_idea` named: `idea_YYYY-MM-DD_{topic_name}.md`.
3.  **Documentation Gap Check**:
    *   Review `docs/` for relevant context.
    *   **CRITICAL**: If context is missing, append a note to `docs/documentation_gaps.md` AND the `issue_context` section of the artifact.
4.  **Dependency Check**:
    *   Use MCP tools (`list_issues`, `search_issues`) to find related work.
    *   **Scope**: Check issues in "Backlog", "In Review", "Ready for development", "In Progress", "QA".
    *   **Action**: List any dependencies in the artifact.
5.  **Write Content**: Fill the `Problem Statement`, `User Persona`, `Context`, and `Dependencies` sections using the clarified understanding.
6.  **Handoff**: You MUST output a log line: `🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...` before proceeding to Phase 2.

### Phase 2: Ideation (Technical Agents)
> **Agent**: `orchestrator` routes to `backend-specialist` / `frontend-specialist` / etc.

1.  **Read Artifact**: Read the artifact (requirements or idea) created in Phase 1.
2.  **Generate Options**: Append **at least 3 Technical Options** to the file.
3.  **Format**: For each option, include `Pros`, `Cons`, and `Effort`.
4.  **Handoff**: You MUST output a log line: `🔁 [PHASE 2 COMPLETE] Handing off to Product Owner...` before proceeding to Phase 3.

### Phase 3: Recommendation (Product Owner)
> **Agent**: `product-owner`

1.  **Review**: Analyze the technical options against business value.
2.  **Recommendation**: Append the **Recommendation** section to the file.
3.  **Classify**: Add the following mandatory metadata:
    *   **Priority**: P0, P1, P2
    *   **Size**: XS, S, M, L, XL
    *   **Horizon**: Q1 26, Q2 26, Q3 26, Q4 26
4.  **Handoff**: Call the `notify_user` tool to initiate Phase 4 (User Review).

### Phase 4: User Review
> **Tool**: `notify_user`

1.  Present the fully populated artifact to the user.
2.  Ask for approval to proceed to GitHub creation.

### Phase 5: Execution (Automation)
> **Tools**: `open_browser`, `click`, `type` (Browser Automation)

**IF** User Approves AND Artifact is `requirements_...`:
1.  **Navigate**: Go to `https://github.com/users/mjcr88/projects/1` Full List View
2.  **Create Draft Issue**:
    *   **Action**: type title and an empty space, then **CLICK "Convert to issue"** -> **"Create a draft"** (Do NOT press Enter, Do NOT create full issue).
    *   **Title**: `[Brainstorm] {Topic Name}`
    *   **Description**: Copy the *Summary*, *User Story*, *Dependencies*, *Recommendation*, and *Artifact Link* from the artifact.
    *   **Status**: Set to **"In Review"**.
    *   **Priority**: Set from available options according to artifact.
    *   **Size**: Set from available options according to artifact.
    *   **Horizon**: Set from available options according to artifact.
    
**IF** Artifact is `idea_...`:
1.  **Stop**: Ideas do not require GitHub issues. The process ends here.

---

## Key Principles

- **Artifact First**: Source of truth is the `.md` file, not the chat.
- **Dependency Aware**: Never create duplicate work; always check existing issues first.
- **Gap Logging**: If we don't know something, we document that we don't know it.