# Research: Responsive Mobile Layout

## Decision 1: Capability and viewport queries instead of device detection

**Decision**: Use CSS `max-width`, `hover`, and `pointer` media features.

**Rationale**: Available space and input capability determine whether a layout fits. User-agent detection is brittle, misses split-screen and rotation, and requires ongoing device lists.

**Alternatives considered**:

- User-agent detection: rejected because device identity does not reliably describe viewport size or input hardware.
- Server-selected mobile HTML: rejected because it duplicates presentation and cannot react to rotation without navigation.
- Client-side resize JavaScript: rejected because CSS already solves the layout requirement immediately and accessibly.

## Decision 2: Three layout bands plus a narrow-phone refinement

**Decision**: Preserve the existing 1050px content breakpoint, retain 700px for the navigation transformation, add a 480px book-column breakpoint, and add a 380px spacing refinement.

**Rationale**: The design has three natural constraints: selected book plus calendar, sidebar plus content, and two book covers plus actions. Separate thresholds avoid forcing every intermediate screen into a single column.

**Alternatives considered**:

- One 700px breakpoint: current behavior is too abrupt and wastes medium-width screens.
- Many device-specific breakpoints: unnecessary and difficult to maintain.

## Decision 3: Keep navigation visible rather than introduce a menu

**Decision**: Reflow identity and navigation into a wrapping top bar on phones.

**Rationale**: The site has very few actions. A menu button would add state, scripting, and an extra interaction without saving meaningful space.

## Decision 4: Disable cover hover effects for touch/no-hover

**Decision**: Suppress floating animation and cover scaling when `hover: none` or `pointer: coarse` is reported.

**Rationale**: Touch browsers can emulate sticky hover states, and a scaled cover can conceal controls. Desktop hover remains unchanged.

## Decision 5: Validate both structure and rendered geometry

**Decision**: Add source-level CSS contract tests and inspect rendered pages at representative viewport widths.

**Rationale**: Contract tests prevent accidental removal of breakpoints, while geometry checks catch overflow and overlap that text assertions cannot detect.
