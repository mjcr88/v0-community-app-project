---
name: product-execution
description: Tactical execution frameworks for "The How". Covers Automated PRD generation, Intelligent Backlog Prioritization (RICE), and Cross-functional Dependency Graphing.
---

# Product Execution - The "How"

This skill focuses on the tactical translation of strategy into execution. It ensures that the "Why" defined in `product-strategy` becomes a clear, buildable "What".

## 📊 Capability Tiers

| Level | Focus | Key Actions |
|-------|-------|-------------|
| **Junior** | Documentation | Drafts user stories; maps basic flows in Figma/Mermaid. |
| **Mid-Senior** | Prioritization | Owns backlog health via RICE; manages sprint scope; identifies dependencies. |
| **Executive** | Resource Optimization | Aligns technical dependencies (e.g., microservices) with business timeline. |

## 🛠️ Execution Frameworks

### 1. Automated PRD Generation
**Purpose**: Create unambiguous specs for engineering.
**Template**:
-   **Problem**: What are we solving?
-   **User Story**: `As a [Persona], I want to [Action], so that [Benefit]`.
-   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given I am a logged-in user
    When I click "Export"
    Then I should receive a CSV file within 2 seconds
    ```
-   **Edge Cases**: Network failure, empty states, huge datasets.

### 2. RICE Prioritization
**Formula**: `(Reach * Impact * Confidence) / Effort`
**Definitions**:
-   **Reach**: Customers affected per quarter.
-   **Impact**: 0.25 (Minimal) to 3 (Massive).
-   **Confidence**: 50% (Low) to 100% (High/Validated).
-   **Effort**: Person-months (Engineering + Design).

### 3. Dependency Graphing
**Purpose**: Prevent "blocked by team X" delays.
**Action**:
1.  Identify needed APIs/Data.
2.  Check ownership (`CODEBASE.md` or `git blame`).
3.  Flag external dependencies in `ROADMAP.md` as "Pre-requisites".

## 🚀 Workflows

### A. Discovery & Ambiguity Check (Pre-Report)
1.  **Input Check**: Is the request/draft > 2 sentences? Does it rely on "see screenshot"?
2.  **Gate**: If ambiguous -> STOP. Ask User.
3.  **Folder Strategy**: Enforce `docs/product/Discovery/<YYYY-MM-DD>-<Title>/`.

### B. Materialization Handoff
1.  **Report**: Generate Consolidated Report (Analysis + Doc Strategy).
2.  **Notify**: "Report Ready. Please convert Drafts -> Issues."
3.  **Wait**: Do not proceed until confirmed.

### C. Issue Grooming (MCP)
**Tool**: `github-mcp-server` (Strictly NO Browser)
1.  **Fetch**: `get_issue(issue_number)`
2.  **Validate**: Check for "Ambiguity Paradox".
3.  **Update**: Gap Analysis vs `docs/`. Add labels/comments.

### C. Dependency Check
1.  **Analyze**: Review PRD against `ARCHITECTURE.md`.
2.  **Map**: List all modified components.
3.  **Alert**: If component belongs to another domain (e.g., Mobile needing new API), flag to Orchestrator.
