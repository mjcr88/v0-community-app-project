# Work Package 1: Tech Debt Elimination + API Foundation

**Version**: 1.0  
**Created**: November 2024  
**Duration**: 5 days  
**Owner**: MJ + Cursor AI  
**Status**: Ready to Execute

---

## Executive Summary

### Objectives
1. Eliminate critical technical debt blocking future development
2. Complete Residents→Users database migration
3. Audit and fix all RLS policies for security
4. Build API-first architecture for future scalability
5. Optimize performance and fix known issues
6. Harden security across the application

### Success Metrics
- ✅ All 49 files migrated from `residents` to `users` table
- ✅ Zero RLS policy vulnerabilities
- ✅ Performance: Lighthouse mobile score 80+
- ✅ API foundation: 10+ endpoints live and tested
- ✅ Security: Rate limiting, input validation, file upload protection

### Budget Impact
- Cursor Pro: $40/month (required)
- Supabase Pro: $25/month (required for logs/debugging)
- Upstash (rate limiting): $0 (free tier sufficient)
- **Total**: $65/month

### Dependencies
- **Blocks**: All other work packages (WP2-12)
- **Required**: Access to production database, Cursor Pro subscription

---

## Cursor Setup & Configuration

### 1. Install Cursor

```bash
# Download from https://cursor.sh
# Install for your OS
# Sign in with your account
# Activate Pro subscription ($20/month)
```

### 2. Cursor Rules File

Create `.cursorrules` in your project root:

```markdown
# Ecovilla Community Platform - Cursor Rules

## Project Context
Multi-tenant SaaS platform for intentional communities built with Next.js 16, Supabase, and TypeScript.

## Core Principles
1. **Security First**: Always implement RLS policies, never skip authentication checks
2. **Type Safety**: Use TypeScript strictly, no `any` types unless absolutely necessary
3. **Mobile First**: Design and implement for mobile, enhance for desktop
4. **Accessibility**: WCAG 2.1 AA compliance is mandatory
5. **Performance**: Optimize queries, lazy load, use Next.js Image component

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + custom Ecovilla components
- **Maps**: Mapbox (migrating from Google Maps)
- **Forms**: React Hook Form + Zod validation

## Design System
- **Colors**: Forest Canopy (primary), Sunrise Orange (accent), Earth neutrals
- **Typography**: Inter (all text), JetBrains Mono (code/data)
- **Spacing**: 8-point grid system
- **Border Radius**: 12px (components), 16px (cards)
- **Animation**: 200-300ms duration, natural easing

## Code Patterns

### Data Fetching
```typescript
// ✅ CORRECT - Use centralized data layer
import { getResidents } from '@/lib/data/residents'
const residents = await getResidents(tenantId)

// ❌ WRONG - No direct Supabase calls in components
const { data } = await supabase.from('users').select('*')
```

### Components
```typescript
// ✅ CORRECT - Use Ecovilla component library
import { SectionCard } from '@/components/ecovilla/layout/section-card'
<SectionCard title="Events">{children}</SectionCard>

// ❌ WRONG - Don't rebuild common patterns
<Card><CardHeader><CardTitle>Events</CardTitle></CardHeader>...</Card>
```

### Error Handling
```typescript
// ✅ CORRECT - Use error boundaries and proper error types
try {
  const data = await fetchData()
} catch (error) {
  if (error instanceof DatabaseError) {
    // Handle DB error
  }
  throw error // Re-throw for error boundary
}

// ❌ WRONG - Don't swallow errors or use console.log
try {
  await fetchData()
} catch (error) {
  console.log(error) // Don't do this
}
```

### Styling
```typescript
// ✅ CORRECT - Use design tokens
className="text-forest-canopy bg-cloud rounded-lg p-space-4"

// ❌ WRONG - No hardcoded values
className="text-green-700 bg-gray-50 rounded-lg p-4"
```

### Multi-Tenancy
```typescript
// ✅ CORRECT - Always filter by tenant_id
const events = await supabase
  .from('events')
  .select('*')
  .eq('tenant_id', tenantId)

// ❌ WRONG - Never query without tenant isolation
const events = await supabase.from('events').select('*')
```

## File Structure
```
/app                     # Next.js app router
  /api/v1               # REST API endpoints
  /t/[slug]             # Tenant routes
  /backoffice           # Super admin
/lib                    # Business logic
  /data                 # Data access layer (NEW)
  /api                  # API utilities (NEW)
  /utils                # Pure functions
  /validation           # Zod schemas
/components
  /ecovilla             # Custom components
  /ui                   # shadcn base
```

## Naming Conventions
- **Components**: PascalCase (e.g., `SectionCard`)
- **Files**: kebab-case (e.g., `section-card.tsx`)
- **Functions**: camelCase (e.g., `getResidents`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types**: PascalCase (e.g., `ResidentWithRelations`)

## Database
- **Never use `SELECT *`**: Always specify columns
- **Always use RLS**: Every table must have policies
- **Foreign keys**: Always use proper constraints
- **Indexes**: Add for all foreign keys and frequently queried columns

## Security Checklist
- [ ] Authentication check in all protected routes
- [ ] Tenant isolation in all queries
- [ ] Input validation with Zod
- [ ] Rate limiting on API routes
- [ ] File upload validation (size, type)
- [ ] Sanitize user input
- [ ] Use parameterized queries (Supabase client handles this)

## Performance
- [ ] Use Next.js `<Image>` component for all images
- [ ] Implement loading states (skeletons)
- [ ] Lazy load below-fold content
- [ ] Optimize database queries (select only needed columns)
- [ ] Use React.memo() for expensive components
- [ ] Implement request deduplication

## Accessibility
- [ ] Semantic HTML (button, nav, main, article)
- [ ] ARIA labels for icon buttons
- [ ] Keyboard navigation support
- [ ] Focus indicators (2px outline)
- [ ] Color contrast 4.5:1 minimum
- [ ] Touch targets 44x44px minimum

## Git Workflow
- Branch naming: `feature/description` or `fix/description`
- Commit messages: Imperative mood ("Add feature" not "Added feature")
- PR description: What changed and why

## When in Doubt
1. Check design system documentation (@design-system.md)
2. Look for similar patterns in existing code
3. Prioritize user experience and security
4. Ask for clarification before making assumptions
```

### 3. Cursor Project Configuration

Add this to your workspace settings (`.vscode/settings.json` or Cursor settings):

```json
{
  "cursor.aiRules": ".cursorrules",
  "cursor.contextualCompletion": true,
  "cursor.maxTokens": 4000,
  "cursor.temperature": 0.2,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*)[\"'`]"]
  ]
}
```

### 4. Key Cursor Commands

**Most Important:**
- `Cmd/Ctrl + K` - Chat with Cursor (inline)
- `Cmd/Ctrl + L` - Open Cursor Chat sidebar
- `Cmd/Ctrl + Shift + L` - Composer Mode (multi-file edits)

**Context Shortcuts:**
- `@filename` - Add specific file to context
- `@folder` - Add entire folder to context
- `@docs` - Reference documentation
- `@web` - Search web for latest info

**Example Usage:**
```
Cmd + Shift + L (open Composer)

