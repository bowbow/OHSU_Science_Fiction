export type ActivityEvent =
  | { kind: "signed-in"; username: string }
  | { kind: "registered"; username: string }
  | { kind: "signed-out"; username: string }
  | { kind: "suggested"; username: string; title: string }
  | { kind: "voted"; username: string; title: string; moved: boolean }
  | { kind: "removed-book"; username: string; title: string; suggestedBy: string }
  | { kind: "opened-suggestions"; username: string }
  | { kind: "chose-book"; username: string; title: string }
  | { kind: "closed-with-no-book"; username: string }
  | { kind: "started-new-book"; username: string }
  | { kind: "proposed-meeting"; username: string; when: string }
  | { kind: "voted-meeting"; username: string; when: string }
  | { kind: "withdrew-meeting"; username: string; when: string }
  | { kind: "removed-meeting"; username: string; when: string }
  | { kind: "chose-meeting"; username: string; when: string };

export function activityLine(at: Date, event: ActivityEvent): string {
  return `${utcStamp(at)}  ${activitySentence(event)}`;
}

export function activitySentence(event: ActivityEvent): string {
  switch (event.kind) {
    case "signed-in":
      return `${event.username} signed in`;
    case "registered":
      return `${event.username} registered`;
    case "signed-out":
      return `${event.username} signed out`;
    case "suggested":
      return `${event.username} suggested "${event.title}"`;
    case "voted":
      return event.moved
        ? `${event.username} moved their vote to "${event.title}"`
        : `${event.username} voted for "${event.title}"`;
    case "removed-book":
      return event.username === event.suggestedBy
        ? `${event.username} removed "${event.title}"`
        : `${event.username} removed "${event.title}", which ${event.suggestedBy} suggested`;
    case "opened-suggestions":
      return `${event.username} opened the club for book suggestions`;
    case "chose-book":
      return `${event.username} chose "${event.title}" as the book the club will read`;
    case "closed-with-no-book":
      return `${event.username} closed suggestions and no book was selected`;
    case "started-new-book":
      return `${event.username} started a new book`;
    case "proposed-meeting":
      return `${event.username} proposed ${event.when}`;
    case "voted-meeting":
      return `${event.username} voted to meet on ${event.when}`;
    case "withdrew-meeting":
      return `${event.username} withdrew their vote for ${event.when}`;
    case "removed-meeting":
      return `${event.username} removed the meeting time ${event.when}`;
    case "chose-meeting":
      return `${event.username} chose ${event.when} as the meeting`;
  }
}

function utcStamp(at: Date): string {
  const year = at.getUTCFullYear();
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  const day = String(at.getUTCDate()).padStart(2, "0");
  const hour = String(at.getUTCHours()).padStart(2, "0");
  const minute = String(at.getUTCMinutes()).padStart(2, "0");
  const second = String(at.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
}
