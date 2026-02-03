# Proposed Agent & Skill Changes for v2.0 Workflow

This document details the specific changes required to the Agent Definitions and Skills.

---

## 1. New Skills to Create

### `github-browser-automation`
*   **Why**: MCP Limitation. Required for `/idea` (reading drafts) and `/sprint` (board management).
*   **Key Instructions**: View navigation, Card parsing, Safe DOM interaction.

### `sprint-management`
*   **Why**: Implements the "Attention Batch" concept.
*   **Key Instructions**:
    *   **State Locking**: Logic to "Freeze" the backlog and "Select" active items for the batch.
    *   **Ceremoniese**: Templates for "Retrospective" generation during `/sprint end`.

### `feature-flag-implementation`
*   **Why**: Required for `/work`.
*   **Key Instructions**: Standard React/Node patterns for feature toggles.

### `worktree-manager`
*   **Why**: Required for `/work`.
*   **Key Instructions**: Git worktree creation/destruction to support parallel agent execution.

---

## 2. Agent Definition Updates

### `@product-manager`
*   **Trigger Responsibility**: Owns `/idea`.
*   **New Mental Model**: "Validation First" - never just map raw ideas to plans.

### `@project-planner`
*   **Trigger Responsibility**: Owns `/plan` and `/sprint`.
*   **New Mental Model**: "Batch Architect" - helps user select a coherent set of items for scope locking.

### `@devops-engineer`
*   **Trigger Responsibility**: Owns `/work` (setup) and `/ship`.
*   **New Mental Model**: "Ops First" - dictates branching strategy before coding starts.

### `@orchestrator`
*   **Routing Update**: Explicitly maps user intent to the 6 Slash Commands (`/idea`, `/plan`, `/sprint`, `/work`, `/test`, `/ship`).
