# Feature Specification: Responsive Mobile Layout

**Feature Branch**: `011-responsive-mobile-layout`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Optimize the existing desktop BookClub website layout for people accessing it from mobile phones while preserving the desktop experience."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use BookClub on a Phone (Priority: P1)

As a member using a phone, I can navigate, read club information, view books, and use available actions without horizontal scrolling, overlapping content, or controls extending outside the screen.

**Why this priority**: The primary problem is that the current desktop-oriented layout becomes disorganized on phone-sized screens.

**Independent Test**: Open each signed-out, regular-member, and admin page at 390 CSS pixels wide and complete its available actions without horizontal page scrolling or overlapping controls.

**Acceptance Scenarios**:

1. **Given** a viewport no wider than 700 CSS pixels, **When** any BookClub page loads, **Then** navigation appears as a compact top area and the main content uses the full available width below it.
2. **Given** a member views book suggestions on a phone, **When** covers and actions are displayed, **Then** they fit the viewport and remain readable and tappable.
3. **Given** a selected book and meeting calendar are displayed on a phone, **When** the page loads, **Then** they stack vertically without overlap or clipped calendar cells.
4. **Given** a touch-oriented device, **When** a member interacts with book covers, **Then** no hover-only enlargement obscures neighboring controls.

---

### User Story 2 - Use BookClub on a Tablet or Narrow Window (Priority: P2)

As a member using a tablet, rotated phone, split-screen window, or narrow desktop window, I receive a layout that makes useful use of the available width rather than jumping directly between desktop and single-column extremes.

**Why this priority**: Responsive behavior must follow available space and work beyond a small set of phone models.

**Independent Test**: Resize the site through widths from 701 to 1050 CSS pixels and verify books, selected-book content, and calendar content reflow without overlap.

**Acceptance Scenarios**:

1. **Given** an intermediate-width viewport, **When** book suggestions are displayed, **Then** the layout uses fewer columns when necessary while retaining more than one column when space permits.
2. **Given** an intermediate-width viewport, **When** the selected book and calendar cannot fit side by side, **Then** they stack with clear spacing.
3. **Given** the viewport changes orientation or size, **When** the browser recalculates layout, **Then** no reload or device detection is required.

---

### User Story 3 - Preserve the Desktop Experience (Priority: P3)

As a desktop member, I retain the established sidebar, three-column book layout, chosen-book/calendar arrangement, colors, animation, and actions.

**Why this priority**: Mobile improvements must not regress a desktop layout the owner already considers successful.

**Independent Test**: Open representative pages at 1280 CSS pixels wide and compare structure and behavior with the current desktop design.

**Acceptance Scenarios**:

1. **Given** a viewport wider than 1050 CSS pixels, **When** the BookClub page loads, **Then** the left sidebar and three-column book layout remain.
2. **Given** a pointer device that supports hover, **When** a member hovers over a cover, **Then** the existing cover enlargement remains available.
3. **Given** either responsive layout, **When** a member submits an action, **Then** the same server-side behavior and permissions apply.

### Edge Cases

- A phone viewport is as narrow as 320 CSS pixels.
- A phone rotates between portrait and landscape while the page is open.
- A book title fallback is long and has no cover image.
- An admin name or navigation label is unusually long.
- A calendar contains multiple proposed times on one day.
- A confirmation or meeting-time dialog opens on a narrow screen.
- Browser text scaling is increased.
- The device reports touch input while also having a wide viewport.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST choose its presentation from available viewport width and input capabilities without requiring phone-model or user-agent detection.
- **FR-002**: The existing viewport metadata MUST remain present so CSS pixel widths correspond to the device viewport.
- **FR-003**: At widths up to 700 CSS pixels, the sidebar MUST become a compact top section above the main content.
- **FR-004**: At widths up to 700 CSS pixels, content MUST fit without horizontal page scrolling at widths down to 320 CSS pixels.
- **FR-005**: Book suggestions MUST display responsively: three columns on wide desktop, two columns where enough intermediate width exists, and one column only on narrow phones.
- **FR-006**: The selected book and meeting calendar MUST stack when their side-by-side layout no longer fits.
- **FR-007**: Calendar cells, times, vote counts, month navigation, and admin proposal controls MUST remain legible and operable at phone widths.
- **FR-008**: Interactive controls on phone layouts MUST provide tap targets of at least 44 CSS pixels in height or equivalent spacing, except compact inline calendar navigation where surrounding spacing provides the target.
- **FR-009**: Cover enlargement MUST be disabled on devices that do not support hover or have a coarse primary pointer.
- **FR-010**: Dialogs, forms, text inputs, book covers, images, and buttons MUST not exceed the visible content width.
- **FR-011**: Text MUST wrap without forcing the page wider than the viewport.
- **FR-012**: Responsive presentation MUST NOT alter authentication, roles, book-club state, voting, selection, or meeting behavior.
- **FR-013**: Desktop viewports wider than 1050 CSS pixels MUST retain the existing sidebar, three-column book arrangement, and side-by-side selected-book/calendar layout.
- **FR-014**: Layout changes MUST respond immediately when the viewport width or orientation changes, without a page reload.
- **FR-015**: Existing reduced-motion behavior MUST remain supported.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Representative signed-out, regular-member, and admin pages have no horizontal document overflow at viewport widths of 320, 390, 430, 768, and 1280 CSS pixels.
- **SC-002**: All visible primary actions can be reached and activated at 390 CSS pixels without controls overlapping or being clipped.
- **SC-003**: The book list displays one column at 390 CSS pixels, two columns at 768 CSS pixels, and three columns at 1280 CSS pixels when at least three suggestions exist.
- **SC-004**: The selected book and calendar are vertically stacked at 390 and 768 CSS pixels and side by side at 1280 CSS pixels.
- **SC-005**: Existing automated behavior tests continue to pass without changes to core business rules.
- **SC-006**: Cover enlargement is absent for touch/no-hover input and remains available for hover-capable desktop input.

## Assumptions

- Responsive layout is based on viewport and input capabilities, not device identity.
- The existing colors, typography, content hierarchy, and desktop visual design remain the baseline.
- No JavaScript navigation menu is necessary; the small number of sidebar actions can reflow into a compact top area.
- Browser support includes current mobile Safari, Chrome, and Firefox versions with modern CSS media queries and grid layout.
