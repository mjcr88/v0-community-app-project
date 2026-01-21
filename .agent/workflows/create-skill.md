---
description: Create a new AI agent skill with standard structure.
---

# Create Skill Workflow

This workflow scaffolding a new skill for the AI agents.

## Steps

1.  **Ask for Skill Name**
    -   "What is the name of the new skill? (kebab-case, e.g., `vector-db-expert`)"
    -   Wait for user input.

2.  **Create Directory Structure**
    -   Create folder: `.agent/skills/<skill-name>`
    -   Create folder: `.agent/skills/<skill-name>/scripts`

3.  **Create SKILL.md**
    -   Create file `.agent/skills/<skill-name>/SKILL.md` with this template:

    ```markdown
    ---
    name: <skill-name>
    description: <short description>
    ---

    # <Skill Name Title>

    ## Preamble
    Why this skill exists and what high-level problems it solves.

    ## Core Concepts
    1. Concept A
    2. Concept B

    ## Decision Framework
    When to use X vs Y.

    ## Usage Guide
    How to apply this skill in code.
    ```

4.  **Confirm**
    -   Output: "✅ Skill `<skill-name>` created at `.agent/skills/<skill-name>`"