@lib/data/residents.ts @app/t/[slug]/admin/residents/page.tsx
Update this admin page to use the centralized data layer 
instead of direct Supabase calls. Follow the pattern in 
@app/t/[slug]/dashboard/page.tsx
```

---

## Day 1: Database Migration - Users Table

**Objective**: Complete the Residents→Users migration (49 files)

### Background

You started a migration to consolidate `residents` table into `users` table with role-based access. Currently:
- ✅ Database migration scripts run (scripts 022, 023, 024)
- ✅ 3 files updated
- ❌ 49 files remain

### Task 1.1: Verify Data Migration

**Duration**: 30 minutes

**SQL Verification Queries:**

```sql
-- Run these in Supabase SQL Editor

-- 1. Check all residents migrated
SELECT COUNT(*) FROM residents WHERE migrated_to_user_id IS NULL;
-- Should return: 0

-- 2. Verify users table has all residents
SELECT COUNT(*) FROM users WHERE role = 'resident';
-- Should match count of residents in old table

-- 3. Check data integrity (sample)
SELECT 
  r.id as old_id,
  r.first_name,
  r.last_name,
  r.email,
  u.id as new_id,
  r.migrated_to_user_id
FROM residents r
LEFT JOIN users u ON r.migrated_to_user_id = u.id
WHERE u.id IS NULL;
-- Should return: 0 rows (all residents have corresponding user)

-- 4. Verify junction tables migrated
SELECT COUNT(*) FROM resident_interests;
SELECT COUNT(*) FROM user_interests;
-- user_interests should have all records

SELECT COUNT(*) FROM resident_skills;
SELECT COUNT(*) FROM user_skills;
-- user_skills should have all records

-- 5. Check foreign key integrity
SELECT 
  ui.user_id,
  u.id as user_exists
FROM user_interests ui
LEFT JOIN users u ON ui.user_id = u.id
WHERE u.id IS NULL;
-- Should return: 0 rows (all foreign keys valid)
```

**If Issues Found:**

If any queries return unexpected results, STOP and investigate. Run migration scripts again:

```sql
-- Re-run migration (idempotent, safe to run multiple times)
-- From scripts/024_migrate_resident_data.sql
```

**Acceptance Criteria:**
- [ ] All residents have `migrated_to_user_id` set
- [ ] All junction tables (interests, skills, privacy) migrated
- [ ] No orphaned foreign keys
- [ ] Data matches between old and new tables

---

### Task 1.2: Update Critical Path Files (Auth & Onboarding)

**Duration**: 3 hours

**Files to Update (10 files):**

1. `app/t/[slug]/login/login-form.tsx`
2. `app/t/[slug]/invite/[token]/page.tsx`
3. `app/t/[slug]/invite/[token]/signup-form.tsx`
4. `app/t/[slug]/invite/[token]/validate-invite-action.ts`
5. `app/t/[slug]/invite/[token]/create-auth-user-action.ts`
6. `app/t/[slug]/onboarding/layout.tsx` ✅ (already done)
7. `app/t/[slug]/onboarding/profile/page.tsx`
8. `app/t/[slug]/onboarding/journey/page.tsx`
9. `app/t/[slug]/onboarding/interests/page.tsx`
10. `app/t/[slug]/onboarding/skills/page.tsx`

**Cursor Prompt (Composer Mode):**

```
I need to complete the residents→users table migration for authentication and onboarding files.

Context:
@app/t/[slug]/login/login-form.tsx
@app/t/[slug]/invite/[token]/page.tsx
@app/t/[slug]/invite/[token]/signup-form.tsx
@app/t/[slug]/invite/[token]/validate-invite-action.ts
@app/t/[slug]/invite/[token]/create-auth-user-action.ts
@app/t/[slug]/onboarding/profile/page.tsx
@app/t/[slug]/onboarding/journey/page.tsx
@app/t/[slug]/onboarding/interests/page.tsx
@app/t/[slug]/onboarding/skills/page.tsx

Migration Pattern:
1. Replace all instances of .from("residents") with .from("users").eq("role", "resident")
2. Replace all instances of .from("resident_interests") with .from("user_interests")
3. Replace all instances of .from("resident_skills") with .from("user_skills")
4. Replace all instances of .from("resident_privacy_settings") with .from("user_privacy_settings")
5. Replace column name "resident_id" with "user_id" in all queries
6. When inserting into users table, ALWAYS add: role: 'resident' as const
7. Maintain all existing functionality - this is ONLY a table name change

Critical Rules:
- DO NOT change any business logic
- DO NOT change any UI components
- DO NOT change any types (ResidentWithRelations is still valid)
- ONLY change database queries

Example Before/After:

BEFORE:
```typescript
const { data: resident } = await supabase
  .from("residents")
  .select("*")
  .eq("id", userId)
  .single()
```

AFTER:
```typescript
const { data: resident } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId)
  .eq("role", "resident")
  .single()
```

BEFORE:
```typescript
await supabase.from("residents").insert({
  first_name: "John",
  last_name: "Doe",
  tenant_id: tenantId,
})
```

AFTER:
```typescript
await supabase.from("users").insert({
  first_name: "John",
  last_name: "Doe",
  tenant_id: tenantId,
  role: 'resident' as const, // CRITICAL: Must add this
})
```

Please update all 9 files following this pattern. Preserve all existing functionality.
```

**Testing After Update:**

```bash
# 1. Test login flow
# - Navigate to /t/ecovilla/login
# - Login with existing credentials
# - Verify successful login
# - Verify redirect to dashboard

# 2. Test signup/invite flow
# - Create test invite token in database
# - Navigate to /t/ecovilla/invite/{token}
# - Complete signup
# - Verify user created in users table with role='resident'
# - Verify redirect to onboarding

# 3. Test onboarding flow
# - Complete all onboarding steps
# - Verify data saves to users table
# - Verify interests/skills save to user_interests/user_skills
# - Verify redirect to dashboard after completion
```

**Acceptance Criteria:**
- [ ] All auth flows work (login, signup, invite)
- [ ] Onboarding saves to users table
- [ ] No console errors
- [ ] Data appears correctly in database
- [ ] User experience unchanged

---

### Task 1.3: Update Admin Files

**Duration**: 2 hours

**Files to Update (14 files):**

11. `app/t/[slug]/admin/residents/page.tsx` ✅ (already done)
12. `app/t/[slug]/admin/residents/create/create-resident-form.tsx` ✅ (already done)
13. `app/t/[slug]/admin/residents/[id]/edit/page.tsx`
14. `app/t/[slug]/admin/residents/[id]/edit/edit-resident-form.tsx`
15. `app/t/[slug]/admin/residents/residents-table.tsx`
16. `app/t/[slug]/admin/families/page.tsx`
17. `app/t/[slug]/admin/families/[id]/edit/page.tsx`
18. `app/t/[slug]/admin/families/create/create-family-form.tsx`
19. `app/t/[slug]/admin/dashboard/page.tsx`
20. `lib/queries/get-residents.ts` (if exists)
21. `app/api/link-resident/route.ts`

**Cursor Prompt:**

```
Continue the residents→users migration for admin files.

