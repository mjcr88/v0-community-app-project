---
name: screenshot-annotation
description: Guidelines for capturing and annotating UI screenshots using browser automation.
---

# Screenshot Annotation Skill

## Capture Process

1. **State Setup**: Ensure the specific UI state is active (e.g., error message visible, form filled).
2. **Viewport**: Use standard viewports.
   - Desktop: 1280x800
   - Mobile: 375x812
3. **Clean UI**: Hide debug tools, sensitive data (PII), or irrelevant toasts.

## Annotation Rules

- **Highlighting**: Use a red (semitransparent) or brand-color box to highlight the area of interest.
- **Numbering**: If multiple steps, overlay numbered badges (1, 2, 3) on the UI elements.
- **Obfuscation**: Blur real names, emails, or phone numbers. Use "Jane Doe" or sample data.

## File Management

- **Format**: PNG or WebP.
- **Naming**: `[feature]-[state]-[viewport].png` (e.g., `events-create-desktop.png`).
- **Location**: `docs-site/static/screenshots/`.

## Interaction with Browser Subagent

- Use `browser_subagent` to navigate and capture.
- If annotation tools are not available, capture raw screenshot and use descriptive captions in Markdown. Alternatively, use CSS injection to highlight elements *before* capture.
  - *Example*: `element.style.outline = "2px solid red"`

## Markdown Usage

```markdown
![Create Event Form - filling out title and date](./screenshots/events-create-desktop.png)
*Fill out the Title and Date fields as shown.*
```
