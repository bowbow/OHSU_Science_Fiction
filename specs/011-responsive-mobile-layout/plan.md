# Implementation Plan: Responsive Mobile Layout

**Branch**: `011-responsive-mobile-layout` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-responsive-mobile-layout/spec.md`

## Summary

Refine the existing server-rendered CSS in `apps/web/src/html.ts` with width- and input-capability media queries. Preserve the wide desktop layout, add a two-column tablet book layout, convert the sidebar into compact horizontal top navigation on phones, constrain forms/dialogs/calendars to the viewport, maintain touch-sized actions, and suppress hover enlargement on touch/no-hover devices. No business rules, routes, persistence, or JavaScript device detection change.

## Technical Context

**Language/Version**: TypeScript on Node.js 24; embedded modern CSS

**Primary Dependencies**: Existing server-rendered HTML; CSS Grid, Flexbox, media queries, viewport units

**Storage**: Existing SQLite database unchanged

**Testing**: Node test runner for markup/style contracts; browser viewport inspection at 320, 390, 430, 768, and 1280 CSS pixels

**Target Platform**: Current mobile Safari, Chrome, and Firefox; desktop browsers remain supported

**Project Type**: Server-rendered web application with reusable platform-independent core

**Performance Goals**: No additional network requests or client-side script; immediate reflow on resize/orientation change

**Constraints**: CSS-only responsive behavior; preserve desktop design; no user-agent sniffing; no core changes

**Scale/Scope**: All existing BookClub pages, with detailed validation of navigation, books, selected-book/calendar, forms, and dialogs

## Constitution Check

*GATE: Passed before design and after design.*

- **I. Specification Before Implementation**: PASS. Feature 011 defines measurable responsive behavior.
- **II. Verified Behavior**: PASS. Automated CSS-contract checks and explicit viewport checks cover the scenarios.
- **III. Club Data Stays in the Club**: PASS. This feature changes presentation only and exposes no additional data.
- **IV. Smallest Design That Meets the Spec**: PASS. Existing CSS receives focused media-query changes; no dependency or client script is added.
- **V. Consistent, Recoverable Changes**: PASS. Desktop behavior and all server-side interactions remain unchanged.
- **VI. Platform-Independent Core**: PASS. Changes are confined to the web client; `packages/core` remains untouched.

## Project Structure

### Documentation (this feature)

```text
specs/011-responsive-mobile-layout/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── src/html.ts
└── test/responsive-layout.test.ts

package.json
```

**Structure Decision**: Keep responsive styling in the existing shared page shell because it governs every web page. Add one focused contract test for required viewport metadata, breakpoints, touch behavior, column changes, and overflow constraints.

## Responsive Design

- **Wide desktop, over 1050px**: retain the 7.75rem sidebar, three book columns, and selected book beside a 26-36rem calendar.
- **Tablet/narrow desktop, 701-1050px**: retain the sidebar, use two book columns, and stack selected book above the calendar.
- **Phone, up to 700px**: convert the page to one column; render the former sidebar as a compact top identity/navigation region; use two book columns where at least 30rem is available and one column below 480px; make forms and dialogs width-safe.
- **Very narrow phone, up to 380px**: reduce page/calendar spacing while preserving readable labels and touch-sized primary controls.
- **Touch/no-hover input**: stop floating and hover enlargement that can obscure actions. Reduced-motion preferences continue to stop animation.

## Complexity Tracking

No constitution violations require justification.
