import assert from "node:assert/strict";
import { test } from "node:test";
import { activityLine, type ActivityEvent } from "../src/activity.ts";

const at = new Date("2026-10-07T17:25:03.000Z");

function line(event: ActivityEvent): string {
  return activityLine(at, event);
}

test("activity lines use a UTC time and a plain sentence", () => {
  const lines = [
    line({ kind: "registered", username: "ada" }),
    line({ kind: "signed-in", username: "bow" }),
    line({ kind: "signed-out", username: "bow" }),
    line({ kind: "suggested", username: "ada", title: "The Left Hand of Darkness" }),
    line({ kind: "voted", username: "coco", title: "Foundation", moved: false }),
    line({ kind: "voted", username: "coco", title: "Foundation", moved: true }),
    line({ kind: "removed-book", username: "ada", title: "Foundation", suggestedBy: "ada" }),
    line({ kind: "removed-book", username: "bow", title: "Foundation", suggestedBy: "ada" }),
    line({ kind: "opened-suggestions", username: "bow" }),
    line({ kind: "chose-book", username: "bow", title: "Foundation" }),
    line({ kind: "closed-with-no-book", username: "bow" }),
    line({ kind: "started-new-book", username: "bow" }),
    line({ kind: "proposed-meeting", username: "bow", when: "Thursday, October 15, 2026 at 7:00 PM" }),
    line({ kind: "voted-meeting", username: "ada", when: "Thursday, October 15, 2026 at 7:00 PM" }),
    line({ kind: "withdrew-meeting", username: "ada", when: "Thursday, October 15, 2026 at 7:00 PM" }),
    line({ kind: "removed-meeting", username: "bow", when: "Thursday, October 15, 2026 at 7:00 PM" }),
    line({ kind: "chose-meeting", username: "bow", when: "Thursday, October 15, 2026 at 7:00 PM" }),
  ];
  assert.deepEqual(lines, [
    "2026-10-07 17:25:03 UTC  ada registered",
    "2026-10-07 17:25:03 UTC  bow signed in",
    "2026-10-07 17:25:03 UTC  bow signed out",
    '2026-10-07 17:25:03 UTC  ada suggested "The Left Hand of Darkness"',
    '2026-10-07 17:25:03 UTC  coco voted for "Foundation"',
    '2026-10-07 17:25:03 UTC  coco moved their vote to "Foundation"',
    '2026-10-07 17:25:03 UTC  ada removed "Foundation"',
    '2026-10-07 17:25:03 UTC  bow removed "Foundation", which ada suggested',
    "2026-10-07 17:25:03 UTC  bow opened the club for book suggestions",
    '2026-10-07 17:25:03 UTC  bow chose "Foundation" as the book the club will read',
    "2026-10-07 17:25:03 UTC  bow closed suggestions and no book was selected",
    "2026-10-07 17:25:03 UTC  bow started a new book",
    "2026-10-07 17:25:03 UTC  bow proposed Thursday, October 15, 2026 at 7:00 PM",
    "2026-10-07 17:25:03 UTC  ada voted to meet on Thursday, October 15, 2026 at 7:00 PM",
    "2026-10-07 17:25:03 UTC  ada withdrew their vote for Thursday, October 15, 2026 at 7:00 PM",
    "2026-10-07 17:25:03 UTC  bow removed the meeting time Thursday, October 15, 2026 at 7:00 PM",
    "2026-10-07 17:25:03 UTC  bow chose Thursday, October 15, 2026 at 7:00 PM as the meeting",
  ]);
});
