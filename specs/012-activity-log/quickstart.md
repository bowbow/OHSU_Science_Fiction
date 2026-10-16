# Quickstart: Activity Log

## Read the record on EC2

The file is kept next to the database:

```text
/var/lib/bookclub/activity.log
```

A new release does not replace `/var/lib/bookclub`. After deployment, lines written earlier are still at the end of that file.

The same lines are printed by the BookClub service. `sudo journalctl -u bookclub` shows them together with the one startup line. The file itself contains only activity lines.

## What a line looks like

```text
2026-10-07 17:25:03 UTC  bow signed in
2026-10-07 17:26:10 UTC  ada suggested "The Left Hand of Darkness"
2026-10-07 17:27:00 UTC  ada voted for "The Left Hand of Darkness"
```

## Checks

1. Register a member, suggest a book, and vote for it. The file gains three matching sentences and does not contain the password.
2. Sign in with the wrong password. The file does not gain a line.
3. Vote again for the same book. The file does not gain a line.
4. Open the site as that member and confirm no page shows the activity file.
5. Deploy a new release and confirm the earlier lines are still in `/var/lib/bookclub/activity.log`.
