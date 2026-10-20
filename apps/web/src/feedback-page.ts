import { MAX_FEEDBACK_WORDS, feedbackWordCount, type Core, type FeedbackView, type MemberView } from "@bookclub/core";
import { escapeHtml, page } from "./html.ts";
import { failureSentence } from "./messages.ts";

export function renderFeedbackPage(options: {
  member: MemberView | null;
  error?: string;
  submitted?: boolean;
  text?: string;
}): string {
  if (!options.member) {
    return page({
      title: "Provide feedback",
      member: null,
      active: "feedback",
      body: `<p>Sign in to provide feedback.</p><p><a href="/sign-in">Sign in</a></p>`,
    });
  }

  const text = options.text ?? "";
  const error = options.error ? `<p class="error">${escapeHtml(options.error)}</p>` : "";
  if (options.submitted) {
    return page({
      title: "Provide feedback",
      heading: "Provide feedback",
      member: options.member,
      active: "feedback",
      body: `<section class="sheet feedback-form">
        <p class="success" role="status">Your feedback has been collected and will be shown to the site admins. Thank you.</p>
      </section>`,
    });
  }
  const words = feedbackWordCount(text);

  return page({
    title: "Provide feedback",
    heading: "Provide feedback",
    member: options.member,
    active: "feedback",
    body: `${error}
      <section class="sheet feedback-form">
        <p>Share feedback about the books, the website, or anything else related to the book club.</p>
        <form method="post" action="/feedback">
          <label for="feedback-text">Your feedback</label>
          <textarea id="feedback-text" name="feedback" rows="14" required aria-describedby="feedback-help feedback-count">${escapeHtml(text)}</textarea>
          <div class="feedback-form-meta">
            <p id="feedback-help">Maximum ${MAX_FEEDBACK_WORDS.toLocaleString("en-US")} words.</p>
            <p id="feedback-count" aria-live="polite">${words.toLocaleString("en-US")} / ${MAX_FEEDBACK_WORDS.toLocaleString("en-US")} words</p>
          </div>
          <div class="feedback-form-actions">
            <button type="submit">Submit feedback</button>
            <a class="feedback-cancel" href="/book-club">Cancel</a>
          </div>
        </form>
      </section>
      <script>
        (() => {
          const field = document.getElementById("feedback-text");
          const count = document.getElementById("feedback-count");
          if (!field || !count) return;
          const update = () => {
            const words = field.value.trim() === "" ? 0 : field.value.trim().split(/\\s+/u).length;
            count.textContent = words.toLocaleString("en-US") + " / ${MAX_FEEDBACK_WORDS.toLocaleString("en-US")} words";
            count.classList.toggle("over-limit", words > ${MAX_FEEDBACK_WORDS});
          };
          field.addEventListener("input", update);
          update();
        })();
      </script>`,
  });
}

export function renderAdminFeedbackPage(options: {
  member: MemberView | null;
  feedback: FeedbackView[];
  error?: string;
  deleted?: number;
}): string {
  if (!options.member) {
    return page({
      title: "Feedback",
      member: null,
      active: "feedback-admin",
      body: `<p>Sign in as an admin to view feedback.</p><p><a href="/sign-in">Sign in</a></p>`,
    });
  }

  const error = options.error ? `<p class="error">${escapeHtml(options.error)}</p>` : "";
  const deletion = options.deleted === undefined
    ? ""
    : `<p class="success" role="status">${options.deleted === 1 ? "1 feedback item was" : `${options.deleted} feedback items were`} deleted.</p>`;
  const list = options.feedback.length === 0
    ? `<p>No feedback has been submitted yet.</p>`
    : `<form class="feedback-delete-form" method="post" action="/admin/feedback/delete" onsubmit="return confirm('Delete the selected feedback items for all admins?');">
        <ol class="feedback-list">${options.feedback.map(feedbackItem).join("")}</ol>
        <button type="submit" class="feedback-delete-button">Delete selected items</button>
      </form>`;
  const seenScript = options.feedback.length === 0 ? "" : `<script>
    (() => {
      document.querySelectorAll(".feedback-item.is-unseen").forEach((item) => {
        item.addEventListener("toggle", async () => {
          if (!item.open || !item.classList.contains("is-unseen")) return;
          try {
            const body = new URLSearchParams({ feedback: item.dataset.feedbackId });
            const response = await fetch("/admin/feedback/seen", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body,
            });
            if (response.ok) {
              item.classList.remove("is-unseen");
              item.classList.add("is-seen");
            }
          } catch {
            // Keep the item visibly unseen so the admin can try again.
          }
        });
      });
    })();
  </script>`;

  return page({
    title: "Feedback",
    heading: "Feedback",
    member: options.member,
    active: "feedback-admin",
    body: `${deletion}${error}<p>Feedback is shown newest first. Unseen items are bold. Select a row to read the complete message.</p>${list}${seenScript}`,
  });
}

export function submitFeedbackForm(
  core: Core,
  input: { sessionId: string | null; text: string },
): { error?: string; submitted?: boolean } {
  const result = core.submitFeedback(input);
  return result.ok ? { submitted: true } : { error: failureSentence(result.failure) };
}

function feedbackItem(item: FeedbackView): string {
  const summary = feedbackSummary(item.text);
  return `<li>
    <label class="feedback-select">
      <input type="checkbox" name="feedback" value="${escapeHtml(item.id)}" aria-label="Select feedback from ${escapeHtml(item.username)} on ${escapeHtml(feedbackDate(item.submittedAt))}">
    </label>
    <details class="feedback-item ${item.seen ? "is-seen" : "is-unseen"}" data-feedback-id="${escapeHtml(item.id)}">
      <summary class="feedback-summary-line">
        <time datetime="${escapeHtml(item.submittedAt)}">${escapeHtml(feedbackDate(item.submittedAt))}</time>
        <span class="feedback-user" title="User ${escapeHtml(item.username)}">${escapeHtml(item.username)}</span>
        <span class="feedback-preview">${escapeHtml(summary)}</span>
      </summary>
      <p class="feedback-full">${escapeHtml(item.text)}</p>
    </details>
  </li>`;
}

export function feedbackSummary(text: string, maximumWords = 50): string {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  const summary = words.slice(0, maximumWords).join(" ");
  return words.length > maximumWords ? `${summary}…` : summary;
}

function feedbackDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles",
  }).format(date);
}
