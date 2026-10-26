# Changelog

This file records user-visible changes to the OHSU Science Fiction Bookclub website.

Items under **Unreleased** have not yet been deployed to production. When a deployment is completed, these items should be moved into a dated release section.

## Unreleased

Production baseline: `53a6352`

### Added

- Added a one-command PowerShell script that downloads the production activity log through AWS Systems Manager and opens it with `more`.
- Added a prominent slide-out information control on each available book card with its Google Books story summary, genres, source link, and cover fallback when available; clicking outside closes the drawer.
- Added secure local and production configuration plumbing for the Google Books integration.
- Added a confirmation dialog before an administrator removes a book that already has one or more votes.
- Added a full-width, notched sci-fi divider between the book tiles and the book-administration controls.

### Changed

- Made every PowerShell AWS helper fall back to the `default` profile when `-AwsProfile` is omitted or blank, and made the paged log viewer show downloaded or existing logs in the computer's local timezone while retaining the UTC file.
- Kept the exact Open Library cover selected by an administrator and restricted Google Books details to editions whose ISBN Open Library assigns to that same work; unverified legacy details are no longer shown.
- Replaced the administrator's inline **Remove** button with an angular **X** in the upper-right corner of each book tile, reducing the chance of accidentally selecting it instead of **View voters**.
- Reduced the vertical space between the vote control and **View voters**.
- Made text-only book tiles the same size as tiles with cover images and gave both types the same floating animation.
- Positioned vote totals outside the visual frame for both image and text-only book tiles.
- Centered text-only book titles and book-cover images vertically within their tiles.
- Grouped the administrator controls under an **Add a new book** heading and moved **Close the call for new books** to the right of the add-book panel.
- Kept the add-book controls responsive by stacking them on narrow screens.
