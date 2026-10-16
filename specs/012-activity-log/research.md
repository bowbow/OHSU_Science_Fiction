# Research: Activity Log

## Decision: Append a text file beside the database, and print the same line

**Rationale**: The operator asked to keep a record and to avoid noise. The EC2 service may write only under `/var/lib/bookclub`, and that directory already survives a new release because the SQLite file lives there. `activity.log` in that directory is kept the same way. Printing the same line lets the operator follow the running site without opening the file. The service journal is not the copy that must survive a release.

**Alternatives considered**: Journal only, which can be rotated away from the club data. A SQLite table, which would mix the operator record into club queries and need a page or a query tool to read. A logging package, which adds a dependency for one sentence per line.

## Decision: Record only successful changes

**Rationale**: The examples were "user X logged on", "user Y suggested book B", and "user C voted for book K". Wrong passwords, empty titles, duplicate titles, and voting again for the same book do not change the club. Leaving them out keeps the file readable.

**Alternatives considered**: Logging every refusal. That would fill the file with mistakes and still must not include the password. The specification excludes them.

## Decision: UTC, labeled, then a fixed sentence

**Rationale**: The EC2 host is in `us-east-1` and a reader may be elsewhere. A line that says `UTC` does not need a timezone guess. The sentences are fixed in the specification so the wording does not drift between clients.

**Alternatives considered**: The server's local time, which is ambiguous. JSON, which the operator would have to decipher.

## Decision: Build the sentence in the core and write it in the website

**Rationale**: The words describe club actions and must not be copied into a future client. Opening a file is a host concern and stays in the website.
