---
name: excalidraw-diagrams
description: Instructions for generating valid Excalidraw diagrams in JSON format.
---

# Excalidraw Diagrams Skill

## Overview

Use this skill to generate `.excalidraw` JSON files for system diagrams, flows, and architectures.

## JSON Structure

Excalidraw files are JSON objects with a specific structure.

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "type": "rectangle",
      "version": 1,
      "versionNonce": 0,
      "isDeleted": false,
      "id": "unique-id-1",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "x": 100,
      "y": 100,
      "strokeColor": "#000000",
      "backgroundColor": "transparent",
      "width": 100,
      "height": 100,
      "seed": 1,
      "groupIds": [],
      "roundness": { "type": 3 },
      "boundElements": []
    }
    // ... more elements
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

## Element Types

- `rectangle`: Boxes, containers.
- `ellipse`: Start/End nodes, actors.
- `diamond`: Decisions.
- `arrow`: Connectors.
- `text`: Labels.

## Best Practices

1. **Simplicity**: Keep diagrams high-level. Avoid clutter.
2. **Grouping**: Group related elements (e.g., a node and its label).
3. **Connectors**: Use arrows to show flow. Ensure start/end points align.
4. **Colors**: Use Nido brand colors (mapped to hex codes) if possible, or standard semantic colors (green=success, red=error).

## Output

- Always save as `[filename].excalidraw`.
- Place in `docs-site/static/diagrams/`.
