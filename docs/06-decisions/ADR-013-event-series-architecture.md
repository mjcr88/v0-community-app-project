# ADR 013: Event Series Architecture & Detachment Logic

## Status
Accepted

## Context
We need to support recurring events (Series) where individual occurrences can be modified independently or "detached" from the series.
The database schema uses `parent_event_id` and `recurrence_rule` to define series relationships.

## Decision

### 1. Schema for Series
- **Parent Event**: The original event definition. Has `recurrence_rule` set. `parent_event_id` is null.
- **Child Event (Occurrence)**: An instance of the series. Has `parent_event_id` pointing to the Parent. `recurrence_rule` is `NULL` for children—only the parent holds the rule. Creating a series generates 1 parent event and N child events.

### 2. Detachment (The "Edit This Only" Action)
When a user edits a specific occurrence and chooses "This event only":
1. The event is **detached** from the series.
2. **Schema Update**:
   - `parent_event_id` is set to `NULL`.
   - `recurrence_rule` is set to `NULL`.
3. **Result**: The event becomes a standalone "single" event. It no longer receives updates from the series parent.

### 3. Permission Model
- Only the **creator** of the series (or tenant admin) can detach events.
- We strictly enforce ownership checks in `detachEventOccurrence`.

## Consequences
- **Pros**:
  - Simple query logic for "standalone" events (just check if `parent_event_id` is null).
  - Clean separation of concerns.
- **Cons**:
  - Losing the link to the original series means we can't easily "reattach" or track "former members" of a series without an audit log.
  - History of the series doesn't include the detached event.
