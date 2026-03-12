---
description: Discovery/Design workflow for large-scale ideas (Epics). Manages research, architectural mapping, and roadmap slicing.
---

# /discovery - Architectural Discovery & Epic Slicing

$ARGUMENTS

---

## Purpose

Activation of **DISCOVERY MODE** for large-scale ideas that exceed the scope of a single feature. This workflow ensures architectural alignment and structural rigor before any code is written or granular features are brainstormed.

**Goal**: Move from "Complex Idea" to "Approved Architectural Blueprint" with a linked roadmap of GitHub issues.

## CRITICAL PROTOCOL: SEQUENTIAL MILESTONES

> 🛑 **USER REVIEW GATES**: You are **PROHIBITED** from proceeding between phases without an explicit **User Review** via `notify_user`.
> *   You MUST save the progress to the blueprint artifact after each phase.
> *   You must NOT start Architectural Mapping (Phase 2) until Research (Phase 1) is approved.
> *   **Validation**: Every phase must consult `docs/07-product/06_patterns/nido_patterns.md` and `docs/07-product/06_patterns/lessons_learned.md`.

---

## Behavior

When `/discovery` is triggered, follow this **5-Phase Process**:

### Phase 1: Research & Feasibility
> **Agent**: `product-manager`, `project-planner`

1.  **Landscape Analysis**: Research the requested tech stack, infrastructure costs, and competitive benchmarks.
2.  **Risk Assessment**: Identify "Risky Assumptions" (e.g., performance bottlenecks, auth complexities).
3.  **Validation**: Verify alignment with `lessons_learned.md` and `nido_patterns.md`.
4.  **Artifact**: Create `docs/07-product/01_idea/blueprint_{name}.md` using the **Blueprint Template**.
5.  **Review**: Call `notify_user` with the research summary. **WAIT** for approval.

### Phase 2: Architectural & UI Mapping
> **Agent**: `database-architect`, `backend-specialist`, `frontend-specialist`, `security-auditor`

1.  **Technical Design**: Map data models, RLS policies, and API structures.
2.  **UI Impact**: Analyze how the feature fits into the existing UI (e.g., Sidebars, Dashboard, Mobile layouts).
3.  **Cross-Cutting Concerns**: Evaluate Security, Performance, and Observability needs.
4.  **Decisions**: Append **Mini-ADRs** (Decision + Rationale + Trade-off) to the blueprint.
5.  **Review**: Call `notify_user` with the architectural design. **WAIT** for approval.

### Phase 3: Roadmap Slicing
> **Agent**: `product-owner`

1.  **Phasing**: Group the large idea into logical **Feature Phases** (e.g., Phase 1: Core, Phase 2: Automation).
2.  **Prioritization**: Define the effort (XS-XL) and dependencies for each phase.
3.  **Documentation**: Update the `## Implementation Roadmap` table in the blueprint.
4.  **Review**: Call `notify_user` with the roadmap. **WAIT** for approval.

### Phase 4: SDLC Handshake (Issue Creation)
> **Agent**: `orchestrator`

1.  **Issue Generation**: Create a **Parent Issue** for each Phase identified in the roadmap.
2.  **Labeling**: Add `Epic` to these parent issues titles.
3.  **Child Slicing**: Create sub-issues for specific technical tasks within each phase (we will run our brainstorm / review process to define each requirement).
4.  **Cross-Linking**: 
    *   Add Blueprint URL to Issue descriptions.
    *   Add Issue Numbers to the Roadmap table in the Blueprint.
5.  **Review**: Call `notify_user` with the final issue structure. **WAIT** for approval.

### Phase 5: Transition to Build
> **Agent**: `orchestrator`

1.  **Ready Status**: Mark the Blueprint as `Ready for Brainstorming: Yes`.
2.  **Handover**: Inform the user that they can now initiate `/01_brainstorm` on specific phases by referencing the blueprint:
    *   `Example: /01_brainstorm --blueprint docs/.../blueprint_name.md --phase 1`

---

## Key Principles

- **Rigor Before Velocity**: Solve the "hard" problems once in the blueprint so they don't break every sprint.
- **Specialist Collaboration**: Force alignment between Backend, Frontend, and Security at the design level.
- **Traceability**: Every feature code change must eventually trace back to a Phase in the Architectural Blueprint.