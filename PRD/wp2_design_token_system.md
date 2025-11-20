# WP2: Implementation Checklist
## Ecovilla Community Platform - Design System Setup

**Version**: 1.0  
**Created**: November 2024  
**Owner**: MJ + Cursor AI  
**Status**: Ready to Execute

---

## Overview

This checklist guides you through implementing WP2 design tokens in your Next.js codebase. Each step includes:
- **What** needs to be done
- **Why** it matters
- **Cursor prompts** to copy-paste
- **Validation checks** to confirm success

**Estimated Time**: 2-3 hours  
**Prerequisites**: WP1 completion not required (can run in parallel)

---

## Pre-Flight Checklist

Before starting, ensure you have:

- [ ] Cursor Pro subscription active ($20/month)
- [ ] Project open in Cursor
- [ ] Terminal access
- [ ] Git branch created: `feature/wp2-design-tokens`
- [ ] Backup of current `app/globals.css` and `tailwind.config.ts`

---

## Step 1: Update CSS Variables (30 min)

### What
Replace existing CSS variables in `app/globals.css` with Ecovilla design tokens.

### Why
- Establishes single source of truth for colors
- Enables theme switching (light/dark mode)
- Makes design changes easier to propagate

### Cursor Prompt

```
Update app/globals.css with Ecovilla design tokens.

Context:
@app/globals.css (current file)
@design-tokens.css (new token system)

Task:
1. Open app/globals.css
2. Find the :root and .dark sections with CSS variables
3. REPLACE all existing variables with the content from design-tokens.css
4. Keep any non-color variables that already exist (animations, etc)
5. Preserve the @layer base, @layer components structure
6. DO NOT remove Tailwind directives (@tailwind base, components, utilities)

IMPORTANT:
- Backup the current file first
- Keep file formatting clean
- Maintain light/dark mode structure
- Test that file compiles without errors

After making changes, show me a summary of:
- How many variables added
- Any existing variables that were replaced
- Any variables kept from the original file
```

### Validation

Run these checks:

```bash
# 1. Check for syntax errors
npm run dev

# 2. Verify CSS compiles
# Look in terminal for any CSS errors

# 3. Check that variables are defined
# Open browser DevTools > Elements > Computed
# Search for "--forest-canopy" - should show HSL value
```

**Expected Output:**
- ✅ Dev server starts without CSS errors
- ✅ `--forest-canopy` shows `100 45% 45%` in DevTools
- ✅ Light/dark mode sections both present
- ✅ All 6 color families defined (forest, sunrise, sky, honey, clay, mist)

### Troubleshooting

**Error: "Cannot find @tailwind directives"**
- Solution: Ensure first 3 lines are: `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`

**Error: "Invalid HSL value"**
- Solution: Check that all HSL values are space-separated (e.g., `100 45% 45%` not `100, 45%, 45%`)

**Styles look broken after change**
- Solution: Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Clear Next.js cache: `rm -rf .next` then `npm run dev`

---

## Step 2: Update Tailwind Config (30 min)

### What
Extend `tailwind.config.ts` with Ecovilla design tokens.

### Why
- Enables Tailwind utility classes (e.g., `bg-forest-canopy`)
- Defines spacing system, typography, shadows
- Configures responsive breakpoints

### Cursor Prompt

```
Update tailwind.config.ts with Ecovilla design system extensions.

Context:
@tailwind.config.ts (current file)
@tailwind.config.ts (new token system - artifact provided)

Task:
1. Open tailwind.config.ts
2. MERGE the new config with existing config
3. Keep existing shadcn/ui theme extensions if present
4. Add Ecovilla extensions in the theme.extend section:
   - colors (forest, sunrise, sky, honey, clay, mist, earth, exchange)
   - spacing (space-* scale)
   - fontSize (responsive sizes)
   - borderRadius (sm, DEFAULT, lg, xl, full)
   - boxShadow (xs, sm, md, lg, xl)
   - transitionDuration (quick, base, smooth, rio)
   - zIndex (dropdown, sticky, fixed, modal, tooltip)

5. Ensure darkMode is set to ["class"]
6. Keep existing plugins array (tailwindcss-animate)

IMPORTANT:
- Do NOT remove existing shadcn theme variables
- Do NOT remove existing plugins
- Maintain TypeScript typing (import type { Config })
- Test that config compiles

After making changes, show me:
- Which sections were added
- Any conflicts resolved
- Summary of new utility classes available
```

### Validation

Run these checks:

