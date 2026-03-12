---
name: content-localization
description: Guidelines for localizing documentation, specifically for Docusaurus i18n workflows.
---

# Content Localization Skill

## Philosophy

- **English First**: All documentation is authored and approved in English first.
- **No Machine Translation Dump**: AI translation must be reviewed and culturally adapted.
- **Sync**: Keep directory structures identical between locales.

## Workflow

1. **Source**: `docs-site/docs/**` (English).
2. **Target**: `docs-site/i18n/es/docusaurus-plugin-content-docs/current/**` (Spanish).

## File Structure

Docusaurus uses a specific folder structure for i18n:

```
docs-site/
├── docs/                   # Default (English)
│   ├── intro.md
│   └── guides/
│       └── resident.md
└── i18n/
    └── es/
        └── docusaurus-plugin-content-docs/
            └── current/
                ├── intro.md
                └── guides/
                    └── resident.md
```

## Adaptation Guidelines

- **Terminology**: Use the Spanish terms defined in `lib/i18n/es.json` for UI elements.
  - *Example*: If button says "Guardar", doc must say "Haga clic en **Guardar**", not "Salvar".
- **Cultural Nuance**: Adapt idioms. Address the user with appropriate formality (typically "usted" for formal/admin, mixed for community depending on tone voice guide).
- **Screenshots**: Ideally, use screenshots of the interface in Spanish. If not possible, note that the interface language may vary.

## Checklist

- [ ] Does the file path match the source exactly?
- [ ] Are all UI references checked against `es.json`?
- [ ] Are links updated (if they point to external English resources, find Spanish equivalents or note "in English")?
- [ ] Is the frontmatter translated (title, description)?
