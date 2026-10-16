# Quickstart: Validate Responsive Mobile Layout

## Automated validation

```powershell
node --experimental-strip-types --test apps/web/test/responsive-layout.test.ts
node --experimental-strip-types --test packages/core/test/*.test.ts apps/web/test/*.test.ts
```

Expected: responsive CSS contracts and all existing behavior tests pass.

## Browser validation

Run the local server at `http://127.0.0.1:3456`, sign in as both a regular member and an admin, and inspect these viewport widths:

| Width | Expected result |
|---|---|
| 320px | one book column; no document overflow; compact spacing |
| 390px | top navigation; one book column; dialogs and calendar fit |
| 430px | top navigation; one book column; controls remain tappable |
| 768px | sidebar retained; two book columns; reading/calendar stack |
| 1280px | original desktop sidebar; three book columns; reading/calendar side by side |

For each width, check registration/sign-in, suggestion list, selected book, calendar, admin controls, long text, and confirmation dialogs. Rotate or resize without reloading and confirm immediate reflow.

On a touch/no-hover emulation, confirm covers do not enlarge or float. On a hover-capable desktop at 1280px, confirm existing cover enlargement remains.
