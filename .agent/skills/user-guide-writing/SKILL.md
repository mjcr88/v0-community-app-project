---
name: user-guide-writing
description: Principles for writing end-user documentation: structure, tone, and formatting.
---

# User Guide Writing Skill

## Core Principles

1. **Task-Based**: Focus on "How to [Task]" not "Using [Feature]".
   - *Bad*: "Using the Event Calendar"
   - *Good*: "How to RSVP for an Event"

2. **Progressive Disclosure**:
   - Start with the happy path (most common use case).
   - Put advanced options or edge cases in "Tips" or "Advanced" sections.

3. **Audience Awareness**:
   - Residents: Non-technical, mobile-first, goal-oriented.
   - Admins: Power users, desktop-focused, efficiency-oriented.

## Structure Template

```markdown
# [Task Name]

[1-sentence value prop: Why do this?]

## Prerequisites
- [Role required]
- [Pre-condition]

## Steps
1. Navigate to **[Page Name]**.
2. Click the **[Button Name]** button.
   > [!TIP]
   > Contextual tip here.
3. Fill out the form...

## Troubleshooting
- **Problem**: [Symptom]
- **Solution**: [Fix]
```

## Formatting Rules

- **UI Elements**: Bold exact UI text. Example: Click **Save**.
- **Screenshots**: Center screenshots. Add a caption below.
  - `![Caption describing the image](./path/to/image.png)`
  - *Caption text*
- **Admonitions**: Use GitHub alerts for specific contexts:
  - `[!NOTE]` for context.
  - `[!TIP]` for shortcuts/best practices.
  - `[!WARNING]` for destructive actions.

## Checklist

- [ ] Does the title start with a verb?
- [ ] Is the value prop clear?
- [ ] Are steps numbered?
- [ ] Are UI elements bolded?
- [ ] Is the tone consistent with `tone_of_voice_guide.md`?
