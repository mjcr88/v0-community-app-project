# Sprint 4: Community Experience & Auth Polish

## Goal Description
Enhance the onboarding and profile management experience while strengthening the authentication flow with self-service request and recovery features.

## Selected Issues

| Issue | Title | Size | Priority |
| :--- | :--- | :--- | :--- |
| #115 | Profile Picture Cropping | S | P1 |
| #100 | Resident Interest Creation & Directory Search Fix | XS | P2 |
| #109 | Profile Auto-Save & Visible Save Button | S | P1 |
| #99 | [Requirement] Request Access on Login Page | M | P1 |
| #111 | [READY] Add "Phase" Filter to Neighbor Directory (Grouped UI) | S | P1 |
| #70 | [Requirement] Password Reset Feature | S | P1 |

## Architecture & Git Strategy

### Branching Model
- **Base Branch**: `main`
- **Sprint Development Branch**: `feat/sprint-4`
- **Individual Feature Branches** (optional for parallel work):
  - `feat/115-profile-cropping`
  - `feat/100-111-directory-filters` (Combined due to UI refactor overlap)
  - `feat/109-profile-autosave`
  - `feat/99-70-auth-access` (Combined due to login page overlap)

### Shared Infrastructure
- **Auth Perimeter**: Both #99 and #70 modify the public login flow and routes.
- **Neighbor Directory**: #111 refactors the UI into a "More Filters" pattern, which #100 must utilize.
- **Profile Components**: #115 and #109 both affect the profile completion and edit forms.

---

## Technical Breakdowns

### 1. #115: Profile Picture Cropping
- **Files**: 
  - `components/ui/image-cropper.tsx` [NEW]: Reusable wrapper around `react-easy-crop`.
  - `components/onboarding/steps/identity-step.tsx`: Intercept `handlePhotoUpload` to show cropper.
  - `components/profile/editable-profile-banner.tsx`: Update `handleProfileClick` to show cropper before upload.
- **AC**:
  - [ ] Given an uploaded image, when the modal opens, then the user can pan/zoom 1:1.
  - [ ] When saved, the cropped image replaces the original upload.

### 2. #100 & #111: Directory Filters & Interests
- **Files**: 
  - `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`: 
    - Refactor `filterSections` into a Popover "More Filters".
    - Add `selectedPhases` state and filter logic.
    - Implement "Create Interest" in the `MultiSelect` search.
  - `components/profile/interests-form.tsx`: Add "Create" capability.
  - `supabase/migrations/[TIMESTAMP]_allow_interest_creation.sql`: Update RLS.
- **AC**:
  - [ ] When "More Filters" is clicked, "Phase", "Interests", and "Skills" multi-selects are visible.
  - [ ] When a search term has no match in Interests, a "Create" button appears and works (RLS allow).

### 3. #109: Profile Auto-Save
- **Files**: 
  - `app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx`: 
    - Refactor `handleSubmit` to `saveProfile(silent: boolean)`.
    - Add `onBlur` listeners to all inputs and `onValueChange` to selects.
    - Add `saveStatus` indicator near the "Next" button.
- **AC**:
  - [ ] When a field loses focus, a "Saving..." indicator appears and changes to "Saved" on success.

### 4. #99 & #70: Auth & Access
- **Files**: 
  - `app/t/[slug]/login/login-form.tsx`: Add "Forgot Password?" and "Request Access" links.
  - `app/t/[slug]/forgot-password/page.tsx` [NEW]: Email input form.
  - `app/auth/confirm/route.ts` [NEW]: PKCE exchange.
  - `app/t/[slug]/request-access/page.tsx` [NEW]: Multi-field request form.
  - `supabase/migrations/[TIMESTAMP]_access_requests_table.sql`: New table and RLS.
- **AC**:
  - [ ] Given the login page, the user can navigate to "Forgot Password" or "Request Access".
  - [ ] When an access request is submitted, it appears in the Admin "Access Requests" tab.

---

## Verification Plan

### Automated Tests
- `npm run test`: Run unit tests for filter logic in `neighbours-page-client`.
- `npx playwright test e2e/auth-flow.spec.ts` [NEW]: Verify login -> request access -> forgot password links.

### Manual Verification
- **Cropping**: Upload an off-center photo and verify correct 1:1 cropping.
- **Auto-save**: Change a field, click away, and refresh the page to see if value persisted.
- **Access Request**: Submit a request and verify as admin in the dashboard.
- **Password Reset**: Trigger reset, click link in local `supabase` logs (if dev) or email, and update password.

## Implementation Order
1. **Security & Infrastructure**: #70 (Password Reset - Auth foundations)
2. **Core Feature**: #99 (Request Access - New Table/Public Flow)
3. **UX Optimization**: #111 (Directory Refactor) followed by #100 (Interest Fixes)
4. **Onboarding Polish**: #115 (Cropping) and #109 (Auto-save)

## Sprint Schedule

| Issue | Size | Est. Hours | Start Date | Target Date |
| :--- | :--- | :--- | :--- | :--- |
| #70 | S | 4-8h | Feb 16, 2026 | Feb 17, 2026 |
| #99 | M | 12-16h | Feb 17, 2026 | Feb 19, 2026 |
| #111 | S | 4-8h | Feb 19, 2026 | Feb 20, 2026 |
| #100 | XS | 2-4h | Feb 20, 2026 | Feb 20, 2026 |
| #115 | S | 4-8h | Feb 23, 2026 | Feb 24, 2026 |
| #109 | S | 4-8h | Feb 24, 2026 | Feb 25, 2026 |

*Note: Parallel work on Auth (#70/99) and Directory (#111/100) is planned for integration efficiency.*

## Definition of Done
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Documentation updated (if applicable)