Context:
@app/t/[slug]/admin/residents/[id]/edit/page.tsx
@app/t/[slug]/admin/residents/[id]/edit/edit-resident-form.tsx
@app/t/[slug]/admin/residents/residents-table.tsx
@app/t/[slug]/admin/families/page.tsx
@app/t/[slug]/admin/families/[id]/edit/page.tsx
@app/t/[slug]/admin/families/create/create-family-form.tsx
@app/t/[slug]/admin/dashboard/page.tsx
@app/api/link-resident/route.ts

Apply the same migration pattern:
1. Replace "residents" table → "users" table with role filter
2. Replace "resident_*" junction tables → "user_*"
3. Replace "resident_id" column → "user_id"
4. Add role: 'resident' to all inserts

Pay special attention to:
- residents-table.tsx: Likely has complex queries with joins
- admin dashboard: May have aggregate queries (COUNT, etc.)
- link-resident API: Critical for auth linking

Follow the same before/after pattern as previous files.
Test each admin feature after updating.
```

**Testing:**
- [ ] Admin can view residents list
- [ ] Admin can create new resident
- [ ] Admin can edit resident
- [ ] Admin can create family
- [ ] Admin can assign residents to families
- [ ] Admin dashboard stats are correct

---

### Task 1.4: Update Resident Feature Files

**Duration**: 2 hours

**Files to Update (15 files):**

23. `app/t/[slug]/dashboard/page.tsx`
24. `app/t/[slug]/dashboard/settings/profile/page.tsx`
25. `app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx`
26. `app/t/[slug]/dashboard/settings/privacy/page.tsx`
27. `app/t/[slug]/dashboard/settings/privacy/privacy-settings-form.tsx`
28. `app/t/[slug]/dashboard/neighbours/page.tsx`
29. `app/t/[slug]/dashboard/neighbours/neighbours-table.tsx`
30. `app/t/[slug]/dashboard/neighbours/[id]/page.tsx`
31. `app/t/[slug]/dashboard/layout.tsx`

**Cursor Prompt:**

```
Complete residents→users migration for resident dashboard and features.

Context:
@app/t/[slug]/dashboard/page.tsx
@app/t/[slug]/dashboard/settings/profile/page.tsx
@app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx
@app/t/[slug]/dashboard/settings/privacy/page.tsx
@app/t/[slug]/dashboard/settings/privacy/privacy-settings-form.tsx
@app/t/[slug]/dashboard/neighbours/page.tsx
@app/t/[slug]/dashboard/neighbours/neighbours-table.tsx
@app/t/[slug]/dashboard/neighbours/[id]/page.tsx
@app/t/[slug]/dashboard/layout.tsx

Apply migration pattern consistently.

Special attention:
- neighbours/page.tsx: Likely has search/filter queries
- privacy settings: Uses user_privacy_settings table
- profile: May have complex joins (family, lot, interests, skills)

Ensure all resident-facing features continue working.
```

**Testing:**
- [ ] Dashboard loads correctly
- [ ] Profile editing works
- [ ] Privacy settings save correctly
- [ ] Neighbors directory displays
- [ ] Search/filter works
- [ ] Public profile view works

---

### Task 1.5: Update Remaining Files

**Duration**: 2 hours

**Find all remaining references:**

```bash
# Find all files still referencing old tables
grep -r "from(\"residents\")" app/ lib/ components/
grep -r "from(\"resident_interests\")" app/ lib/ components/
grep -r "from(\"resident_skills\")" app/ lib/ components/
grep -r "from(\"resident_privacy_settings\")" app/ lib/ components/
```

**Cursor Prompt:**

```
Find and update any remaining files that reference the old residents table.

Task:
1. Search the entire codebase for:
   - .from("residents")
   - .from("resident_interests")
   - .from("resident_skills")
   - .from("resident_privacy_settings")
   - resident_id (as column name)

2. Update each instance following the migration pattern

3. Pay attention to:
   - Utility functions in /lib
   - Shared components
   - API routes
   - Server actions

4. List all files you update so I can test them

Do a thorough search - we need to catch every instance.
```

**Acceptance Criteria:**
- [ ] Zero instances of `.from("residents")` remain
- [ ] Zero instances of old junction table references
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Full app navigation works without errors

---

### Task 1.6: Migration Verification & Testing

**Duration**: 1 hour

**Manual Testing Checklist:**

```markdown
## Auth & Onboarding
- [ ] Login works
- [ ] Signup works
- [ ] Invite flow works
- [ ] Onboarding saves all data
- [ ] Profile picture upload works

## Admin Functions
- [ ] View residents list
- [ ] Create resident
- [ ] Edit resident
- [ ] Delete resident (if applicable)
- [ ] Create family
- [ ] Assign resident to family
- [ ] Assign lot to resident

## Resident Features
- [ ] Dashboard loads
- [ ] View own profile
- [ ] Edit profile
- [ ] Update privacy settings
- [ ] View neighbors
- [ ] Search neighbors
- [ ] View public profile
- [ ] All interests/skills display

## Data Integrity
- [ ] No data loss (compare counts before/after)
- [ ] All relationships intact (families, lots)
- [ ] Privacy settings preserved
- [ ] Interests/skills preserved
```

**Rollback Plan (If Issues):**

If critical issues found:

```sql
-- Rollback strategy:
-- 1. Don't drop old tables yet (residents, resident_*, etc.)
-- 2. They still exist with migrated_to_user_id column
-- 3. Can revert code changes via git
-- 4. Can re-run migration scripts

-- To revert data (ONLY if absolutely necessary):
-- Note: This is destructive, use with caution

BEGIN;

-- Delete migrated users (keep original residents)
DELETE FROM users 
WHERE role = 'resident' 
AND id IN (SELECT migrated_to_user_id FROM residents);

-- Reset migration tracking
UPDATE residents SET migrated_to_user_id = NULL;

COMMIT;
```

---

## Day 2: RLS Audit & Security

**Objective**: Audit and fix all RLS policies, add missing indexes

### Task 2.1: RLS Policy Audit

**Duration**: 2 hours

**Current State** (validated from production export):
- ✅ **42 tables** with RLS enabled (100% coverage)
- ✅ **114 total policies** (avg 2.7 per table)
- ✅ Helper functions exist: `get_user_role()`, `get_user_tenant_id()`
- ⚠️ **4 policies** need review for recursion/privacy scope
- ⚠️ **3 deprecated tables** to cleanup after Day 1 migration

**Automated Analysis:**

Create and run this script:

```sql
-- scripts/051_audit_rls_policies.sql

-- 1. Find all tables without RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = pg_tables.tablename
);
-- Should return: 0 rows (all tables have RLS)

