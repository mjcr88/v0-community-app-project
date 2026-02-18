---
description: Comprehensive documentation workflow for features or systems. Coordinates discovery, content creation, visual assets, and verification.
---

# /document - Create & Verify Documentation

An 8-phase workflow to produce high-quality, user-friendly, and technically accurate documentation.

## Phase 0: Discovery & Context

1. **Trigger**: User invokes `/document <target>` (e.g., `/document events`).
2. **Assign**: `explorer-agent`.
3. **Action**:
   - Parse `<target>`.
   - Search codebase for relevant files (components, actions, schemas).
   - Read `docs/documentation_gaps.md` for existing gaps.
   - Read `docs/07-product/00_audits/` for existing audit logs.
   - Generate a **Discovery Report** summarizing the current state and what needs documentation.
   - Log any immediate findings (tech debt, assumptions) to `docs/07-product/00_audits/`.

## Phase 1: Scope Confirmation & Issue Setup

1. **Assign**: `product-manager`.
2. **Action**:
   - Present Discovery Report to user.
   - **GATE**: User approves/refines scope.
   - **MCP**: Create Parent Issue: `📖 Document: <Target>`.
   - **MCP**: Add initial comment with Discovery Report.

## Phase 2: Documentation Needs Analysis

1. **Assign**: `orchestrator`.
2. **Action**:
   - Generate artifact checklist (Technical + User + Visual + Microcopy + Translation).
   - **GATE**: User reviews checklist.
   - **MCP**: Create Sub-Issues for approved artifacts.

## Phase 3: Technical Documentation

1. **Assign**: `documentation-writer`.
2. **Action**:
   - Pick up `Technical` sub-issues.
   - Write content to `docs-site/docs/developers/`.
   - Cross-reference `documentation_gaps.md`.
   - Log tech debt/assumptions.

## Phase 4: User Documentation & Microcopy

1. **Assign**: `content-writer`.
2. **Action**:
   - Pick up `User Docs` sub-issues.
   - Audit app UI strings against `tone_of_voice_guide.md`.
   - Write content to `docs-site/docs/guides/` or `favorites/`.

## Phase 5: Visual Assets

1. **Assign**: `content-writer`.
2. **Action**:
   - Create diagrams (`excalidraw-diagrams`) in `docs-site/static/diagrams/`.
   - Capture screenshots (`screenshot-annotation`) in `docs-site/static/screenshots/`.

## Phase 6: Cross-Reference & Gap Cleanup

1. **Assign**: `orchestrator`.
2. **Action**:
   - Verify interlinking between docs.
   - Mark addressed gaps in `documentation_gaps.md` as `[DONE]`.
   - Validate terminology against `en.json`.
   - **GATE**: User final review.

## Phase 7: Translation (ES)

1. **Assign**: `content-writer`.
2. **Trigger**: Only after Phase 6 approval.
3. **Action**:
   - Create ES translations in `docs-site/i18n/es/`.
   - Adapt culturally per `content-localization` skill.