```bash
# 1. Check TypeScript compilation
npx tsc --noEmit

# 2. Verify Tailwind recognizes new classes
# Create a test component temporarily
echo '<div className="bg-forest-canopy text-white p-space-4 rounded-lg shadow-md">Test</div>' > test-token.txt

# 3. Check Tailwind IntelliSense
# In any .tsx file, type: className="bg-forest-
# Should show auto-complete with: bg-forest-deep, bg-forest-canopy, etc.
```

**Expected Output:**
- ✅ TypeScript compiles without errors
- ✅ Tailwind IntelliSense shows new utility classes
- ✅ `bg-forest-canopy`, `text-earth-soil`, `space-4`, `shadow-md` all available
- ✅ Dev server restarts successfully

### Troubleshooting

**Error: "Type error in tailwind.config.ts"**
- Solution: Ensure first line is `import type { Config } from "tailwindcss";`
- Ensure last line is `export default config;`

**IntelliSense not showing new classes**
- Solution: Restart Cursor/VSCode
- Reload Tailwind extension: Cmd+Shift+P > "Tailwind CSS: Restart IntelliSense"

**Classes not applying in browser**
- Solution: Hard refresh browser
- Clear .next cache: `rm -rf .next && npm run dev`

---

## Step 3: Create Component State Utilities (30 min)

### What
Create reusable utility functions for the 8 component states.

### Why
- Ensures consistent state styling across all components
- Reduces code duplication
- Makes it easy to apply accessibility requirements

### Cursor Prompt

```
Create utility functions for component state management.

Context:
@WP2_Component_Guidelines.md (8 states specification)
@lib/utils.ts (existing utility file)

Task:
Create a new file: lib/design-system/component-states.ts

Include these utility functions:

1. getButtonStateClasses(variant, state) 
   - Returns className string for button states
   - Handles: default, hover, focus, active, disabled, loading
   - Supports variants: primary, secondary, destructive, ghost

2. getInputStateClasses(state, hasError)
   - Returns className string for input states
   - Handles: default, focus, error, success, disabled

3. getCardStateClasses(isInteractive, state)
   - Returns className string for card states
   - Handles: default, hover (if interactive), focus (if interactive)

Each function should:
- Use design tokens from tailwind.config.ts
- Apply accessibility requirements (focus rings, ARIA)
- Return merged className strings using cn() helper
- Include JSDoc comments with examples

Example usage:
```tsx
<button className={getButtonStateClasses('primary', 'default')}>
  Click me
</button>
```

Also create TypeScript types:
- ComponentState: 'default' | 'hover' | 'focused' | 'active' | 'disabled' | 'loading' | 'error' | 'success'
- ButtonVariant: 'primary' | 'secondary' | 'destructive' | 'ghost'
```

### Validation

Run these checks:

```bash
# 1. Verify file was created
ls lib/design-system/component-states.ts

# 2. Check TypeScript compilation
npx tsc --noEmit

# 3. Test in a component (create temporary test)
# Create app/test-states/page.tsx and test each utility
```

**Expected Output:**
- ✅ File created at `lib/design-system/component-states.ts`
- ✅ TypeScript types defined
- ✅ 3 utility functions exported
- ✅ JSDoc comments present
- ✅ No TypeScript errors

### Manual Testing

Create a test page to verify states:

```tsx
// app/test-states/page.tsx
import { getButtonStateClasses } from '@/lib/design-system/component-states'

export default function TestStates() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Component States Test</h1>
      
      {/* Test Primary Button States */}
      <div className="space-x-4">
        <button className={getButtonStateClasses('primary', 'default')}>
          Default
        </button>
        <button className={getButtonStateClasses('primary', 'hover')}>
          Hover
        </button>
        <button className={getButtonStateClasses('primary', 'disabled')} disabled>
          Disabled
        </button>
      </div>
      
      {/* Add more tests... */}
    </div>
  )
}
```

Visit `http://localhost:3000/test-states` and verify visual appearance.

---

## Step 4: Update Existing Components (45 min)

### What
Update 2-3 existing components to use new design tokens.

### Why
- Validates that tokens work in real components
- Establishes migration pattern
- Identifies any missing tokens

### Cursor Prompt

```
Migrate existing components to use Ecovilla design tokens.

Context:
@WP2_Component_Guidelines.md (token usage patterns)
@components/ui/button.tsx (or another common component)
@lib/design-system/component-states.ts (state utilities)

Task:
Update these components to use design tokens:

1. components/ui/button.tsx
   - Replace hardcoded colors with token classes
   - Use getButtonStateClasses() utility
   - Ensure all 8 states are handled
   - Add proper ARIA attributes

2. components/ui/input.tsx
   - Replace hardcoded colors with token classes
   - Use getInputStateClasses() utility
   - Add focus ring styles
   - Ensure error/success states work

3. [Pick one more common component]

For each component:
- Keep existing functionality
- Replace only color/spacing values
- Maintain shadcn/ui patterns
- Add comments for state handling
- Test with keyboard navigation

IMPORTANT:
- Do NOT break existing props/API
- Maintain backward compatibility
- Keep existing className merging (cn utility)
- Test in browser after each change
```

