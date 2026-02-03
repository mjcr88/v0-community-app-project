# Implementation Plan: Nido Infrastructure Rollout (The Engine)

## [Goal Description]
To implement the "Machinery" that powers the Nido v2.0 workflow. This plan focuses on replacing manual verification steps with automated systems (CI/CD, Testing, Quality Gates). This work will be executed *in parallel* or *after* the initial Workflow Build, treating each infrastructure component as a project managed by the agents.

## User Review Required
> [!NOTE]
> **Phased Rollout**
> This infrastructure will be built iteratively. The Workflow (`/test`, `/ship`) will initially point to "Manual Verification" placeholders and will be updated to point to these automated tools as they come online.

## Proposed Changes

### Phase 1: The Quality Core (Testing & Linting)
**Goal:** Ensure code is correct before it leaves the developer's machine.

*   **Project 1: The "One Script" (`verify_all.py`)**
    *   **Deliverable**: A master python script that runs all checks (Lint, Types, Unit Tests, Security).
    *   **Component**: `linting` setup (ESLint + Prettier).
    *   **Component**: `testing` setup (Jest for Unit, Playwright for E2E).
    *   **Integration**: Update `/test` workflow to run this script.

*   **Project 2: Security & Quality Gates**
    *   **Deliverable**: `husky` pre-commit hooks preventing bad commits.
    *   **Deliverable**: `security-scan` integration (npm audit / trufflehog).

### Phase 2: The Delivery Pipeline (CI/CD)
**Goal:** Automate the path from "Merge" to "Production".

*   **Project 3: GitHub Actions Pipeline**
    *   **Deliverable**: `.github/workflows/ci.yml` (Build, Test, Lint on PR).
    *   **Deliverable**: `.github/workflows/cd.yml` (Deploy to Vercel/Supabase on Merge).

*   **Project 4: Multi-Environment Setup**
    *   **Deliverable**: Distinct `staging` and `production` projects in Supabase/Vercel.
    *   **Deliverable**: Environment variable segregation (`.env.staging`, `.env.production`).

### Phase 3: Advanced Operations
**Goal:** Operational excellence and risk mitigation.

*   **Project 5: Feature Flag System**
    *   **Deliverable**: Integration with a proper provider (LaunchDarkly or Supabase/Postgres based flags).
    *   **Integration**: Update `feature-flag-implementation` skill to use the real system.

*   **Project 6: Observability**
    *   **Deliverable**: Sentry (Error Tracking) installation.
    *   **Deliverable**: Logging infrastructure.

## Verification Plan

### Automated Verification
*   **CI Success**: Green build badge on GitHub for a test PR.
*   **Deployment Success**: Code merged to `main` automatically appears on `staging` URL.

### Manual Verification
*   **Fail Test**: Intentionally break a test and verify `verify_all.py` blocks the PR.
*   **Security Test**: Intentionally commit a "fake secret" and verify pre-commit hook blocks it.
