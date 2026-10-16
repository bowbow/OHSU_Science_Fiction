# Tasks: Responsive Mobile Layout

**Input**: Design documents from `/specs/011-responsive-mobile-layout/`

## Phase 1: Setup

- [X] T001 Add responsive layout test coverage to the root test command in package.json
- [X] T002 [P] Create responsive CSS contract tests in apps/web/test/responsive-layout.test.ts

## Phase 2: Foundational

- [X] T003 Confirm and preserve viewport metadata and global width-safety rules in apps/web/src/html.ts

## Phase 3: User Story 1 - Use BookClub on a Phone (Priority: P1) 🎯 MVP

**Independent Test**: At 390px, all pages fit without horizontal overflow and phone navigation, books, calendars, forms, and dialogs remain usable.

- [X] T004 [US1] Reflow the sidebar into compact wrapping phone navigation at 700px in apps/web/src/html.ts
- [X] T005 [US1] Add phone-safe content, form, input, button, dialog, and text wrapping constraints in apps/web/src/html.ts
- [X] T006 [US1] Make books and calendars fit narrow phones with one-column behavior below 480px in apps/web/src/html.ts
- [X] T007 [US1] Disable cover floating and enlargement for touch/no-hover inputs in apps/web/src/html.ts

## Phase 4: User Story 2 - Use BookClub on a Tablet or Narrow Window (Priority: P2)

**Independent Test**: At 768px, books use two columns and selected-book/calendar content stacks without clipping.

- [X] T008 [US2] Add the intermediate two-column book layout and stacked reading layout between 701px and 1050px in apps/web/src/html.ts
- [X] T009 [US2] Add very-narrow phone calendar and spacing refinements at 380px in apps/web/src/html.ts

## Phase 5: User Story 3 - Preserve the Desktop Experience (Priority: P3)

**Independent Test**: At 1280px, sidebar, three book columns, side-by-side reading content, animation, and hover enlargement remain.

- [X] T010 [US3] Preserve wide-layout selectors and desktop hover behavior in apps/web/src/html.ts

## Phase 6: Validation

- [X] T011 Run all automated tests from package.json and confirm core behavior is unchanged
- [X] T012 Validate responsive breakpoint contracts for 320px, 390px, 430px, 768px, and 1280px and confirm the live 944px layout has no horizontal overflow against specs/011-responsive-mobile-layout/quickstart.md

## Dependencies

- T001-T003 establish tests and global constraints.
- T004-T007 complete the phone MVP.
- T008-T009 refine intermediate and very narrow widths.
- T010 confirms desktop preservation after all responsive rules exist.
- T011-T012 validate the complete feature.

## Parallel Opportunities

- T001 and T002 can proceed together.
- Geometry inspection preparation can occur while T004-T010 are implemented.

## Implementation Strategy

Implement contract tests first, then phone rules, intermediate rules, desktop preservation, and full viewport validation. All tasks follow the required checkbox, sequential ID, story label, and exact file-path format.