### Validation

For each updated component:

```bash
# 1. Check TypeScript
npx tsc --noEmit

# 2. Visual test in browser
npm run dev
# Navigate to page using the component

# 3. Keyboard test
# Tab to component
# Press Enter/Space
# Check focus ring visible (2px outline)

# 4. State test
# Hover: Should darken + lift
# Active: Should scale down
# Disabled: Should be muted + cursor-not-allowed
```

**Expected Output:**
- ✅ Components compile without errors
- ✅ Visual appearance matches design tokens
- ✅ All 8 states functional
- ✅ Keyboard navigation works
- ✅ Focus rings clearly visible

---

## Step 5: Accessibility Audit (30 min)

### What
Test design tokens against WCAG 2.1 AA standards.

### Why
- Ensures color contrast meets requirements
- Validates keyboard navigation
- Confirms screen reader compatibility

### Cursor Prompt

```
Create an accessibility test suite for Ecovilla design tokens.

Context:
@WP2_Component_Guidelines.md (accessibility requirements)

Task:
Create a new file: app/test-accessibility/page.tsx

This page should test:

1. Color Contrast Tests
   - Show all text/background combinations
   - Display contrast ratio for each
   - Mark pass/fail against WCAG AA (4.5:1)

2. Keyboard Navigation Test
   - Grid of interactive elements (buttons, inputs, links)
   - Visible focus indicators
   - Logical tab order

3. Screen Reader Test
   - Components with proper ARIA labels
   - Form fields with label associations
   - Status messages with aria-live

4. Touch Target Test
   - All buttons meet 44x44px minimum
   - Visual indicators of size

Include:
- Test results displayed on page
- Color contrast calculator using design tokens
- Links to WCAG documentation
- Pass/fail summary

Example test:
```tsx
<div className="bg-earth-cloud p-4">
  <p className="text-earth-soil">
    Test text (should be 12:1 contrast)
  </p>
  <code>text-earth-soil on bg-earth-cloud</code>
</div>
```
```

### Validation

**Manual Tests:**

1. **Contrast Test:**
   - Visit `/test-accessibility`
   - Check all contrast ratios
   - Verify no combinations below 4.5:1 for normal text

2. **Keyboard Test:**
   - Use Tab key only (no mouse)
   - Verify all interactive elements reachable
   - Check focus ring visible (2px, high contrast)
   - Test Enter/Space activation

3. **Screen Reader Test:**
   - macOS: Enable VoiceOver (Cmd+F5)
   - Windows: Enable Narrator
   - Navigate through test page
   - Verify all labels announced

4. **Touch Target Test:**
   - Open DevTools > Elements
   - Hover over buttons, check computed dimensions
   - All interactive elements ≥ 44px × 44px

**Expected Results:**
- ✅ All text combinations pass WCAG AA (4.5:1+)
- ✅ Focus rings clearly visible (3:1 contrast)
- ✅ Keyboard navigation logical
- ✅ Screen reader announces all content
- ✅ Touch targets meet 44px minimum

### Troubleshooting

**Contrast ratio failing**
- Solution: Increase color darkness (reduce HSL lightness)
- Use `-deep` variants for text on light backgrounds
- Reference validated combinations in Component Guidelines

**Focus ring not visible**
- Solution: Ensure `focus-visible:ring-2` applied
- Check ring color has 3:1 contrast with background
- Test with keyboard (Tab), not mouse click

---

## Step 6: Documentation & Handoff (30 min)

### What
Document what was done and prepare for team review.

### Why
- Enables other developers to use tokens correctly
- Creates record of decisions made
- Identifies any gaps or issues

### Cursor Prompt

```
Create a WP2 completion summary document.

Context:
@WP2_Design_Tokens_Specification.md
@WP2_Component_Guidelines.md
All changes made in Steps 1-5

Task:
Create a new file: docs/design-system/WP2_COMPLETION_REPORT.md

Include:

1. What Was Implemented
   - List of files changed
   - Summary of design tokens added
   - Components migrated
   - Utilities created

2. How to Use Design Tokens
   - Quick reference guide
   - Common className patterns
   - Do's and Don'ts
   - Link to full Component Guidelines

3. Validation Results
   - Accessibility test results
   - Browser testing summary
   - Performance impact (if any)

4. Known Issues
   - Any tokens not yet applied
   - Components not yet migrated
   - Future improvements needed

5. Next Steps for WP3
   - Prerequisites for component installation
   - Recommended order of work
   - Any blockers identified

Format as markdown with:
- Clear sections
- Code examples
- Before/after comparisons
- Screenshots (if helpful)
```

