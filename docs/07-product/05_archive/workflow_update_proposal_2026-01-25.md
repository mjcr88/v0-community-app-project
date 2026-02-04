# Proposal: Update /brainstorm Workflow

## Objective
Enhance **Phase 1: Definition** of the `/brainstorm` workflow to explicitly include a **Clarification Loop (Socratic Gate)** as the **FIRST STEP**. This ensures the Product Manager agent validates requirements with the user *before* spending time on deep investigation, artifact creation, or detailed writing.

## Rationale
Currently, Phase 1 performs investigation and drafting before asking for feedback. This risks wasting tokens and time on a misunderstanding. User feedback is often ambiguous (e.g., "Make it better"). By moving the Socratic check to the very beginning, we align with the principle: **"Understand before you solving"**.

## Proposed Changes

### Modified Phase 1: Definition
*We propose injecting the Socratic Gate as Step 1.*

#### New Phase 1 Workflow

1.  **Socratic Gate (Clarification)**:
    *   **Analyze Input**: The Product Manager analyzes the user's initial prompt.
    *   **Stop & Ask**:
        *   **IF** the request is vague (e.g., "Fix the UI"): Use `notify_user` to ask the **Mandatory 3 Questions** (Purpose, Users, Scope) defined in `@[skills/brainstorming]`.
        *   **IF** the request is seemingly clear: Still ask **one confirmation question** to ensure alignment (e.g., "You want to add X to Y to solve Z, correct?").
    *   **Wait**: Do NOT proceed to artifact creation until specific user confirmation is received.
2.  **Artifact Creation**: Create `requirements_...md`.
3.  **Documentation Gap Check**: Review `docs/` and log gaps.
4.  **Dependency Check**: MCP search for related issues.
5.  **Write Requirements**: Fill core sections (Problem, Persona, Context, Dependencies) using the clarified understanding.
6.  **Handoff**: Output log line `🔁 [PHASE 1 COMPLETE]...`

## Logic Reuse
We are re-using the **Socratic Gate** and **3 Questions** logic from `@[skills/brainstorming]` (Tier 0 Rule), effectively forcing it at the start of the Product Manager's workflow.

- **Source**: `.agent/skills/brainstorming/SKILL.md` (Lines 24-32)
- **Application**: The "3 Questions" (Purpose, Users, Scope) are perfect for flushing out requirements before we even create the file.

## Impact
- **Pros**: Fails fast. Prevents "rabbit hole" investigation based on wrong premises. Saves tokens.
- **Cons**: User must reply once before the agent starts "working" (creating files), but this ensures the work is valuable.

## Next Steps
Upon approval of this proposal, I will update:
1.  `.agent/workflows/brainstorm.md`
2.  `.agent/agents/product-manager.md`
