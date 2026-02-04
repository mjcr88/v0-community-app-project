# Nido Software Development Lifecycle (SDLC) v2.0

This document defines the **Nido Software Development Lifecycle** using GitHub Projects and AI Agents. It follows a "Dual-Track" model (Discovery + Delivery) with a "DevOps First" strategy, optimized for agentic workflows and context engineering.

---

## 📋 Table of Contents

1. [Core Principles](#-core-principles)
2. [Agent Squads & Responsibilities](#-agent-squads--responsibilities)
3. [Dual-Track Overview](#-dual-track-overview)
4. [Sprint Structure](#-sprint-structure)
5. [Discovery Track](#-discovery-track-continuous)
6. [Delivery Track](#-delivery-track)
7. [CI/CD Pipeline](#-cicd-pipeline)
8. [Documentation Standards](#-documentation-standards)
9. [Escalation Protocol](#-escalation-protocol)
10. [Tech Debt Management](#-tech-debt-management)
11. [Metrics & Reporting](#-metrics--reporting)
12. [Infrastructure Setup Projects](#️-infrastructure-setup-projects)

---

## 🎯 Core Principles

| Principle | Description |
|-----------|-------------|
| **Dual-Track Development** | Discovery and Delivery run in parallel. Discovery is always 1-2 sprints ahead. |
| **DevOps First** | Infrastructure and deployment strategy defined before code is written. |
| **Context Engineering** | Documentation optimized for agent parsing and historical understanding. |
| **Validated Backlog** | Only validated ideas enter the delivery backlog. |
| **Escalate Uncertainty** | Agents surface conflicts and uncertainty to users rather than assuming. |
| **Progressive Delivery** | High-risk changes deploy behind feature flags with gradual rollout. |

---

## 🤖 Agent Squads & Responsibilities

### Squad Assignments by Track

| Track | Stage | Primary Agents | Goal |
|-------|-------|----------------|------|
| **Discovery** | Continuous | `product-manager`, `explorer-agent`, `documentation-writer` | Validate problems, define solutions, maintain context |
| **Delivery** | Planning | `project-planner`, `orchestrator`, `security-auditor`, `test-engineer` | Technical planning, task breakdown, risk assessment |
| **Delivery** | Development | `devops-engineer`, `backend-specialist`, `frontend-specialist`, `mobile-developer` | Branching, implementation, unit tests |
| **Delivery** | Pre-PR QA | `test-engineer`, `security-auditor` | Automated tests, linting, security scanning |
| **Delivery** | PR Review | `debugger`, `performance-optimizer`, CodeRabbit | Code review, architecture review |
| **Delivery** | Post-Merge | `penetration-tester`, `seo-specialist`, `documentation-writer` | Deep audits (significant releases only) |
| **Delivery** | Validation | `product-manager`, `explorer-agent` | Metrics review, success validation |

### Agent Decision Authority

| Decision Type | Agent Authority | Escalation Trigger |
|---------------|-----------------|-------------------|
| Field Assignment (Priority, Size, Sprint) | Agent proposes with reasoning | Conflicting signals, missing context |
| Technical Approach | Agent recommends | Multiple valid approaches, security implications |
| Scope Changes | Agent flags only | Always escalate scope changes |
| Timeline Impact | Agent estimates | Impact > 2 days or affects other work |
| Architecture Decisions | Agent drafts ADR | Always requires user approval |

---

## 🔀 Dual-Track Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DUAL-TRACK MODEL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DISCOVERY TRACK (Continuous)              DELIVERY TRACK (Sprint-based)   │
│  ┌─────────────────────────┐               ┌─────────────────────────┐     │
│  │  Problem Identification │               │    Sprint Planning      │     │
│  │          ↓              │               │          ↓              │     │
│  │  User Research/Testing  │               │    Development          │     │
│  │          ↓              │    Validated  │          ↓              │     │
│  │  Solution Validation    │───Backlog────▶│    Pre-PR QA            │     │
│  │          ↓              │    Items      │          ↓              │     │
│  │  PRD Creation           │               │    PR Review            │     │
│  │          ↓              │               │          ↓              │     │
│  │  Backlog Ready          │               │    Deployment           │     │
│  └─────────────────────────┘               │          ↓              │     │
│                                            │    Validation           │     │
│  Discovery is always 1-2 sprints ahead     └─────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Track Synchronization

- **Sprint Planning**: Delivery pulls validated items from Discovery backlog
- **Sprint Review**: Delivery shares learnings that inform Discovery priorities
- **Retrospective**: Both tracks review process improvements together

---

## 📅 Sprint Structure

### Sprint Cadence: 2 Weeks

| Day | Activity | Participants |
|-----|----------|--------------|
| **Day 1** | Sprint Planning | All agents + User |
| **Days 2-9** | Development + Discovery | Respective squads |
| **Day 10** | Code Freeze / Final QA | Delivery squad |
| **Day 11** | Deployment | DevOps + User approval |
| **Day 12** | Validation Review | PM + User |
| **Day 12** | Sprint Retrospective | All agents + User |
| **Day 12** | Backlog Grooming | PM + Planner + User |

### Workflow Triggers
| Stage | Command | Purpose |
| :--- | :--- | :--- |
| **Discovery** | `/idea` | Scans draft issue, asks Socratic questions, updates PRD or Brief. |
| **Planning** | `/plan` | Converts to Review, creates `PLAN.md`, triggers Expert Panel. |
| **Development** | `/work` | Starts "In Progress", sets up Branch, triggers DevOps branching logic. |
| **QA / Verify** | `/test` | Runs `verify_all.py`, opens PR, triggers CodeRabbit check. |
| **Deploy** | `/ship` | Runs Pre-Flight check, asks for approval, Merges PR. |
| **Sprint** | `/sprint` | `start`, `end`, `retro`. Manages the 2-week cadence. |

### Sprint Planning Process

1. **PM presents** validated backlog items with PRDs/1-pagers
2. **Planner estimates** size and identifies dependencies
3. **User approves** sprint scope
4. **Planner creates** technical plans for approved items
5. **DevOps defines** branching strategy for the sprint

### Retrospective Format

```markdown
## Sprint [X] Retrospective

### What Went Well
- [Item]

### What Could Improve
- [Item]

### Action Items
| Action | Owner | Due |
|--------|-------|-----|
| [Action] | [Agent/User] | [Date] |

### Process Adjustments
- [Any workflow changes to implement]
```

---

## 🔍 Discovery Track (Continuous)

Discovery runs continuously, always staying 1-2 sprints ahead of Delivery.

### Stage 1: Problem Identification

**Trigger:**
- User creates Draft Issue (Status: `Discovery`)
- User invokes `/idea`
- PM batch reviews `Discovery` column

**Actions:**

1. **Context Gathering** (`@explorer-agent`)
   - Map technical context and existing systems
   - Check `docs/` for related documentation
   - Identify knowledge gaps

2. **Documentation Discovery** (`@documentation-writer`)
   - If docs missing/outdated: Interview user
   - Capture institutional knowledge for future reference

3. **Browser Gap Analysis** (`@product-manager`) - CRITICAL
   - View Board: `https://github.com/users/mjcr88/projects/1/views/1`
   - View Roadmap for dates and dependencies
   - Click cards to read Draft Issue details (not accessible via MCP)
   - Check for duplicates and related work

### Stage 2: Validation

**Actions:**

1. **Problem Validation**
   - Is this a real user problem or assumption?
   - What evidence supports this?
   - Who experiences this problem?

2. **Solution Sketching**
   - Lightweight prototypes or wireframes
   - Technical feasibility check with `@explorer-agent`
   - Identify risks early

3. **Stakeholder Alignment**
   - Present findings to user
   - Gather feedback before investing in full PRD

### Stage 3: Definition

**Classification** (PM proposes, User approves):

| Classification | Repo Label | Documentation Required |
|----------------|------------|------------------------|
| Bug (Critical) | `bug`, `P0` | 1-Pager |
| Bug (Standard) | `bug` | Issue description only |
| Enhancement (Small) | `enhancement` | 1-Pager |
| Enhancement (Large) | `enhancement` | Full PRD |
| New Feature | `enhancement` | Full PRD |
| Documentation | `documentation` | Issue description only |
| Tech Debt | `tech-debt` | 1-Pager |

**Field Assignment Heuristics** (Agent applies, escalates if uncertain):

| field | Heuristic |
|-------|-----------|
| **Priority** | P0: Production down or security vulnerability. P1: Significant user impact, no workaround. P2: Everything else. |
| **Size** | XS: < 2 hours. S: < 1 day. M: 1-3 days. L: 3-5 days. XL: > 5 days (should be broken down). |
| **Horizon** | Q1 26: Immediate focus (Current Quarter). Q2 26: Next prioritized block. Q3 26: Future strategic items. Q4 26: Long-term vision. |
| **Sprint** | P0 bugs → Current sprint. New features → Next sprint or backlog. Tech debt → Dedicated capacity per sprint. |

**Decision Gate:**

| Decision | Action |
|----------|--------|
| Don't Proceed | Move to `Closed` with reason documented |
| Proceed Later | Move to `Backlog` with target milestone |
| Proceed Now | Create documentation → Move to `Ready for Planning` |

**Artifacts:**
- Full PRD: `docs/product/prds/PRD-[000]-[feature-name].md`
- 1-Pager: `docs/product/briefs/BRIEF-[000]-[feature-name].md`
- Updated GitHub Issue with context and links

---

## 🚀 Delivery Track

### Stage 1: Planning (Status: `In Review`)

**Trigger:** Issue moved to `In Review` with PRD/1-Pager attached (or `/plan` command).

**Step 1.1: Technical Planning** (`@project-planner` + `@explorer-agent`)

1. Convert Draft to Full Issue (if needed) via Browser
2. Review PRD/1-Pager for technical implications
3. Create technical plan: `docs/plans/PLAN-[000].md`
4. Update `Size` field based on technical analysis

**Step 1.2: Task Breakdown** (`@project-planner`)

| Complexity | Approach |
|------------|----------|
| Simple (XS-S) | Markdown checklist in Issue body |
| Medium (M-L) | GitHub Sub-issues linked to parent |
| Complex (XL) | Parent issue becomes the "epic" - create sub-issues for each work package, each with own technical plan |

> **Note:** GitHub Projects doesn't have a native Epic type. For complex work, the parent Issue serves as the epic container, and sub-issues represent the individual work packages. Each sub-issue should link back to the parent and reference the relevant section of the technical plan.

**Step 1.3: Expert Panel Review** (`@orchestrator` coordinates)

| Agent | Reviews For |
|-------|-------------|
| `@security-auditor` | Auth, data exposure, injection risks |
| `@performance-optimizer` | N+1 queries, scaling concerns |
| `@test-engineer` | Testability, edge cases |

**Panel Output Format:**
```markdown
## Expert Panel Review: PLAN-[000]

### Security Assessment
- Status: ✅ Approved | ⚠️ Concerns | ❌ Blocked
- Findings: [Details]
- Required Changes: [If any]

### Performance Assessment
- Status: ✅ Approved | ⚠️ Concerns | ❌ Blocked
- Findings: [Details]
- Required Changes: [If any]

### Test Assessment
- Status: ✅ Approved | ⚠️ Concerns | ❌ Blocked
- Findings: [Details]
- Required Changes: [If any]
```

**Step 1.4: Approval**

- User reviews Technical Plan + Expert Panel output
- If approved → Move to `Ready for Development`
- If changes needed → Iterate on plan

---

### Stage 2: Development (Status: `In Progress`)

**Trigger:** User selects ticket from `Ready for Development` (or invokes `/work`).

**Step 2.1: DevOps First** (`@devops-engineer`)

1. Analyze current git state
2. Determine branching strategy:
   - Feature branch from `main`: `feature/[issue-number]-[short-name]`
   - Hotfix branch: `hotfix/[issue-number]-[short-name]`
3. Determine working directory strategy:
   - **Standard checkout**: Switch branches in main working directory (default for simple work)
   - **Git worktree**: Create separate working directory for the branch (recommended for complex/parallel work)
4. Set up any required infrastructure (feature flags, env variables)

#### Git Worktree Strategy

Git worktrees allow multiple working directories from the same repository, enabling parallel work without branch switching.

| Scenario | Recommended Approach |
|----------|---------------------|
| Single feature, no interruptions expected | Standard checkout |
| Feature work + likely hotfix interruptions | Use worktree for feature |
| Multiple agents working different branches | Separate worktree per branch |
| Long-running tests needed while coding | Worktree for test branch |
| Complex XL work with multiple sub-issues | Consider worktree per work package |

**Worktree Commands:**
```bash
# Create a worktree for a feature branch
git worktree add ../nido-feature-auth feature/142-user-auth

# List active worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../nido-feature-auth
```

**Worktree Naming Convention:**
```
../[repo-name]-[branch-type]-[short-name]
../nido-feature-auth
../nido-hotfix-login-fix
../nido-issue-142
```

> **Agent Note:** When using worktrees, always specify which working directory you're operating in when posting progress updates. This prevents confusion about which branch/context work is happening in.

**Step 2.2: Feature Flag Decision**

| Risk Level | Feature Flag Required? | Criteria |
|------------|------------------------|----------|
| Low | No | Isolated change, easy rollback via revert |
| Medium | Recommended | Touches shared code, moderate user impact |
| High | Required | Auth, payments, data migrations, core flows |

**Feature Flag Implementation:**
```javascript
// Example feature flag check
if (featureFlags.isEnabled('FEATURE_NAME', { userId })) {
  // New behavior
} else {
  // Existing behavior
}
```

**Step 2.3: Squad Activation** (`@orchestrator`)

Read "Team" field and invoke appropriate agents:
- `@frontend-specialist` - React/Next.js/UI
- `@backend-specialist` - APIs, business logic
- `@mobile-developer` - Always if frontend changes affect mobile
- `@database-architect` - Schema changes

**Step 2.4: Implementation**

1. Agents write code in feature branch
2. Agents write test cases (unit + integration)
3. Agents post progress comments on Issue:
   ```markdown
   ## Progress Update
   - Branch: `feature/142-user-auth`
   - Commits: [abc123, def456]
   - Status: Implementation complete, writing tests
   - Blockers: None
   ```

**Step 2.5: Completion**

- All code committed to feature branch
- Tests written and passing locally
- Move to `Pre-PR QA`

---

### Stage 3: Pre-PR QA (Status: `QA - Automated`)

**Trigger:** Work committed, moved to `QA - Automated`.

**Automated Checks** (target state - must all pass when implemented):

> ⚠️ **SETUP REQUIRED:** The following automated checks are the target state. See [Infrastructure Setup Projects](#infrastructure-setup-projects) for implementation status.

| Check | Tool (Suggested) | Blocking? | Status |
|-------|------------------|-----------|--------|
| Unit Tests | Jest / Pytest | Yes | 🔲 Not yet implemented |
| Integration Tests | Cypress / Playwright | Yes | 🔲 Not yet implemented |
| Linting | ESLint / Prettier | Yes | 🔲 Not yet implemented |
| Type Checking | TypeScript | Yes | 🔲 Not yet implemented |
| Security Scan | Snyk / npm audit | Yes (critical/high) | 🔲 Not yet implemented |
| Code Coverage | Istanbul / Coverage.py | Warning only | 🔲 Not yet implemented |

**Current State Workaround:**
Until automated checks are implemented, agents should:
1. Run available tests manually and report results
2. Perform manual code review for obvious issues
3. Document what checks were performed in PR description
4. Flag this as a gap in the PR checklist

**Agent Actions:**

1. `@test-engineer` runs available tests (or flags if none exist)
2. `@security-auditor` performs manual review for obvious security issues
3. If issues found → Return to `In Progress` with findings
4. If clean → Open PR, move to `PR Review`

---

### Stage 4: PR Review (Status: `QA - Review`)

**Trigger:** PR opened.

**Step 4.1: Automated Review**

- CodeRabbit AI review triggers automatically
- Wait 5-10 minutes for analysis

**Step 4.2: Agent Review**

| Agent | Reviews For |
|-------|-------------|
| `@debugger` | Logic errors, edge cases |
| `@performance-optimizer` | Query efficiency, memory usage |

**Step 4.3: Human Review**

- User reviews PR
- Address feedback
- Iterate until approved

**PR Checklist:**
```markdown
## PR Checklist

- [ ] Tests pass
- [ ] CodeRabbit concerns addressed
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] Feature flag configured (if applicable)
- [ ] Rollback plan documented (if high-risk)
```

**Transition:**
- Approved → Move to `Ready for Deployment`
- Changes Requested → Return to `In Progress`

---

### Stage 5: Deployment (Status: `Ready for Deployment`)

**Trigger:** PR approved, QA passed (or `/ship` command).

**Step 5.1: Pre-Flight Analysis** (`@devops-engineer`)

```markdown
## Pre-Flight Checklist: Issue #[000]

### Git Analysis
- [ ] No conflicts with main
- [ ] No conflicts with other active branches
- [ ] Commit history clean

### Impact Assessment
- Database Migration: Yes/No
- Downtime Required: Yes/No
- Feature Flag: Enabled/Disabled/N/A
- Affected Services: [List]

### Rollback Plan
- Method: [Revert commit / Feature flag disable / Database rollback]
- Estimated Rollback Time: [X minutes]
- Rollback Owner: [Agent/User]

### Deployment Window
- Recommended: [Immediate / Next maintenance window / Specific time]
- Reason: [Why]
```

**Step 5.2: User Approval**

- User reviews Pre-Flight Checklist
- User confirms deployment timing
- User approves merge

**Step 5.3: Deployment Execution**

1. Merge PR to main
2. CI/CD pipeline executes (see [CI/CD Pipeline](#-cicd-pipeline))
3. If feature flag: Enable for internal users first
4. Monitor for errors (15-30 minutes)
5. If clean: Gradual rollout (if flagged) or complete
6. Move to `Validation`

---

### Stage 6: Validation (Status: `Validation`)

**Trigger:** Deployment complete.

**Step 6.1: Metrics Review** (`@product-manager` + `@explorer-agent`)

Compare against success metrics defined in PRD:

```markdown
## Validation Report: Issue #[000]

### Success Metrics (from PRD)
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [Metric 1] | [Target] | [Actual] | ✅/⚠️/❌ |
| [Metric 2] | [Target] | [Actual] | ✅/⚠️/❌ |

### Error Monitoring
- New errors detected: Yes/No
- Error rate change: [+/-X%]

### User Feedback
- [Any immediate feedback received]

### Recommendation
- [ ] Success - Close issue
- [ ] Partial success - Follow-up issue needed
- [ ] Failed - Rollback recommended
```

**Step 6.2: Documentation Closure** (`@documentation-writer`)

- Update user-facing docs if needed
- Update technical docs if needed

**Step 6.3: Issue Closure**

```markdown
## Closing Statement

**Merged PR:** #[PR-number]
**Technical Plan:** [Link to PLAN-000.md]
**ADR:** [Link to ADR-000.md if applicable]
**Deployed:** [Environment URL]
**Validation:** [Link to Validation Report]

### Lessons Learned
- [Any insights for future work]
```

Move card to `Done`.

---

### Stage 7: Post-Merge Validation (Significant Releases Only)

**Trigger:** Issue tagged as `significant-release`.

**Criteria for Significant Release:**
- New feature affecting >10% of users
- Security-related changes
- Performance-critical changes
- Public API changes

**Actions:**

| Agent | Action | Timeline |
|-------|--------|----------|
| `@penetration-tester` | Security audit of deployed feature | Within 1 week |
| `@seo-specialist` | SEO impact assessment (if public-facing) | Within 1 week |
| `@performance-optimizer` | Production performance analysis | Within 3 days |
| `@documentation-writer` | ADR creation | Within 1 week |

**ADR Location:** `docs/decisions/ADR-[000]-[decision-name].md`

---

## 🔧 CI/CD Pipeline

> ⚠️ **SETUP REQUIRED:** The full CI/CD pipeline described below is the target state. Currently, multiple environments (staging/production) are not configured. See [Infrastructure Setup Projects](#infrastructure-setup-projects) for implementation plan.

### Current State vs Target State

| Component | Current State | Target State |
|-----------|---------------|--------------|
| Build automation | 🔲 Manual | Automated on push |
| Test automation | 🔲 Manual | Automated in pipeline |
| Security scanning | 🔲 Manual review | Automated scanning |
| Staging environment | 🔲 Not configured | Auto-deploy on merge |
| Production environment | ✅ Single environment | Separate from staging |
| Feature flags | 🔲 Not implemented | Flag service integrated |

### Target Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE (TARGET STATE)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │  BUILD  │──▶│  TEST   │──▶│ SECURITY│──▶│ STAGING │──▶│  PROD   │      │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘      │
│       │             │             │             │             │            │
│       ▼             ▼             ▼             ▼             ▼            │
│   Compile       Unit Tests    Dependency    Deploy to     Deploy to       │
│   Install       Integration   Scanning      Staging       Production      │
│   Lint          E2E Tests     SAST/DAST     Smoke Tests   Health Check    │
│   Type Check    Coverage      License       Manual QA     Monitoring      │
│                               Check         (optional)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Pipeline (Interim)

Until full CI/CD is implemented, follow this manual process:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE (CURRENT STATE)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐                    │
│  │  BUILD  │──▶│  TEST   │──▶│ REVIEW  │──▶│  PROD   │                    │
│  │ (Manual)│   │ (Manual)│   │  (PR)   │   │ (Manual)│                    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘                    │
│       │             │             │             │                          │
│       ▼             ▼             ▼             ▼                          │
│   Local build   Run available  CodeRabbit    Manual                       │
│   Local lint    tests locally  Agent review  deployment                   │
│                 Document gaps   User review   Monitor logs                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Target Stage Details

#### 1. Build Stage (Target)
```yaml
build:
  steps:
    - checkout
    - install_dependencies
    - lint
    - type_check
    - compile
  gate: All checks must pass
  timeout: 10 minutes
```

#### 2. Test Stage (Target)
```yaml
test:
  steps:
    - unit_tests
    - integration_tests
    - e2e_tests (on PR to main only)
    - coverage_report
  gate: 
    - All tests pass
    - Coverage >= 70% (warning if below)
  timeout: 20 minutes
```

#### 3. Security Stage (Target)
```yaml
security:
  steps:
    - dependency_scan (npm audit / pip audit)
    - sast_scan (CodeQL / Semgrep)
    - secret_detection (git-secrets / truffleHog)
    - license_check
  gate:
    - No critical/high vulnerabilities
    - No secrets detected
    - Licenses compatible
  timeout: 15 minutes
```

#### 4. Staging Stage (Target)
```yaml
staging:
  trigger: PR merged to main
  steps:
    - deploy_to_staging
    - smoke_tests
    - notify_team
  gate:
    - Deployment successful
    - Smoke tests pass
  manual_gate: Optional user approval for significant changes
  timeout: 15 minutes
```

#### 5. Production Stage (Target)
```yaml
production:
  trigger: Staging gate passed + User approval (if required)
  steps:
    - deploy_to_production
    - health_check
    - enable_monitoring
    - notify_team
  gate:
    - Health check passes
    - No error spike in first 5 minutes
  rollback_trigger:
    - Error rate > 5% increase
    - Health check fails
  timeout: 15 minutes
```

### Feature Flag Integration (Target)

```yaml
feature_flags:
  high_risk_changes:
    - Deploy with flag disabled
    - Enable for internal users (flag: internal_only)
    - Monitor 24 hours
    - Enable for 10% of users
    - Monitor 24 hours
    - Enable for 100% of users
    - Remove flag in next sprint
```

---

## 📚 Documentation Standards

### Optimized for Agentic Parsing

All documentation should follow these conventions to enable efficient agent processing:

#### Required Metadata Block

Every document must start with:

```markdown
---
id: [TYPE]-[000]
title: [Descriptive Title]
status: Draft | In Review | Approved | Superseded
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: [Agent or User]
related:
  - PRD-001
  - PLAN-001
  - Issue #123
tags: [tag1, tag2]
---
```

#### Standard Section Headers

Use consistent headers that agents can extract:

```markdown
## Problem Statement
[Clear description of the problem]

## Success Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [Metric] | [Target] | [How to measure] |

## Requirements
### Functional Requirements
- [REQ-001] [Requirement description]
- [REQ-002] [Requirement description]

### Non-Functional Requirements
- [NFR-001] [Requirement description]

## Constraints
- [Constraint 1]
- [Constraint 2]

## Dependencies
- [Dependency 1] - [Status]
- [Dependency 2] - [Status]

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk] | Low/Med/High | Low/Med/High | [Mitigation] |

## Out of Scope
- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

## Open Questions
- [ ] [Question 1]
- [x] [Resolved question] - Answer: [Answer]
```

### Document Types

| Type | Prefix | Location | When Required |
|------|--------|----------|---------------|
| PRD (Full) | PRD- | `docs/product/prds/` | Large features, new features |
| Brief (1-Pager) | BRIEF- | `docs/product/briefs/` | Small enhancements, bugs, tech debt |
| Technical Plan | PLAN- | `docs/plans/` | All items entering development |
| ADR | ADR- | `docs/decisions/` | Significant architectural decisions |
| Retrospective | RETRO- | `docs/retrospectives/` | Every sprint |

### Linkage Requirements

Every document must link to:
- Parent document (if exists)
- Related GitHub Issues
- Child documents (if exists)
- Superseded documents (if replacing something)

```markdown
## References

### Parent
- [PRD-001: User Authentication](./prds/PRD-001-user-auth.md)

### Related Issues
- [Issue #123](https://github.com/org/repo/issues/123)
- [Issue #124](https://github.com/org/repo/issues/124)

### Child Documents
- [PLAN-001: Auth Implementation](./plans/PLAN-001-auth-impl.md)
- [ADR-001: JWT vs Session Auth](./decisions/ADR-001-jwt-vs-session.md)

### Supersedes
- [PRD-000: Legacy Auth](./prds/PRD-000-legacy-auth.md) (Superseded)
```

---

## 🚨 Escalation Protocol

### When Agents Must Escalate

| Trigger | Example | Action |
|---------|---------|--------|
| **Conflicting Recommendations** | Security says don't ship, Performance says ship | Present both views with tradeoffs |
| **Missing Information** | PRD doesn't specify edge case behavior | Ask specific question |
| **Classification Ambiguity** | Unclear if bug or feature request | Present options with reasoning |
| **Scope Creep Detected** | Implementation reveals need for more work | Flag with estimate |
| **High-Risk Decision** | Architectural choice with long-term implications | Present options, require approval |
| **Confidence Below Threshold** | Agent unsure about technical approach | Explain uncertainty, ask for guidance |
| **Timeline Impact** | Work will take 2+ days longer than estimated | Notify with revised estimate |
| **External Dependency** | Blocked on third-party or other team | Flag blocker, propose alternatives |

### Escalation Format

```markdown
## 🚨 Escalation Required

**From:** @[agent-name]
**Regarding:** Issue #[number] - [Title]
**Type:** [Conflict | Missing Info | Ambiguity | Scope | Risk | Uncertainty | Timeline | Blocker]

### Situation
[Brief description of what triggered the escalation]

### Context
[Relevant background information]

### Options
1. **[Option A]**
   - Pros: [List]
   - Cons: [List]
   - Impact: [Timeline, cost, risk]

2. **[Option B]**
   - Pros: [List]
   - Cons: [List]
   - Impact: [Timeline, cost, risk]

3. **[Option C - if applicable]**
   - Pros: [List]
   - Cons: [List]
   - Impact: [Timeline, cost, risk]

### Agent Recommendation
[Agent's preferred option with reasoning, or "No recommendation - need user input"]

### Decision Required
@user - Please advise on which option to proceed with.

---
**Response Needed By:** [Date/Time if time-sensitive]
```

### Escalation Response Handling

1. User responds with decision
2. Agent documents decision in Issue comments
3. Agent updates relevant documents with decision
4. Agent proceeds with implementation
5. Decision logged for future reference

---

## 🔧 Tech Debt Management

### Tech Debt Tracking

All tech debt items should be:
1. Logged as GitHub Issues with `tech-debt` label
2. Documented with a 1-Pager (BRIEF)
3. Estimated for effort
4. Prioritized in backlog

### Tech Debt Categories

| Category | Description | Priority Guidance |
|----------|-------------|-------------------|
| **Critical** | Security vulnerabilities, data integrity risks | Treat as P0 bug |
| **High** | Performance issues affecting users, blocking other work | Address within 2 sprints |
| **Medium** | Code quality issues, test coverage gaps | Dedicated sprint capacity |
| **Low** | Refactoring nice-to-haves, documentation gaps | Address opportunistically |

### Sprint Capacity Allocation

Reserve dedicated capacity for tech debt each sprint:

| Sprint Load | Tech Debt Allocation |
|-------------|---------------------|
| Normal | 15-20% of capacity |
| Heavy (deadline) | 10% minimum |
| Light | 25-30% of capacity |

### Tech Debt Review

**Frequency:** Every 2 sprints (monthly)

**Participants:** `@project-planner`, `@devops-engineer`, `@security-auditor`, User

**Agenda:**
1. Review current tech debt backlog
2. Re-prioritize based on recent learnings
3. Identify new tech debt from recent work
4. Plan tech debt items for upcoming sprints
5. Celebrate tech debt items resolved

**Output:** Updated tech debt backlog with priorities and sprint assignments

---

## 📊 Metrics & Reporting

### Key Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Lead Time** | < 5 days for small items | Time from `Ready for Development` to `Done` |
| **Cycle Time** | < 3 days for small items | Time from `In Progress` to `Done` |
| **Deployment Frequency** | Multiple per week | Count of production deployments |
| **Change Failure Rate** | < 5% | Deployments requiring rollback |
| **Mean Time to Recovery** | < 1 hour | Time from incident to resolution |
| **Sprint Velocity** | Stable ±20% | Story points completed per sprint |
| **Discovery Throughput** | 2-3 items validated per sprint | Items moved from Discovery to Ready for Planning |

### Reporting Cadence

| Report | Frequency | Owner |
|--------|-----------|-------|
| Sprint Summary | End of sprint | `@project-planner` |
| Deployment Log | Continuous | `@devops-engineer` |
| Tech Debt Status | Monthly | `@project-planner` |
| Validation Summary | Per feature | `@product-manager` |

---

## 🏗️ Infrastructure Setup Projects

The following infrastructure components are required to achieve the target state described in this document. Each should be tracked as a separate initiative.

### Project 1: Automated Testing Infrastructure

**Goal:** Implement automated test suite that runs on every PR

**Components:**
| Component | Tool Options | Priority | Status |
|-----------|--------------|----------|--------|
| Unit test framework | Jest (JS) / Pytest (Python) | High | 🔲 Not started |
| Integration test framework | Cypress / Playwright | High | 🔲 Not started |
| Test runner in CI | GitHub Actions | High | 🔲 Not started |
| Code coverage reporting | Istanbul / Coverage.py | Medium | 🔲 Not started |

**Success Criteria:**
- [ ] Tests run automatically on PR creation
- [ ] PR blocked if tests fail
- [ ] Coverage report visible in PR

---

### Project 2: Linting & Code Quality

**Goal:** Enforce consistent code style and catch errors early

**Components:**
| Component | Tool Options | Priority | Status |
|-----------|--------------|----------|--------|
| JavaScript/TypeScript linting | ESLint | High | 🔲 Not started |
| Code formatting | Prettier | High | 🔲 Not started |
| Type checking | TypeScript strict mode | High | 🔲 Not started |
| Pre-commit hooks | Husky + lint-staged | Medium | 🔲 Not started |

**Success Criteria:**
- [ ] Linting runs automatically on PR
- [ ] PR blocked if lint errors exist
- [ ] Pre-commit hooks prevent bad commits locally

---

### Project 3: Security Scanning

**Goal:** Automated security vulnerability detection

**Components:**
| Component | Tool Options | Priority | Status |
|-----------|--------------|----------|--------|
| Dependency scanning | npm audit / Snyk / Dependabot | High | 🔲 Not started |
| Static analysis (SAST) | CodeQL / Semgrep | Medium | 🔲 Not started |
| Secret detection | git-secrets / truffleHog | High | 🔲 Not started |

**Success Criteria:**
- [ ] Dependency vulnerabilities flagged in PR
- [ ] Critical/high vulnerabilities block merge
- [ ] Secrets in code detected and blocked

---

### Project 4: Multi-Environment Setup

**Goal:** Separate staging and production environments

**Components:**
| Component | Description | Priority | Status |
|-----------|-------------|----------|--------|
| Staging environment | Mirror of production for testing | High | 🔲 Not started |
| Environment variables | Separate configs per environment | High | 🔲 Not started |
| Database per environment | Isolated data for staging/prod | High | 🔲 Not started |
| Deployment scripts | Automated deploy to each env | Medium | 🔲 Not started |

**Success Criteria:**
- [ ] Staging environment accessible at staging.* URL
- [ ] Merges to main auto-deploy to staging
- [ ] Production deploy requires manual approval
- [ ] Environments have isolated databases

---

### Project 5: Feature Flag System

**Goal:** Enable controlled rollout of high-risk features

**Components:**
| Component | Tool Options | Priority | Status |
|-----------|--------------|----------|--------|
| Feature flag service | LaunchDarkly / Unleash / Custom DB | Medium | 🔲 Not started |
| Client SDK integration | SDK for frontend/backend | Medium | 🔲 Not started |
| Flag management UI | Dashboard for toggling flags | Low | 🔲 Not started |

**Success Criteria:**
- [ ] Flags can be toggled without deployment
- [ ] Flags can target specific users/percentages
- [ ] Flag state auditable

---

### Project 6: Monitoring & Observability

**Goal:** Visibility into application health and errors

**Components:**
| Component | Tool Options | Priority | Status |
|-----------|--------------|----------|--------|
| Error tracking | Sentry / Rollbar | High | 🔲 Not started |
| Application metrics | Datadog / New Relic / Prometheus | Medium | 🔲 Not started |
| Log aggregation | Papertrail / Logtail / ELK | Medium | 🔲 Not started |
| Uptime monitoring | Pingdom / UptimeRobot | High | 🔲 Not started |

**Success Criteria:**
- [ ] Errors automatically captured and alerted
- [ ] Key metrics dashboarded
- [ ] Logs searchable and retained

---

### Infrastructure Prioritization

**Phase 1 (Foundation):** Get basic automation working
1. Automated Testing Infrastructure (Project 1)
2. Linting & Code Quality (Project 2)

**Phase 2 (Security & Environments):** Reduce risk
3. Security Scanning (Project 3)
4. Multi-Environment Setup (Project 4)

**Phase 3 (Advanced):** Enable sophisticated deployments
5. Feature Flag System (Project 5)
6. Monitoring & Observability (Project 6)

> **Note:** These projects should be created as GitHub Issues with the `infrastructure` label and tracked through the standard workflow. Each project is estimated as Size: L or XL and should have its own technical plan.

---

## 🔄 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | [Current Date] | Complete rewrite with dual-track model, CI/CD pipeline, escalation protocol, tech debt management |
| 1.0 | [Original Date] | Initial workflow definition |
