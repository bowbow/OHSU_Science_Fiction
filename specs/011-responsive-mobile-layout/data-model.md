# Data Model: Responsive Mobile Layout

This feature introduces no persistent data entities and changes no existing database schema.

## Presentation States

| State | Trigger | Required arrangement |
|---|---|---|
| Wide desktop | viewport > 1050px | sidebar + main content; 3 book columns; chosen book beside calendar |
| Intermediate | 701-1050px | sidebar + main content; 2 book columns; chosen book above calendar |
| Phone | 481-700px | top identity/navigation + content; 2 book columns when space permits; stacked reading content |
| Narrow phone | <= 480px | top identity/navigation + content; 1 book column |
| Very narrow phone | <= 380px | narrow-phone arrangement with reduced safe spacing |
| Touch/no hover | `(hover: none)` or `(pointer: coarse)` | no cover float or hover enlargement |

## Invariants

1. Responsive state does not change server routes, permissions, or submitted fields.
2. The document width never exceeds the viewport width from 320px upward.
3. Desktop presentation remains unchanged above 1050px.
4. Input-capability rules may disable decorative motion but never hide information or actions.
