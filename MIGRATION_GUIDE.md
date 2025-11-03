# Residents → Users Table Migration Guide

## Status: Phase 4 In Progress

### Completed
- ✅ Phase 1: Extended users table schema (script 022)
- ✅ Phase 2: Created new junction tables (script 023)
- ✅ Phase 3: Migrated resident data (script 024)
- ⏳ Phase 4: Updating application code (IN PROGRESS)

### Files Updated (3/52)
1. ✅ app/t/[slug]/admin/residents/page.tsx
2. ✅ app/t/[slug]/admin/residents/create/create-resident-form.tsx
3. ✅ app/t/[slug]/onboarding/layout.tsx

### Remaining Files to Update (49)

**Critical Path (Must update first):**
1. app/t/[slug]/onboarding/profile/page.tsx
2. app/t/[slug]/onboarding/journey/page.tsx
3. app/t/[slug]/onboarding/interests/page.tsx
4. app/t/[slug]/onboarding/skills/page.tsx
5. app/t/[slug]/onboarding/complete/page.tsx
6. app/t/[slug]/login/login-form.tsx
7. app/t/[slug]/dashboard/page.tsx
8. app/t/[slug]/invite/[token]/page.tsx
9. app/t/[slug]/invite/[token]/signup-form.tsx
10. app/api/link-resident/route.ts

**Admin Functions:**
11. app/t/[slug]/admin/residents/[id]/edit/page.tsx
12. app/t/[slug]/admin/residents/[id]/edit/edit-resident-form.tsx
13. app/t/[slug]/admin/residents/residents-table.tsx
14. app/t/[slug]/admin/families/page.tsx
15. app/t/[slug]/admin/families/[id]/edit/page.tsx
16. app/t/[slug]/admin/families/create/create-family-form.tsx
17. app/t/[slug]/admin/dashboard/page.tsx

**Resident Features:**
18. app/t/[slug]/dashboard/settings/profile/page.tsx
19. app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx
20. app/t/[slug]/dashboard/settings/privacy/page.tsx
21. app/t/[slug]/dashboard/settings/privacy/privacy-settings-form.tsx
22. app/t/[slug]/dashboard/neighbours/page.tsx
23. app/t/[slug]/dashboard/neighbours/neighbours-table.tsx
24. app/t/[slug]/dashboard/neighbours/[id]/page.tsx
25. app/t/[slug]/dashboard/layout.tsx

**Backoffice:**
26. app/backoffice/dashboard/tenants/[id]/features/tenant-features-form.tsx

... (and 23 more files)

## Search & Replace Patterns

### Pattern 1: Table Name
\`\`\`typescript
// OLD
.from("residents")

// NEW
.from("users")
.eq("role", "resident")  // Add this filter
\`\`\`

### Pattern 2: Junction Tables
\`\`\`typescript
// OLD
.from("resident_interests")
.from("resident_skills")
.from("resident_privacy_settings")

// NEW
.from("user_interests")
.from("user_skills")
.from("user_privacy_settings")
\`\`\`

### Pattern 3: Foreign Key Column Names
\`\`\`typescript
// OLD
resident_id

// NEW
user_id
\`\`\`

### Pattern 4: Insert with Role
\`\`\`typescript
// OLD
await supabase.from("residents").insert({
  first_name: "John",
  last_name: "Doe",
  tenant_id: tenantId,
})

// NEW
await supabase.from("users").insert({
  first_name: "John",
  last_name: "Doe",
  tenant_id: tenantId,
  role: 'resident' as const,  // MUST add this
})
\`\`\`

### Pattern 5: Queries with Joins
\`\`\`typescript
// OLD
.select(`
  *,
  resident_interests (
    interests (*)
  )
`)

// NEW
.select(`
  *,
  user_interests (
    interests (*)
  )
`)
\`\`\`

### Pattern 6: Auth User Lookup
\`\`\`typescript
// OLD
const { data: resident } = await supabase
  .from("residents")
  .select("*")
  .eq("auth_user_id", user.id)
  .single()

// NEW
const { data: resident } = await supabase
  .from("users")
  .select("*")
  .eq("auth_user_id", user.id)
  .eq("role", "resident")
  .single()
\`\`\`

## Testing Checklist

After updating all files, test these flows:

### Authentication
- [ ] Super admin login
- [ ] Tenant admin login
- [ ] Resident login
- [ ] Invalid credentials
- [ ] Access control (tenant isolation)

### Onboarding
- [ ] Welcome step
- [ ] Profile step (with image upload)
- [ ] Journey step
- [ ] Interests step (if enabled)
- [ ] Skills step (if enabled)
- [ ] Complete step
- [ ] Skip onboarding redirect

### Admin Functions
- [ ] View residents list
- [ ] Create single resident
- [ ] Create family unit
- [ ] Edit resident
- [ ] Send invite
- [ ] Assign lot
- [ ] Reassign lot

### Resident Features
- [ ] View dashboard
- [ ] Edit profile
- [ ] Update privacy settings
- [ ] View neighbours directory
- [ ] Search/filter neighbours
- [ ] View public profile

### Data Integrity
- [ ] All resident counts match
- [ ] Interests preserved
- [ ] Skills preserved
- [ ] Privacy settings preserved
- [ ] Family relationships intact
- [ ] Lot assignments correct

## Rollback Plan

If issues arise:

1. Stop using new code (git revert)
2. Residents table still exists with `migrated_to_user_id` column
3. Old junction tables still exist
4. Can restore from backup if needed

## Next Steps

1. Complete remaining 49 file updates using patterns above
2. Run all SQL migration scripts in order (022, 023, 024)
3. Test each feature thoroughly
4. Proceed to Phase 5 (RLS policies)
5. Proceed to Phase 6 (cleanup)