-- 2. Find recursive policy patterns (DANGEROUS)
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'residents')
AND qual LIKE '%FROM users%'
OR qual LIKE '%FROM residents%';
-- Review each result for recursion risk

-- 3. Find policies missing tenant_id filter
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  SELECT tablename FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
)
AND (qual NOT LIKE '%tenant_id%' AND qual NOT LIKE '%get_user_tenant_id%');
-- Review each - might be intentional (super_admin policies)

-- 4. List all policies for review
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Manual Review - High Priority Tables:**

```sql
-- CRITICAL: Review these 4 policies for potential recursion
SELECT pg_get_policydef(oid) 
FROM pg_policy 
WHERE policyname IN (
  'residents_view_based_on_scope',
  'residents_can_view_privacy_settings_in_scope'
);
-- Action: Verify these don't query users table recursively

-- Events policies (5 policies identified)
SELECT * FROM pg_policies WHERE tablename = 'events';
-- Expected: Event creators can delete/update, residents can view tenant events, admins can update any

-- Check-ins policies (9 policies - most granular)
SELECT * FROM pg_policies WHERE tablename = 'check_ins';
-- Verify: community vs neighborhood vs private visibility scopes work

-- Exchange listings (8 policies - highly granular)
SELECT * FROM pg_policies WHERE tablename = 'exchange_listings';
-- Verify: "verified residents" check works, state machine permissions correct

-- Notifications policies (3 policies - polymorphic)
SELECT * FROM pg_policies WHERE tablename = 'notifications';
-- Critical: Verify recipient can ONLY see their own notifications

-- Users policies (7 policies - CRITICAL)
SELECT * FROM pg_policies WHERE tablename = 'users';
-- Verify: residents_view_based_on_scope respects privacy settings
-- Verify: no recursion via helper functions

-- Privacy scope verification
SELECT * FROM pg_policies WHERE policyname LIKE '%scope%';
-- Must review: How do privacy settings filter which users are visible?
```

**Common Issues to Fix:**

**Issue 1: Recursive Policy**

```sql
-- BEFORE (DANGEROUS):
CREATE POLICY "policy_name" ON users
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() -- ⚠️ RECURSION
  )
);

-- AFTER (SAFE):
CREATE POLICY "policy_name" ON users
USING (auth.uid() = id);
-- OR use helper function
USING (get_user_role() = 'admin');
```

**Issue 2: Missing Tenant Isolation**

```sql
-- BEFORE (INSECURE):
CREATE POLICY "residents_select" ON locations
FOR SELECT
USING (true); -- ❌ Any resident can see any tenant's data!

-- AFTER (SECURE):
CREATE POLICY "residents_select" ON locations
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
);
```

**Cursor Prompt for Fixes:**

```
Analyze and fix RLS policies based on audit results.

Context:
@scripts/051_audit_rls_policies.sql (audit results)
@scripts/ (all existing policy files)

Task:
1. Review all policies flagged in audit
2. Fix any recursive patterns
3. Ensure tenant isolation on all tenant-scoped tables
4. Verify super_admin, tenant_admin, resident permissions are correct

For each fix:
1. Create a new migration script: scripts/052_fix_rls_{table_name}.sql
2. Document what was wrong and why the fix works
3. Include rollback SQL in comments

Focus on these high-priority tables:
- users (avoid recursion)
- events (verify visibility scopes)
- locations (verify all types accessible)
- notifications (verify polymorphic queries)
- exchange_listings, exchange_transactions
```

**Known Issues from Validation:**

1. **Potential duplicate policies** (verify if both needed):
   - `event_rsvps`: Two "manage own RSVPs" policies
   - `saved_events`: Two similar "manage saved events" policies
   - `pets`: "manage" and "update" seem redundant

2. **"Anyone can view" policies** (verify tenant isolation):
   - `check_in_neighborhoods`: "Anyone can view check-in neighborhoods"
   - Need to ensure this is scoped to tenant

3. **Deprecated tables** (cleanup after Day 1):
   - `residents` table (4 policies)
   - `resident_interests` (2 policies)
   - `resident_skills` (2 policies)

**Acceptance Criteria:**
- [ ] No recursive policies (verify 4 critical policies)
- [ ] All tables have tenant isolation (where applicable)
- [ ] All permission levels tested (super_admin, tenant_admin, resident)
- [ ] No cross-tenant data leaks
- [ ] Privacy scopes tested (see Task 2.4)
- [ ] Deprecated table policies removed after Day 1 migration

---

### Task 2.2: Add Missing Indexes

**Duration**: 1 hour

**Index Analysis:**

```sql
-- Find missing indexes on foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexname LIKE '%' || kcu.column_name || '%'
  )
ORDER BY tc.table_name, kcu.column_name;
```

**Create Index Migration:**

```sql
-- scripts/052_add_performance_indexes.sql

-- Junction tables
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id 
  ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id 
  ON user_interests(interest_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id 
  ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id 
  ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_open_to_requests 
  ON user_skills(open_to_requests) WHERE open_to_requests = true;

-- Core tables
CREATE INDEX IF NOT EXISTS idx_locations_tenant_id 
  ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_type 
  ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_neighborhood_id 
  ON locations(neighborhood_id);

CREATE INDEX IF NOT EXISTS idx_events_tenant_id 
  ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date 
  ON events(start_date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id 
  ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id 
  ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
  ON notifications(is_read) WHERE is_read = false;

-- Polymorphic notification indexes (partial)
CREATE INDEX IF NOT EXISTS idx_notifications_exchange_transaction 
  ON notifications(exchange_transaction_id) 
  WHERE exchange_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_event 
  ON notifications(event_id) 
  WHERE event_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_tenant_role 
  ON users(tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_events_tenant_date 
  ON events(tenant_id, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_locations_tenant_type 
  ON locations(tenant_id, type);

-- Privacy settings indexes (NEW - added from validation)
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id 
  ON user_privacy_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_visibility 
  ON user_privacy_settings(profile_visibility, contact_visibility, location_visibility);

-- Check-in visibility indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_visibility_scope 
  ON check_ins(visibility_scope);

CREATE INDEX IF NOT EXISTS idx_check_ins_creator_tenant 
  ON check_ins(created_by, tenant_id);
```

**Test Index Performance:**

```sql
-- Before adding indexes, run EXPLAIN ANALYZE on common queries
EXPLAIN ANALYZE
SELECT * FROM events
WHERE tenant_id = 'xxx'
  AND start_date >= NOW()
ORDER BY start_date;
-- Note: Seq Scan cost

-- After adding indexes, run again
EXPLAIN ANALYZE
SELECT * FROM events
WHERE tenant_id = 'xxx'
  AND start_date >= NOW()
ORDER BY start_date;
-- Should use: Index Scan using idx_events_tenant_date
-- Cost should be significantly lower
```

**Acceptance Criteria:**
- [ ] All foreign keys have indexes
- [ ] Privacy settings queries optimized
- [ ] Common query patterns use indexes (verify with EXPLAIN)
- [ ] No performance regressions
- [ ] Index sizes are reasonable (<1GB for your scale)

---

