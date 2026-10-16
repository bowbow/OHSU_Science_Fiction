# Research: Book Covers

## Decisions

- **Open Library supplies covers.** Its search needs no key. A title query returns published-book matches, and a match with a cover id can be shown from the public cover image address.
- **One closest cover.** The search is limited to a few results. The site keeps the first result that has a cover. It does not present editions for the member to choose.
- **Remember the result.** Each suggestion stores the cover id, or records that no cover was found, so the list does not search again on every view. A failed request stays unchecked and can be tried on a later view.
- **The website only displays the image.** Choosing and storing the cover lives in the core. Tests supply a stand-in lookup and do not call Open Library.
