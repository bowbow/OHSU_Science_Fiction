# Contract: Cover on the book card

Before the book club page is rendered for a signed-in member, the website calls `ensureBookCovers`.

| Shown | When |
| --- | --- |
| Cover image, with the title not printed | `coverId` is present. The image address is `https://covers.openlibrary.org/b/id/{coverId}-M.jpg`. The image name is the title. |
| Title text and no image | `coverId` is absent, or the stored image fails to load. |
