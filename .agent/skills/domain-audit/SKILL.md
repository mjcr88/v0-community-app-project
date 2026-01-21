---
name: domain-audit
description: A 5-step collaborative protocol for agents to self-audit their domain (Review, Plan, Execute, Incorporate, Roadmap). Use this skill to conduct deep "New Hire" style audits of the codebase.
allowed-tools: Read, Write, Edit, Glob, Grep, RunCommand
---

# Domain Audit Protocol (`domain-audit`)

A structured, interactive workflow for an agent to assume the role of a Lead Engineer and conduct a comprehensive audit of their specific domain (Frontend, Backend, Security, etc.).

## 🎯 Purpose
To transform "audit" from a vague task into a rigorous, repeatable 5-step process that aligns code, documentation, and agent knowledge.

## 🔄 The 5-Step Logic Loop

### Step 1: Review & Center (The "Self-Check")
**Goal:** The agent must understand *who* it is and *what* it should be enforcing before looking at code.
- **Action:** Read your own Agent Definition file (e.g., `.agent/agents/frontend-specialist.md`) and your primary `SKILL.md` files.
- **Output:** A brief summary: "I am the [Role]. My core sources of truth are [List of Files]. I am looking for violations of [Key Principles]."

### Step 2: Plan (The "Checklist")
**Goal:** Create a bespoke audit plan based on the domain.
- **Action:** Generate a specific checklist of files/patterns to check.
- **Prompt:** "Based on my role, what specific directories, files, or patterns should I inspect? List 5-10 specific audit points."
    - *Example (Frontend):* "Check `components/ui` for hardcoded colors. Check `app/` for Server Component best practices."
    - *Example (Backend):* "Check `supabase/RPC` for RLS policies. Check `actions/` for input validation."
- **Output:** A checklist artifact (formatted as a markdown list).

### Step 3: Execute (The "Walkthrough")
**Goal:** collaborative inspection.
- **Action:** For each item in the checklist:
    1.  **Inspect**: Use `view_file` or `grep` to check the code.
    2.  **Evaluate**: Compare findings against `GEMINI.md` and Specialist Rules.
    3.  **Discuss**: Present findings to the User *immediately* if critical, or batch them if minor.
    4.  **Fix/Log**: Ask: "Should I fix this now, or log it?"
- **Constraint:** Do not hallucinate issues. Quote line numbers.

### Step 4: Incorporate (The "Learning")
**Goal:** ensure the system gets smarter.
- **Action:**
    1.  **Update Knowledge**: If a new pattern was discovered (or a gap found), update `LEARNINGS.md` or the relevant `SKILL.md`.
    2.  **Refine Rules**: If a rule was vague, suggest an update to the Agent file.
- **Output:** "I have updated [File] to reflect [New Insight]."

### Step 5: Roadmap (The "Strategy")
**Goal:** Future-proof the domain.
- **Action:** Create or update `docs/roadmaps/{domain}.md`.
- **Content:**
    - **Current Health**: A grade (A-F) for the domain.
    - **Critical Debt**: What needs immediate fixing.
    - **Strategic Goals**: Next 3-6 months (e.g., "Migration to Tailwind v4").
- **Output:** A created/updated Roadmap artifact.

## 🛠️ Usage Guide

### Triggering the Audit
The user will typically say:
> "Run a domain audit for [Agent Name]"
> "Do a self-review of the frontend"

### Example Conversation Flow

**Agent:** "I am starting the Domain Audit for **Frontend Specialist**.
**Step 1: Review.** I've reviewed `frontend-specialist.md` and `nido_design_system.md`. My focus is: 'Premium Aesthetics, Mobile Performance, and Server Components'.

**Step 2: Plan.** Here is my proposed audit checklist:
1. [ ] Audit `tailwind.config.ts` for legacy colors.
2. [ ] Check `components/dashboard` for raw `useEffect` usage (Waterfall risk).
3. [ ] Verify `nido-patterns` usage in Mapbox components.
...
*Shall I proceed with this checklist?*"

**User:** "Yes, go ahead."

**Agent:** "Executing Step 3..." [Proceeds to inspect code]