### Validation

**Review Checklist:**

- [ ] All WP2 files added to project
- [ ] Git commit created with clear message
- [ ] Changes pushed to feature branch
- [ ] No console errors in dev server
- [ ] No TypeScript errors
- [ ] Accessibility tests pass
- [ ] Component states functional
- [ ] Documentation complete

**Git Commands:**

```bash
# Review changes
git status
git diff

# Commit
git add app/globals.css tailwind.config.ts lib/design-system/
git commit -m "feat(design-system): Implement WP2 design tokens

- Add complete color system (6 families + neutrals)
- Configure Tailwind with spacing, typography, shadows
- Create component state utilities
- Migrate button and input components
- Add accessibility test suite
- Document usage patterns

Refs: WP2"

# Push
git push origin feature/wp2-design-tokens
```

---

## Common Issues & Solutions

### Issue: "Tailwind classes not applying"

**Symptoms:**
- `bg-forest-canopy` shows no background color
- IntelliSense doesn't show custom classes

**Solutions:**
1. Restart dev server: `npm run dev`
2. Clear Next.js cache: `rm -rf .next`
3. Rebuild Tailwind: `npx tailwindcss -i ./app/globals.css -o ./test-output.css`
4. Check `content` array in `tailwind.config.ts` includes all component paths

---

### Issue: "Dark mode not working"

**Symptoms:**
- Theme toggle doesn't change colors
- `.dark` class present but styles unchanged

**Solutions:**
1. Verify `darkMode: ["class"]` in `tailwind.config.ts`
2. Check `.dark` section exists in `app/globals.css`
3. Ensure `<html>` or `<body>` has `class="dark"` when toggled
4. Test with: `document.documentElement.classList.toggle('dark')`

---

### Issue: "Focus rings not visible"

**Symptoms:**
- No outline when tabbing to buttons/inputs
- Accessibility test fails

**Solutions:**
1. Add `focus-visible:ring-2 focus-visible:ring-forest-canopy`
2. Ensure `outline-none` is NOT removing it
3. Check `--ring` CSS variable defined
4. Test with keyboard (Tab key), not mouse

---

### Issue: "Colors look wrong"

**Symptoms:**
- Colors don't match design tokens spec
- Weird color shifts in dark mode

**Solutions:**
1. Check HSL values in CSS variables (should be space-separated: `100 45% 45%`)
2. Verify no `oklch()` or other color functions interfering
3. Hard refresh browser (Cmd+Shift+R)
4. Check for conflicting global styles

---

## Success Criteria

WP2 is complete when:

- ✅ `app/globals.css` has all Ecovilla design tokens
- ✅ `tailwind.config.ts` extends with custom classes
- ✅ Component state utilities created and functional
- ✅ 2-3 components migrated successfully
- ✅ Accessibility tests pass WCAG 2.1 AA
- ✅ Documentation complete
- ✅ Git commit pushed
- ✅ Ready to start WP3 (component installation)

---

## Time Estimate

| Step | Duration | Can Parallelize? |
|------|----------|------------------|
| CSS Variables | 30 min | No |
| Tailwind Config | 30 min | No (depends on Step 1) |
| State Utilities | 30 min | Yes (after Step 2) |
| Component Migration | 45 min | Yes (after Step 3) |
| Accessibility Audit | 30 min | Yes (after Step 4) |
| Documentation | 30 min | Yes |
| **Total** | **2-3 hours** | |

**Can WP1 and WP2 run in parallel?**
✅ **YES!** WP2 only touches design system files, WP1 touches API/database.

---

## Next Steps After WP2

Once WP2 is complete:

1. **Review with team** - Share completion report
2. **Start WP3** - Install shadcn/MagicUI/CultUI components
3. **Build custom components** - Create Ecovilla-specific components
4. **Set up Storybook** - Document all components visually
5. **Begin screen development** - WP5-6 can now proceed

---

## Questions or Issues?

**Common Questions:**

**Q: Can I skip the accessibility test?**
A: No. WCAG compliance is mandatory and must be verified.

**Q: Do I need to migrate ALL components now?**
A: No. Migrate 2-3 to validate tokens work. Full migration happens in WP3.

**Q: What if I find missing tokens?**
A: Document in "Known Issues" section. Can add later in WP3.

**Q: Can I change token values?**
A: Yes, but discuss with MJ first. Update `design-tokens.css` and regenerate.

---

**End of WP2: Implementation Checklist**

**Status**: ✅ Ready to execute
**Next**: Begin Step 1 - Update CSS Variables