### Task 2.4: Privacy Scope Testing

**Duration**: 1.5 hours

**Background**: The validation identified 2 critical privacy-aware policies that need testing:
- `residents_view_based_on_scope` on `users` table
- `residents_can_view_privacy_settings_in_scope` on `user_privacy_settings` table

These policies should filter which users are visible based on privacy settings.

**Test Setup:**

```sql
-- Create test users with different privacy settings
-- Run as super_admin or service_role

-- Test User 1: All private
INSERT INTO user_privacy_settings (user_id, profile_visibility, contact_visibility, location_visibility, interests_visibility)
VALUES (
  'test-user-1-id',
  'private',
  'private',
  'private',
  'private'
);

-- Test User 2: Neighborhood visible
INSERT INTO user_privacy_settings (user_id, profile_visibility, contact_visibility, location_visibility)
VALUES (
  'test-user-2-id',
  'neighborhood',
  'neighborhood',
  'neighborhood'
);

-- Test User 3: Community (public to tenant)
INSERT INTO user_privacy_settings (user_id, profile_visibility, contact_visibility, location_visibility)
VALUES (
  'test-user-3-id',
  'community',
  'community',
  'community'
);
```

**Privacy Test Scenarios:**

```markdown
## Scenario 1: Private Profile
**Setup**: User A has all privacy set to 'private'
**Test as different resident B**:
- [ ] CANNOT see User A's bio
- [ ] CANNOT see User A's email
- [ ] CANNOT see User A's phone
- [ ] CANNOT see User A's interests
- [ ] CANNOT see User A's skills
- [ ] CAN see User A's name (minimum visible)
- [ ] CAN see User A's profile picture (if set)

## Scenario 2: Neighborhood Visibility
**Setup**: User A has location_visibility='neighborhood', lives in Neighborhood X
**Test as User B in same neighborhood**:
- [ ] CAN see User A's profile
- [ ] CAN see User A's location
**Test as User C in different neighborhood**:
- [ ] CANNOT see User A in directory

## Scenario 3: Community Visibility  
**Setup**: User A has profile_visibility='community'
**Test as any resident in same tenant**:
- [ ] CAN see User A in directory
- [ ] CAN see public fields

## Scenario 4: Admin Override
**Setup**: Any privacy settings
**Test as tenant_admin**:
- [ ] CAN see ALL user fields regardless of privacy
**Test as super_admin**:
- [ ] CAN see ALL user fields in all tenants

## Scenario 5: Interests & Skills Privacy
**Setup**: User A has interests_visibility='private'
**Test as different resident**:
- [ ] User A does NOT appear in "Find by Interest" searches
- [ ] User A's interests NOT visible on profile
**Setup**: User B has interests_visibility='community'
**Test as any resident**:
- [ ] User B appears in interest searches
- [ ] User B's interests visible on profile
```

**SQL Queries to Test Policies:**

```sql
-- 1. Get policy definition for residents_view_based_on_scope
SELECT pg_get_policydef(oid) 
FROM pg_policy 
WHERE policyname = 'residents_view_based_on_scope';
-- Review: Does it check user_privacy_settings?

-- 2. Test as resident (use Supabase auth context)
-- This should respect privacy settings
SELECT id, first_name, last_name, email, phone, bio
FROM users
WHERE tenant_id = 'your-tenant-id'
  AND role = 'resident';
-- Expected: Users with private settings should have limited fields

-- 3. Test neighbor directory query
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.profile_picture_url,
  l.lot_number,
  n.name as neighborhood
FROM users u
LEFT JOIN lots l ON u.lot_id = l.id
LEFT JOIN neighborhoods n ON l.neighborhood_id = n.id
WHERE u.tenant_id = 'your-tenant-id'
  AND u.role = 'resident';
-- Expected: Only users visible per privacy scope
```

**Cursor Prompt for Testing:**

```
Test privacy scope implementation.

Context:
@scripts/003_fix_rls_policies.sql (helper functions)
@Database (user_privacy_settings table)

Task:
1. Create 3 test users with different privacy settings (private, neighborhood, community)
2. Test queries as different user contexts:
   - As same-neighborhood resident
   - As different-neighborhood resident  
   - As tenant_admin
3. Verify privacy filtering works:
   - Private users: minimal info visible
   - Neighborhood: visible to same neighborhood
   - Community: visible to all in tenant
4. Test user_interests and user_skills respect privacy

Document any failures - we may need to update RLS policies.
```

**Acceptance Criteria:**
- [ ] Privacy settings properly filter user visibility
- [ ] Neighborhood scope works (same neighborhood can see, others cannot)
- [ ] Community scope works (all tenant members can see)
- [ ] Private scope works (minimal info only)
- [ ] Admin override works (admins see everything)
- [ ] No privacy leaks in junction tables (interests, skills)
- [ ] All 5 test scenarios pass

**If Privacy Issues Found:**

Create migration script to fix policies:

```sql
-- scripts/053_fix_privacy_scope_policies.sql

-- Drop and recreate residents_view_based_on_scope
-- with proper privacy checks
DROP POLICY IF EXISTS "residents_view_based_on_scope" ON users;

CREATE POLICY "residents_view_based_on_scope" ON users
FOR SELECT
USING (
  -- User viewing their own data
  auth.uid() = id
  OR
  -- Super admin sees all
  get_user_role() = 'super_admin'
  OR
  -- Tenant admin sees all in their tenant
  (get_user_role() = 'tenant_admin' AND tenant_id = get_user_tenant_id())
  OR
  -- Residents see based on privacy settings
  (
    role = 'resident'
    AND tenant_id = get_user_tenant_id()
    AND (
      -- Community visibility
      EXISTS (
        SELECT 1 FROM user_privacy_settings ups
        WHERE ups.user_id = users.id
        AND ups.profile_visibility = 'community'
      )
      OR
      -- Neighborhood visibility (same neighborhood)
      EXISTS (
        SELECT 1 FROM user_privacy_settings ups
        JOIN users viewer ON viewer.id = auth.uid()
        JOIN lots viewer_lot ON viewer.lot_id = viewer_lot.id
        JOIN lots user_lot ON users.lot_id = user_lot.id
        WHERE ups.user_id = users.id
        AND ups.profile_visibility = 'neighborhood'
        AND viewer_lot.neighborhood_id = user_lot.neighborhood_id
      )
    )
  )
);
```

---

### Task 2.3: Security Hardening

**Duration**: 2 hours

**2.3.1: Add Rate Limiting**

**Setup Upstash:**

```bash
# 1. Sign up at https://upstash.com
# 2. Create Redis database (free tier)
# 3. Get connection details

# 4. Add to .env.local
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# 5. Install package
npm install @upstash/ratelimit @upstash/redis
```

**Create Rate Limit Utility:**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Different limits for different operations
export const rateLimits = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
    analytics: true,
    prefix: 'ratelimit:api',
  }),
  
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 login attempts per 15 min
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
  
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '1 h'), // 3 uploads per hour
    analytics: true,
    prefix: 'ratelimit:upload',
  }),
}

