---
name: jira-management
description: Manage Jira issues effectively. Includes protocols for verification, asset retrieval, and safe transitions to prevent hallucinations and errors.
skills: [clean-code, plan-writing, documentation-templates]
---

# Jira Management Skill

Critical protocols for interacting with Jira. This skill enables agents to plan, track, and manage work while strictly preventing hallucinations.

## 🔴 CRITICAL RULES (Anti-Hallucination)

1.  **NEVER GUESS Issues**: Deeply verify content.
    *   ❌ WRONG: "I think the issues are X, Y, Z."
    *   ✅ CORRECT: Run `searchJiraIssuesUsingJql` with `parent = [EPIC_KEY]` to get the authoritative list.
2.  **COMPLETE Context Retrieval**:
    *   When analyzing an issue, you MUST fetch: `summary`, `description`, `status`, `comment`, and `attachment`.
    *   *Why?* Assets and critical updates often live in comments or attachments, not the description.
3.  **VERIFY Transitions**:
    *   Never assume a transition ID (e.g., "31" for Done).
    *   Always call `getTransitionsForJiraIssue` first to get the valid IDs for the specific issue status.
4.  **Documentation Standards (MANDATORY)**:
    *   Ticket descriptions MUST follow the most relevant structure from `documentation-templates`.
    *   **Feature/Epic** → Use `PRD.md` structure.
    *   **User Story** → Use `REQUIREMENT.md` structure (focus on user value).
    *   **Task** → Use `REQUIREMENT.md` structure (focus on technical execution).
    *   **API Change** → Use `API Documentation` structure.
    *   **Architecture Change** → Use `ADR` structure.
    *   **Bug Report** → Use a structured format: "Steps to Reproduce", "Expected Behavior", "Actual Behavior".

## Capabilities & Workflows

### 1. Creating Issues (Requirements to Tickets)
Convert raw requirements into Jira tickets. 
*   **Context**: Always check `getJiraProjectIssueTypesMetadata` first for valid types (Task, Bug, Epic).
*   **Description**: MUST be structured using `documentation-templates`.
*   **Action**: Use `createJiraIssue`.
```json
{
  "tool": "atlassian-mcp-server_createJiraIssue",
  "arguments": {
    "projectKey": "COMAPP",
    "summary": "[Title]",
    "description": "[content from REQUIREMENT.md or PRD.md template]",
    "issueTypeName": "Task",
    "cloudId": "[Use getAccessibleAtlassianResources]"
  }
}
```

### 2. Deep Fetching Issues (Search & Browse)
To truly understand a task, get the full picture (including comments/assets).
```json
{
  "tool": "atlassian-mcp-server_searchJiraIssuesUsingJql",
  "arguments": {
    "jql": "key in (COMAPP-123)",
    "fields": ["summary", "description", "status", "priority", "comment", "attachment"]
  }
}
```

### 3. Epics & Parents (Project Context)
To get all tasks under an Epic:
```json
{
  "tool": "atlassian-mcp-server_searchJiraIssuesUsingJql",
  "arguments": {
    "jql": "parent = COMAPP-26 ORDER BY key ASC",
    "fields": ["summary", "status", "assignee"]
  }
}
```

### 4. Transitioning Status
1.  **Check Available Transitions**:
    ```json
    { "tool": "atlassian-mcp-server_getTransitionsForJiraIssue", "arguments": { "issueIdOrKey": "COMAPP-123" } }
    ```
2.  **Execute Transition** (using the ID found above):
    ```json
    { "tool": "atlassian-mcp-server_transitionJiraIssue", "arguments": { "issueIdOrKey": "COMAPP-123", "transition": { "id": "21" } } }
    ```

## Common Pitfalls
*   **"Role does not exist"**: You tried to restrict comment visibility to a role that isn't configured in this project. Default to public unless requested.
*   **Missing Assets**: You planned a UI fix but didn't check the attachments, so you don't know what the icon looks like. **Always check `attachment` field.**
*   **Unstructured Descriptions**: Creating tickets with one-line descriptions. **ALWAYS use the templates.**
