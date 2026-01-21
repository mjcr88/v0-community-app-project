# Documentation Domain Audit - Jan 26, 2026 (Revision 5)

**Auditor:** `documentation-writer` Agent
**Status:** 🟡 Strategic Pivot (The "Triad" Strategy)
**Scope:** `docs/`, `CODEBASE.md`, Docusaurus, Jira, Google Workspace.

---

## 1. Executive Summary

**The Strategy:** We are adopting a **"Triad"** approach to information management. No single tool solves everything.
1.  **Work Management:** **Jira** (Issues, Requirements, Assignments).
2.  **Business Strategy:** **Google Workspace** (Drafts, Financials, User Research).
3.  **Product Knowledge:** **Docusaurus** (The Single Source of Truth for *All* Product Docs, Internal & External).

**Key Finding:** We need clear boundaries. Agents need to know *when* to check Jira vs. *when* to read a Google Doc vs. *when* to update Docusaurus (`docs/`).

---

## 2. Deep Dive Findings & Gaps

### 2.1 The "Work" Layer (Jira)
- **Gap:** Agents operate in "Task Mode" via `task.md`, but this is disconnected from a persistent backlog.
- **Risk:** Learning and context are lost when `task.md` is cleared.
- **Recommendation:** Agents should query Jira for requirements and update tickets with progress.

### 2.2 The "Business" Layer (Google Docs)
- **Gap:** Business context (e.g., "Why are we targeting Costa Rica?") lives here.
- **Risk:** Agents might miss this context if they only look at git.
- **Recommendation:** A "Link Map" in `docs/03-context/external-links.md` that points to key Google Docs.

### 2.3 The "Product" Layer (Docusaurus/Git)
- **Clarification:** This is NOT just for users. It is the destination for *mature* knowledge.
- **Flow:** Google Doc (Draft) -> Agreement -> Docusaurus (Published Truth).

---

## 3. Strategic Recommendations

### 3.1 The "Jira First" Rule
- **Rule:** "If it's work, it's a Ticket."
- **Workflow:**
    1.  User/Agent identifies a need -> Create Jira Ticket.
    2.  Agent starts work -> `transitionJiraIssue` to "In Progress".
    3.  Agent finishes -> `addCommentToJiraIssue` with Handoff -> Close.

### 3.2 The Documentation Pipeline
- **Stage 1 (Drafting):** Google Docs. Collaborative, low friction.
- **Stage 2 (Codifying):** Once a feature is "Alpha Ready", the "How-To" moves to `docs/01-manuals/` (Docusaurus).
- **Stage 3 (Archiving):** Old Jira tickets hold the execution history; `docs/04-decisions/` holds the architectural decision.

### 3.3 Directory Structure (Updated for Internal/External Docusaurus)
- `docs/00-internal/`: Team processes, Onboarding (Private Docusaurus section).
- `docs/01-manuals/`: Public User Guides.
- `docs/02-technical/`: Public API/Arch docs.

---

## 4. Updates to Global Rules & Skills

### 4.1 The "Jira Check" Rule
*Add to `GEMINI.md`:*
> **Protocol:** Before starting a complex task, check Jira for existing context or requirements. Update the ticket as you work.

### 4.2 The "Context Boundary" Rule
*Add to `documentation-writer.md`:*
> **Guidance:** "If it's messy human collaboration, suggesting using Google Docs. If it's defined product truth, put it in Docusaurus (`docs/`)."

---

## 5. Roadmap

1.  **Immediate:** Scaffold `docs/` structure (including `00-internal`).
2.  **Immediate:** Update `GEMINI.md` with Jira protocol.
3.  **Future:** Integrate `jira-management` skill into all agents (currently specialized).
