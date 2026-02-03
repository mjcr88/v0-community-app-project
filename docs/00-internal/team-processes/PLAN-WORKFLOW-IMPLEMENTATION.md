# Implementation Plan: Nido Workflow v2.0 Build (The Rails)

## [Goal Description]
To implement the "Process & Workflow" layer of the Nido v2.0 SDLC. This involves creating the **Slash Command Workflows** (`/idea`, `/plan`, etc.) and equipping Agents with the **Skills** to execute them.

## User Review Required
> [!IMPORTANT]
> **Trigger-Based Workflow**
> This plan implements the "Trigger Sequence" defined in `GITHUB_WORKFLOW_DESIGN.md`. All workflow files correspond 1:1 with the slash commands.

## Proposed Changes

### 1. New Skills Development
**Goal:** Give agents the *ability* to execute the new workflow steps.

*   **`github-browser-automation`**:
    *   **Purpose**: Enabling agents to "See" the board for `/idea` and `/sprint` workflows.
*   **`sprint-management`**:
    *   **Purpose**: Logic for the `/sprint` trigger. Implements "State Locking" (Batch Start) and "Retrospectives" (Batch End).
*   **`feature-flag-implementation`**:
    *   **Purpose**: Standardized patterns for the `/work` workflow.
*   **`worktree-manager`**:
    *   **Purpose**: Safe isolation for the `/work` workflow.

### 2. Workflow File Creation (The Triggers)
**Goal:** Create the executable markdown files (`.agent/workflows/X.md`).

*   **`workflows/idea.md`**: Discovery Trigger.
    *   Input: Draft Issue or "Idea".
    *   Output: Validated Backlog Item + PRD/Brief.
*   **`workflows/plan.md`**: Planning Trigger.
    *   Input: Validated Item.
    *   Output: `PLAN.md` + "Ready" status.
*   **`workflows/sprint.md`**: Batch Trigger.
    *   Args: `start`, `end`.
    *   Action: Locks scope, assigns `Iteration`, generates Retro.
*   **`workflows/work.md`**: Execution Trigger.
    *   Input: "Ready" Ticket.
    *   Action: Setup Worktree -> Activate Squad -> Code.
*   **`workflows/test.md`**: QA Trigger.
    *   Action: Run `verify_all.py` -> Open PR.
*   **`workflows/ship.md`**: Release Trigger.
    *   Action: Pre-Flight Check -> Merge.

### 3. Agent Mental Model Updates
*   **`product-manager`**: Teach `/idea` and `/sprint` (Validation & backlog grooming).
*   **`project-planner`**: Teach `/plan` and `/sprint` (Technical planning & batch sizing).
*   **`devops-engineer`**: Teach `/work` and `/ship` (Worktrees & Deployment).

## Verification Plan

### Manual Simulation
1.  **Test `/idea`**: Run command on dummy issue. Verify PRD creation.
2.  **Test `/sprint start`**: Verify agent can "read" selected cards and "lock" them (by proposing label updates).
3.  **Test `/test`**: Verify it invokes the (currently placeholder) verification script.
