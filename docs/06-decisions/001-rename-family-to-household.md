# ADR 001: Rename "Family" to "Household"

**Status**: Accepted
**Date**: 2026-01-21
**Context**: "Family" implies blood relations or legal structures that exclude many intentional community living arrangements (friends sharing a house, co-living).
**Decision**: Rename all user-facing instances of "Family" to "**Household**" to better reflect the diverse nature of our community.
**Consequences**:
- **UI**: All labels, tabs, and buttons updated (e.g., "Add Household").
- **Database**: Schema remains `family_units` for now to minimize migration risk. Mapping occurs at the UI layer.
- **Future**: New code should prefer `household` terminology in variable names where possible.