export async function rateLimit(
  request: Request,
  type: keyof typeof rateLimits
) {
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'anonymous'
  
  const { success, limit, remaining, reset } = await rateLimits[type].limit(ip)
  
  if (!success) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      }
    })
  }
  
  return null // Allow request
}
```

**Cursor Prompt:**

```
Add rate limiting to all API routes.

Context:
@lib/rate-limit.ts (utility created)
@app/api (all API routes)

Task:
1. Import rateLimit from @/lib/rate-limit
2. Add rate limiting to all API endpoints
3. Use appropriate limit type:
   - 'api' for general endpoints (events, locations, etc.)
   - 'auth' for login/signup routes
   - 'upload' for file upload endpoints

Example:
```typescript
// app/api/v1/events/route.ts
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  // Add rate limiting first
  const rateLimitResponse = await rateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse
  
  // ... rest of handler
}
```

Apply this pattern to all API routes in:
- /app/api/v1/*
- /app/api/* (any other API routes)
```

**2.3.2: Add Input Validation**

**Create Validation Schemas:**

```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

// User/Resident schemas
export const residentSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  birth_date: z.string().datetime().optional().nullable(),
  birth_country: z.string().max(100).optional().nullable(),
  current_country: z.string().max(100).optional().nullable(),
})

export const locationSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'facility', 'lot', 'walking_path', 'neighborhood', 
    'boundary', 'protection_zone', 'easement', 'playground',
    'public_street', 'green_area', 'recreational_zone'
  ]),
  description: z.string().max(1000).optional().nullable(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional().nullable(),
  boundary_coordinates: z.array(z.tuple([z.number(), z.number()])).optional().nullable(),
  path_coordinates: z.array(z.tuple([z.number(), z.number()])).optional().nullable(),
})

export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional().nullable(),
  location_type: z.enum(['community_location', 'custom_temporary']).optional(),
  capacity: z.number().int().positive().optional().nullable(),
  visibility_scope: z.enum(['community', 'neighborhood', 'invite_only']),
})

// File upload validation
export const imageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be JPEG, PNG, or WebP'
    ),
})

export const geoJSONUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File must be less than 10MB')
    .refine(
      (file) => file.type === 'application/json' || file.name.endsWith('.geojson'),
      'File must be GeoJSON'
    ),
})
```

**Cursor Prompt:**

```
Add Zod validation to all forms and API routes.

Context:
@lib/validation/schemas.ts (schemas created)
@app (all form components)
@app/api (all API routes)

Task:
1. For all forms using react-hook-form:
   - Import appropriate schema
   - Add zodResolver
   
Example:
```typescript
import { residentSchema } from '@/lib/validation/schemas'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(residentSchema),
  defaultValues: { ... }
})
```

2. For all API routes that accept POST/PATCH:
   - Validate request body with schema
   - Return 400 with validation errors
   
Example:
```typescript
export async function POST(request: Request) {
  const body = await request.json()
  
  const validation = eventSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.errors
    }, { status: 400 })
  }
  
  const data = validation.data
  // ... use validated data
}
```

Apply to all forms in:
- /app/t/[slug]/admin/*
- /app/t/[slug]/onboarding/*
- /app/t/[slug]/dashboard/*

And all API routes accepting input.
```

**2.3.3: File Upload Security**

```typescript
// lib/upload-security.ts

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/json']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

export function validateImageUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
  }
  
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.')
  }
  
  return true
}

export function validateGeoJSONUpload(file: File) {
  if (file.type !== 'application/json' && !file.name.endsWith('.geojson')) {
    throw new Error('Invalid file type. Only GeoJSON files are allowed.')
  }
  
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.')
  }
  
  return true
}

// Sanitize filename (prevent path traversal)
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .substring(0, 255) // Limit length
}
```

**Acceptance Criteria:**
- [ ] Rate limiting active on all API routes
- [ ] All forms validated with Zod
- [ ] File uploads validated (type and size)
- [ ] No unvalidated user input reaches database

---

## Day 3: Architecture Refactor

**Objective**: Create data layer, improve code organization

### Task 3.1: Create Data Layer Structure

**Duration**: 2 hours

**Create Directory:**

```bash
mkdir -p lib/data
```

**Create Data Layer Files:**

**lib/data/residents.ts:**

```typescript
// lib/data/residents.ts
import { createServerClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/lib/errors'

export interface GetResidentsOptions {
  tenantId: string
  filters?: {
    neighborhoodId?: string
    lotId?: string
    familyUnitId?: string
    search?: string
  }
  pagination?: {
    page: number
    limit: number
  }
  include?: {
    lot?: boolean
    family?: boolean
    interests?: boolean
    skills?: boolean
  }
}

export async function getResidents(options: GetResidentsOptions) {
  const supabase = await createServerClient()
  
  let query = supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      profile_picture_url,
      bio,
      journey_stage,
      lot_id,
      family_unit_id,
      ${options.include?.lot ? 'lots (lot_number, neighborhoods (name)),' : ''}
      ${options.include?.family ? 'family_units (name),' : ''}
      ${options.include?.interests ? 'user_interests (interests (name)),' : ''}
      ${options.include?.skills ? 'user_skills (skills (name), open_to_requests),' : ''}
    `, { count: 'exact' })
    .eq('role', 'resident')
    .eq('tenant_id', options.tenantId)
  
  // Apply filters
  if (options.filters?.neighborhoodId) {
    query = query.eq('lots.neighborhood_id', options.filters.neighborhoodId)
  }
  
  if (options.filters?.lotId) {
    query = query.eq('lot_id', options.filters.lotId)
  }
  
  if (options.filters?.familyUnitId) {
    query = query.eq('family_unit_id', options.filters.familyUnitId)
  }
  
  if (options.filters?.search) {
    query = query.or(`first_name.ilike.%${options.filters.search}%,last_name.ilike.%${options.filters.search}%`)
  }
  
  // Apply pagination
  if (options.pagination) {
    const { page, limit } = options.pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
  }
  
  const { data, error, count } = await query
  
  if (error) {
    throw new DatabaseError('Failed to fetch residents', error)
  }
  
  return { data, total: count || 0 }
}

export async function getResident(userId: string) {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      lots (lot_number, address, neighborhoods (name, id)),
      family_units (name, id),
      user_interests (interests (id, name)),
      user_skills (skills (id, name), open_to_requests),
      user_privacy_settings (*)
    `)
    .eq('id', userId)
    .eq('role', 'resident')
    .single()
  
  if (error) {
    throw new DatabaseError('Failed to fetch resident', error)
  }
  
  return data
}

export async function createResident(data: {
  first_name: string
  last_name: string
  email: string
  tenant_id: string
  phone?: string
  lot_id?: string
  family_unit_id?: string
}) {
  const supabase = await createServerClient()
  
  const { data: resident, error } = await supabase
    .from('users')
    .insert({
      ...data,
      role: 'resident' as const,
    })
    .select()
    .single()
  
  if (error) {
    throw new DatabaseError('Failed to create resident', error)
  }
  
  return resident
}

export async function updateResident(
  userId: string,
  data: Partial<{
    first_name: string
    last_name: string
    phone: string
    bio: string
    profile_picture_url: string
    // ... other fields
  }>
) {
  const supabase = await createServerClient()
  
  const { data: resident, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .eq('role', 'resident')
    .select()
    .single()
  
  if (error) {
    throw new DatabaseError('Failed to update resident', error)
  }
  
  return resident
}
```

**lib/errors.ts:**

```typescript
// lib/errors.ts
export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

**Cursor Prompt:**

```
Create comprehensive data layer for all core domains.

Context:
@lib/data/residents.ts (example created)
@lib/errors.ts (error types)

Task:
Create data layer files for:
1. lib/data/locations.ts
2. lib/data/events.ts
3. lib/data/exchange.ts
4. lib/data/notifications.ts

For each file, create functions:
- get{Domain}s (with filters, pagination, includes)
- get{Domain} (single item with relations)
- create{Domain}
- update{Domain}
- delete{Domain} (if applicable)

Follow the pattern in residents.ts:
- Use TypeScript interfaces for options
- Include proper error handling
- Support filtering and pagination
- Allow optional relation includes
- Always filter by tenant_id where applicable

Example for locations:
```typescript
export async function getLocations(options: GetLocationsOptions) {
  // Support filters: type, neighborhoodId
  // Support pagination
  // Include: neighborhood, created_by
}
```

Also create lib/data/index.ts with barrel exports.
```

**Acceptance Criteria:**
- [ ] 5 data layer modules created (residents, locations, events, exchange, notifications)
- [ ] All functions properly typed
- [ ] Error handling consistent
- [ ] Filtering and pagination work
- [ ] Tenant isolation enforced

---

### Task 3.2: Refactor UI to Use Data Layer

**Duration**: 3 hours

**Priority Pages (refactor these first):**

1. `app/t/[slug]/dashboard/page.tsx`
2. `app/t/[slug]/admin/residents/page.tsx`
3. `app/t/[slug]/dashboard/events/page.tsx`
4. `app/t/[slug]/dashboard/exchange/page.tsx`

**Cursor Prompt:**

```
Refactor pages to use centralized data layer.

Context:
@lib/data (all data layer functions)
@app/t/[slug]/dashboard/page.tsx
@app/t/[slug]/admin/residents/page.tsx
@app/t/[slug]/dashboard/events/page.tsx

Task:
Replace all direct Supabase queries with data layer functions.

BEFORE:
```typescript
const supabase = await createServerClient()
const { data: residents } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'resident')
  .eq('tenant_id', tenantId)
```

AFTER:
```typescript
import { getResidents } from '@/lib/data'

const { data: residents } = await getResidents({
  tenantId,
  pagination: { page: 1, limit: 20 },
  include: { lot: true, family: true }
})
```

Benefits:
- Single source of truth for queries
- Easier to test
- Consistent error handling
- Type-safe

Refactor these pages first:
1. Dashboard
2. Admin residents list
3. Events list
4. Exchange listings
5. Neighbors directory

Then move to less critical pages.
```

**Acceptance Criteria:**
- [ ] Top 10 pages use data layer
- [ ] No direct Supabase calls in UI components
- [ ] All features still work
- [ ] Performance same or better

---

## Day 4: API Foundation

**Objective**: Build REST API v1 with authentication, tenant isolation, rate limiting

### Task 4.1: API Infrastructure

**Duration**: 2 hours

**Create API Utilities:**

**lib/api/middleware.ts:**

```typescript
// lib/api/middleware.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type ApiHandler<T = any> = (
  request: Request,
  context?: T
) => Promise<Response>

// Authentication middleware
export function withAuth(handler: ApiHandler<{ user: any }>) {
  return async (request: Request) => {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return handler(request, { user })
  }
}

// Tenant isolation middleware
export function withTenantIsolation(
  handler: ApiHandler<{ user: any; tenantId: string }>
) {
  return withAuth(async (request, { user }) => {
    const supabase = await createServerClient()
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()
    
    if (error || !userData?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    return handler(request, { user, tenantId: userData.tenant_id })
  })
}
```

**lib/api/response.ts:**

```typescript
// lib/api/response.ts
import { NextResponse } from 'next/server'

export const ApiResponse = {
  success: <T>(data: T, meta?: Record<string, any>) => {
    return NextResponse.json({ success: true, data, meta })
  },
  
  error: (message: string, status = 400, details?: any) => {
    return NextResponse.json(
      { success: false, error: message, details },
      { status }
    )
  },
  
  paginated: <T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ) => {
    return NextResponse.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      }
    })
  },
}
```

**lib/api/pagination.ts:**

```typescript
// lib/api/pagination.ts
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  
  return { page, limit, offset: (page - 1) * limit }
}

export function parseFilters(
  searchParams: URLSearchParams,
  allowedFilters: string[]
) {
  const filters: Record<string, any> = {}
  
  for (const key of allowedFilters) {
    const value = searchParams.get(key)
    if (value) {
      filters[key] = value
    }
  }
  
  return filters
}
```

---

### Task 4.2: Create Core API Endpoints

**Duration**: 3 hours

**Cursor Prompt:**

```
Create REST API v1 endpoints for core domains.

Context:
@lib/api (middleware, response, pagination utilities)
@lib/data (data layer functions)
@lib/validation/schemas.ts (Zod schemas)
@lib/rate-limit.ts (rate limiting)

Task:
Create API endpoints for these domains:

1. /api/v1/events
   - GET /api/v1/events (list with filters: upcoming, past, category)
   - POST /api/v1/events (create)
   - GET /api/v1/events/[id] (detail)
   - PATCH /api/v1/events/[id] (update)
   - DELETE /api/v1/events/[id] (delete)
   - POST /api/v1/events/[id]/rsvp (RSVP)

2. /api/v1/locations
   - GET /api/v1/locations (list with filters: type, neighborhoodId)
   - POST /api/v1/locations (create)
   - GET /api/v1/locations/[id] (detail)
   - PATCH /api/v1/locations/[id] (update)

3. /api/v1/check-ins
   - GET /api/v1/check-ins (list)
   - POST /api/v1/check-ins (create)
   - DELETE /api/v1/check-ins/[id] (end check-in)
   - GET /api/v1/check-ins/active (currently active)

4. /api/v1/exchange/listings
   - GET /api/v1/exchange/listings (list with filters)
   - POST /api/v1/exchange/listings (create)
   - GET /api/v1/exchange/listings/[id] (detail)

5. /api/v1/notifications
   - GET /api/v1/notifications (list)
   - PATCH /api/v1/notifications (mark all as read)
   - PATCH /api/v1/notifications/[id] (mark as read)

For each endpoint:
1. Use withTenantIsolation middleware
2. Add rate limiting
3. Parse pagination and filters
4. Validate input with Zod (for POST/PATCH)
5. Call appropriate data layer function
6. Return using ApiResponse utilities
7. Handle errors gracefully

Example pattern:
```typescript
// app/api/v1/events/route.ts
import { withTenantIsolation } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/pagination'
import { rateLimit } from '@/lib/rate-limit'
import { getEvents } from '@/lib/data'

export const GET = withTenantIsolation(async (request, { tenantId }) => {
  const rateLimitResponse = await rateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse
  
  const { searchParams } = new URL(request.url)
  const { page, limit } = parsePagination(searchParams)
  
  const { data, total } = await getEvents({ tenantId, page, limit })
  
  return ApiResponse.paginated(data, page, limit, total)
})
```
```

**Acceptance Criteria:**
- [ ] All 5 domains have API endpoints
- [ ] All endpoints authenticated
- [ ] All endpoints rate-limited
- [ ] All POST/PATCH validate input
- [ ] Consistent JSON response format
- [ ] Error handling consistent

---

## Day 5: Performance & Final Testing

**Objective**: Optimize performance, fix GeoJSON issues, comprehensive testing

### Task 5.1: GeoJSON Web Worker

**Duration**: 2 hours

**Create Web Worker:**

```typescript
// lib/workers/geojson-transformer.worker.ts
import proj4 from 'proj4'

const utm16n = '+proj=utm +zone=16 +datum=WGS84 +units=m +no_defs'
const wgs84 = 'EPSG:4326'

self.onmessage = (e: MessageEvent) => {
  const { features, chunkIndex, totalChunks } = e.data
  
  try {
    const transformed = features.map((feature: any) => {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = proj4(utm16n, wgs84, feature.geometry.coordinates)
        return {
          ...feature,
          geometry: { ...feature.geometry, coordinates: [lng, lat] }
        }
      }
      
      if (feature.geometry.type === 'Polygon') {
        const transformedCoordinates = feature.geometry.coordinates.map((ring: number[][]) => {
          return ring.map((coord: number[]) => proj4(utm16n, wgs84, coord))
        })
        return {
          ...feature,
          geometry: { ...feature.geometry, coordinates: transformedCoordinates }
        }
      }
      
      return feature
    })
    
    self.postMessage({
      type: 'progress',
      data: transformed,
      progress: ((chunkIndex + 1) / totalChunks) * 100,
    })
  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message })
  }
}
```

**Create Hook:**

```typescript
// hooks/use-geojson-worker.ts
'use client'

import { useState, useCallback } from 'react'

export function useGeoJSONWorker() {
  const [progress, setProgress] = useState(0)
  const [isTransforming, setIsTransforming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const transformGeoJSON = useCallback(async (file: File) => {
    setIsTransforming(true)
    setProgress(0)
    setError(null)
    
    const worker = new Worker(
      new URL('@/lib/workers/geojson-transformer.worker.ts', import.meta.url)
    )
    
    try {
      const text = await file.text()
      const geojson = JSON.parse(text)
      const features = geojson.features || []
      
      const chunkSize = 100
      const chunks = []
      for (let i = 0; i < features.length; i += chunkSize) {
        chunks.push(features.slice(i, i + chunkSize))
      }
      
      const allTransformed: any[] = []
      
      for (let i = 0; i < chunks.length; i++) {
        await new Promise<void>((resolve, reject) => {
          worker.onmessage = (e) => {
            if (e.data.type === 'progress') {
              setProgress(e.data.progress)
              allTransformed.push(...e.data.data)
              resolve()
            } else if (e.data.type === 'error') {
              reject(new Error(e.data.error))
            }
          }
          
          worker.postMessage({
            features: chunks[i],
            chunkIndex: i,
            totalChunks: chunks.length,
          })
        })
      }
      
      worker.terminate()
      return allTransformed
    } catch (err: any) {
      setError(err.message)
      worker.terminate()
      throw err
    } finally {
      setIsTransforming(false)
    }
  }, [])
  
  return { transformGeoJSON, progress, isTransforming, error }
}
```

**Acceptance Criteria:**
- [ ] GeoJSON files up to 5MB process without freezing
- [ ] Progress indicator shows during processing
- [ ] All coordinate transformations correct
- [ ] Error handling works

---

### Task 5.2: Image Optimization

**Duration**: 1 hour

**Cursor Prompt:**

```
Replace all <img> tags with Next.js Image component.

Context:
@app (all pages and components)
@components (all components)

Task:
Find every instance of <img> tag and replace with Next.js Image component.

BEFORE:
```tsx
<img 
  src={resident.profile_picture_url} 
  alt={resident.name}
  className="w-24 h-24 rounded-full"
/>
```

AFTER:
```tsx
import Image from 'next/image'

<Image
  src={resident.profile_picture_url}
  alt={`${resident.first_name} ${resident.last_name}`}
  width={96}
  height={96}
  className="rounded-full"
  loading="lazy"
/>
```

Rules:
1. ALWAYS import Image from 'next/image'
2. ALWAYS provide width and height props
3. Use loading="lazy" for below-fold images
4. Provide meaningful alt text

Search in all page.tsx and component files.
This is critical for performance.
```

---

### Task 5.3: Comprehensive Testing

**Duration**: 2 hours

**Testing Checklist:**

```markdown
## Authentication & Authorization
- [ ] Login as super admin
- [ ] Login as tenant admin
- [ ] Login as resident
- [ ] Invite flow creates user correctly
- [ ] Cross-tenant access blocked

## Database Migration
- [ ] All residents in users table
- [ ] All interests in user_interests
- [ ] All skills in user_skills
- [ ] No orphaned records

## RLS Policies
- [ ] Resident can only see own tenant data
- [ ] Tenant admin can access tenant data
- [ ] Super admin can access all tenants

## API Endpoints
- [ ] GET /api/v1/residents returns data
- [ ] POST /api/v1/events creates event
- [ ] All endpoints require auth
- [ ] Rate limiting works

## Performance
- [ ] GeoJSON upload processes smoothly
- [ ] Dashboard loads <2 seconds
- [ ] Lighthouse mobile score 80+
- [ ] No console errors

## Security
- [ ] File upload validates type/size
- [ ] Rate limiting blocks after limit
- [ ] All forms validate input
```

---

## Deliverables Checklist

- [ ] All 49 files migrated to users table
- [ ] Data layer created (`/lib/data/*`)
- [ ] API v1 created (`/app/api/v1/*`)
- [ ] RLS policies fixed
- [ ] Performance indexes added
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] GeoJSON Web Worker
- [ ] Images using Next.js Image
- [ ] Queries optimized

---

## Success Criteria

Work Package 1 is complete when:

1. ✅ All 49 files migrated and tested
2. ✅ Zero RLS vulnerabilities
3. ✅ API foundation live (10+ endpoints)
4. ✅ Performance: Lighthouse 80+ mobile
5. ✅ Security: Rate limiting, validation active
6. ✅ GeoJSON uploads work smoothly
7. ✅ Production deployment stable
8. ✅ Can proceed to WP2

**Estimated Total Time**: 40 hours (5 days × 8 hours)

---

**End of Work Package 1**