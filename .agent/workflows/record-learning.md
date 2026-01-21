---
description: Record a new learning, gotcha, or pattern into the Nido Patterns skill.
---

# Record Learning Workflow

This workflow captures tribal knowledge into `.agent/skills/nido-patterns/SKILL.md`.

## Steps

1.  **Ask for Learning Details**
    -   "What did we learn? (Provide a short title and 1-2 sentence description)"
    -   "Is this a Pattern, Gotcha, or Snippet?"

2.  **Append to Nido Patterns**
    -   Read `.agent/skills/nido-patterns/SKILL.md`.
    -   Append the new entry under a "## 🧠 Collective Memory (Learnings)" section (create if missing).
    -   Format:
        ```markdown
        ### [Date] <Title>
        **Type**: <Type>
        <Description>
        ```

3.  **Confirm**
    -   Output: "✅ Recorded learning in `nido-patterns` skill."
