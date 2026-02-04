# Idea Workflow Retrospective: Alpha Trial Findings

**Date:** 2026-01-23
**Status:** DRAFT
**Context:** Review of the first full end-to-end test of the "New Idea Workflow" using GitHub Projects.

## 1. Executive Summary
The trial revealed critical gaps in how Agents interact with Github Projects. specifically "Draft Issues". Drafts are invisible to MCP tools and fragile to access via Browser. The workflow must evolve to an **"User-Triggered Materialization"** model: The Agent performs discovery and reporting, then **pauses** for the User to convert Drafts to Real Issues. Only then can the Agent resume using robust MCP tools for grooming.

## 2. Key Learnings & Issues

### 2.1 The "Draft Issue" Blind Spot
*   **Observation:** The Agent cannot "see" Draft Issues via MCP. Browser access is slow/fragile.
*   **Correction:** **Manual Handoff Required.**
    *   *New Flow:* Discovery (Agent) -> Report -> **User Converts Drafts to Issues** -> Validation/Grooming (Agent via MCP).
    *   *Feedback:* "The user needs to be notified to take this action... once... converted, you can access them via mcp."

### 2.2 The Ambiguity Paradox (Timing Issue)
*   **Observation:** We attempted to resolve ambiguity during specifications (Brief/PRD). This is too late; it resulted in hallucinated specs.
*   **Correction:** **Shift Left.**
    *   *Rule:* The **Explorer Agent** (Phase 1) must catch ambiguity *before* the Discovery Report is even written. "If unclear, ASK immediately."

### 2.3 Artifact Management & Folder Structure
*   **Requirement:** Strict hierarchy is mandatory for "Idea Sessions".
    *   **Folder:** `docs/product/Discovery/<YYYY-MM-DD>-<Descriptive-Title>/`
    *   **Files:** One consolidated report (Report + Plan + Doc Strategy).

## 3. Action Plan

### 3.1 Workflow Re-engineering (`.agent/workflows/idea.md`)
1.  **Discovery**: Ambiguity Check -> Context Map -> Consolidated Report (`docs/product/Discovery/...`).
2.  **Notification**: Agent stops and requests User to "Materialize" (Convert Drafts -> Issues).
3.  **Validation**: PM Agent picks up *Real Issues* (via MCP) for Gap Analysis.
4.  **Decision**: PM updates Issue Status (Backlog/In Review).

### 3.2 Skill Updates
*   **`product-execution`**: Update protocols to wait for Issue IDs.
*   **`github-browser-automation`**: Deprioritize. Use only if absolutely necessary for "Reading the Board" view if MCP fails.
