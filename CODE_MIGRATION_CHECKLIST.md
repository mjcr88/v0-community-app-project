# Code Migration: Find & Replace Guide

## IMPORTANT: Run SQL Scripts First!
Before making code changes, run these scripts in order:
1. `scripts/022_extend_users_table_for_residents.sql`
2. `scripts/023_migrate_junction_tables.sql`
3. `scripts/024_migrate_resident_data.sql`
4. `scripts/025_complete_code_migration_helper.sql` (verification)

## Global Find & Replace Patterns

### Pattern 1: Table References
**Find:** `.from("residents")`  
**Replace:** `.from("users").eq("role", "resident")`

**Find:** `.from("resident_interests")`  
**Replace:** `.from("user_interests")`

**Find:** `.from("resident_skills")`  
**Replace:** `.from("user_skills")`

**Find:** `.from("resident_privacy_settings")`  
**Replace:** `.from("user_privacy_settings")`

### Pattern 2: Column Names in Queries
**Find:** `resident_id`  
**Replace:** `user_id`

### Pattern 3: Insert Statements
When inserting into users table, ALWAYS add `role: 'resident'`:

\`\`\`typescript
// BEFORE
await supabase.from("residents").insert({
  first_name: "John",
  tenant_id: tenantId,
})

// AFTER
await supabase.from("users").insert({
  first_name: "John",
  tenant_id: tenantId,
  role: 'resident' as const,  // CRITICAL: Must add this
})
\`\`\`

### Pattern 4: Auth User Lookups
\`\`\`typescript
// BEFORE
.eq("auth_user_id", user.id)

// AFTER  
.eq("auth_user_id", user.id)
.eq("role", "resident")  // Add this filter
\`\`\`

### Pattern 5: Variable Names (Optional but Recommended)
**Find:** `resident` (variable name)  
**Replace:** `userRecord` or keep as `resident` for clarity

## Files Requiring Updates (52 total)

### Critical Path (Update First) - 10 files
- [ ] app/t/[slug]/onboarding/profile/page.tsx
- [ ] app/t/[slug]/onboarding/journey/page.tsx  
- [ ] app/t/[slug]/onboarding/interests/page.tsx
- [ ] app/t/[slug]/onboarding/skills/page.tsx
- [ ] app/t/[slug]/onboarding/complete/page.tsx
- [ ] app/t/[slug]/login/login-form.tsx
- [ ] app/t/[slug]/dashboard/page.tsx
- [ ] app/t/[slug]/invite/[token]/page.tsx
- [ ] app/t/[slug]/invite/[token]/signup-form.tsx
- [ ] app/api/link-resident/route.ts

### Admin Functions - 7 files
- [ ] app/t/[slug]/admin/residents/[id]/edit/page.tsx
- [ ] app/t/[slug]/admin/residents/[id]/edit/edit-resident-form.tsx
- [ ] app/t/[slug]/admin/residents/residents-table.tsx
- [ ] app/t/[slug]/admin/families/page.tsx
- [ ] app/t/[slug]/admin/families/[id]/edit/page.tsx
- [ ] app/t/[slug]/admin/families/create/create-family-form.tsx
- [ ] app/t/[slug]/admin/dashboard/page.tsx

### Resident Features - 8 files
- [ ] app/t/[slug]/dashboard/settings/profile/page.tsx
- [ ] app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx
- [ ] app/t/[slug]/dashboard/settings/privacy/page.tsx
- [ ] app/t/[slug]/dashboard/settings/privacy/privacy-settings-form.tsx
- [ ] app/t/[slug]/dashboard/neighbours/page.tsx
- [ ] app/t/[slug]/dashboard/neighbours/neighbours-table.tsx
- [ ] app/t/[slug]/dashboard/neighbours/[id]/page.tsx
- [ ] app/t/[slug]/dashboard/layout.tsx

### Onboarding Forms - 6 files
- [ ] app/t/[slug]/onboarding/profile/profile-form.tsx
- [ ] app/t/[slug]/onboarding/journey/journey-form.tsx
- [ ] app/t/[slug]/onboarding/interests/interests-form.tsx
- [ ] app/t/[slug]/onboarding/skills/skills-form.tsx
- [ ] app/t/[slug]/onboarding/complete/complete-form.tsx
- [ ] app/t/[slug]/onboarding/welcome/page.tsx

### Remaining Files - 18 files
(See MIGRATION_GUIDE.md for complete list)

## Testing After Each Batch

After updating each group of files:

1. **Test Authentication**
   \`\`\`bash
   # Try logging in as:
   - Super admin
   - Tenant admin  
   - Resident
   \`\`\`

2. **Test Onboarding**
   \`\`\`bash
   # Complete full onboarding flow
   # Verify data saves correctly
   \`\`\`

3. **Test Admin Functions**
   \`\`\`bash
   # Create/edit residents
   # Send invites
   # Manage families
   \`\`\`

4. **Check Database**
   \`\`\`sql
   -- Verify data is going to users table
   SELECT COUNT(*) FROM users WHERE role = 'resident';
   
   -- Check junction tables
   SELECT COUNT(*) FROM user_interests;
   SELECT COUNT(*) FROM user_skills;
   \`\`\`

## Rollback if Needed

If something breaks:
1. Revert code changes (git revert)
2. Old tables still exist with data
3. Can restore from backup

## Next Steps After Code Migration

1. Run Phase 5: Update RLS Policies
2. Run Phase 6: Testing & Cleanup
3. Drop old tables (after thorough testing)
