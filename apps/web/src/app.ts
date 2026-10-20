import type { ActivityEvent, CatalogBook, Core } from "@bookclub/core";
import { clearSessionCookie, readSessionId, sessionCookie } from "./cookie.ts";
import { closeBookClubForm, formatMeetingTime, openBookClubForm, proposeMeetingForm, removeBookForm, removeMeetingForm, renderBookClubPage, renderBookMatchPage, selectMeetingForm, startOverForm, suggestBookForm, voteForBookForm, voteForMeetingForm, withdrawMeetingForm } from "./book-club-page.ts";
import { renderAccountPage } from "./account-page.ts";
import { renderRegisterPage, registerWithPasswordForm } from "./register-page.ts";
import { renderSignInPage, signInWithPasswordForm } from "./sign-in-page.ts";
import { renderAdminFeedbackPage, renderFeedbackPage, submitFeedbackForm } from "./feedback-page.ts";
import { failureSentence } from "./messages.ts";

export type WebRequest = {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  body?: string;
  query?: string;
};

export type WebResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

export function createApp(options: {
  core: Core;
  secureCookies?: boolean;
  covers?: (title: string) => Promise<number | null>;
  matches?: (title: string) => Promise<CatalogBook[]>;
  activityLog?: (event: ActivityEvent) => void;
}) {
  const secure = options.secureCookies ?? false;
  const record = (event: ActivityEvent) => {
    options.activityLog?.(event);
  };

  async function handle(request: WebRequest): Promise<WebResponse> {
    const method = request.method.toUpperCase();
    const path = request.path;
    const sessionId = readSessionId(request.headers.cookie);
    const member = options.core.currentMember(sessionId);
    const form = new URLSearchParams(request.body ?? "");

    if (method === "GET" && path === "/health") {
      return {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ status: "ok" }),
      };
    }
    if (method === "GET" && (path === "/" || path === "/account")) {
      return html(renderAccountPage(member), member ? sessionCookie(sessionId!, secure) : undefined);
    }
    if (method === "GET" && path === "/register") {
      return html(
        renderRegisterPage({ member }),
        member && sessionId ? sessionCookie(sessionId, secure) : undefined,
      );
    }
    if (method === "POST" && path === "/register") {
      const outcome = registerWithPasswordForm(options.core, {
        username: form.get("username") ?? "",
        password: form.get("password") ?? "",
        sessionId,
      });
      if (outcome.sessionId && outcome.username) {
        record({ kind: "registered", username: outcome.username });
        return redirect("/book-club", sessionCookie(outcome.sessionId, secure));
      }
      return html(
        renderRegisterPage({
          member: options.core.currentMember(sessionId),
          error: outcome.error,
        }),
      );
    }
    if (method === "GET" && path === "/sign-in") {
      return html(
        renderSignInPage({ member }),
        member && sessionId ? sessionCookie(sessionId, secure) : undefined,
      );
    }
    if (method === "POST" && path === "/sign-in") {
      if (member) {
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      const outcome = signInWithPasswordForm(options.core, {
        username: form.get("username") ?? "",
        password: form.get("password") ?? "",
      });
      if (outcome.sessionId && outcome.username) {
        record({ kind: "signed-in", username: outcome.username });
        return redirect("/book-club", sessionCookie(outcome.sessionId, secure));
      }
      return html(
        renderSignInPage({
          member: null,
          error: outcome.error,
        }),
      );
    }
    if (method === "GET" && path === "/feedback") {
      const submitted = new URLSearchParams(request.query ?? "").get("submitted") === "1";
      return html(
        renderFeedbackPage({ member, submitted }),
        member && sessionId ? sessionCookie(sessionId, secure) : undefined,
      );
    }
    if (method === "POST" && path === "/feedback") {
      const text = form.get("feedback") ?? "";
      const outcome = submitFeedbackForm(options.core, { sessionId, text });
      if (outcome.submitted) {
        return redirect("/feedback?submitted=1", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return html(
        renderFeedbackPage({
          member: options.core.currentMember(sessionId),
          error: outcome.error,
          text,
        }),
        member && sessionId ? sessionCookie(sessionId, secure) : undefined,
      );
    }
    if (method === "GET" && path === "/admin/feedback") {
      const result = options.core.feedbackForAdmin(sessionId);
      const deletedRaw = new URLSearchParams(request.query ?? "").get("deleted");
      const deleted = deletedRaw === null ? undefined : Number(deletedRaw);
      return html(
        renderAdminFeedbackPage({
          member,
          feedback: result.ok ? result.value : [],
          error: result.ok ? undefined : failureSentence(result.failure),
          deleted: Number.isSafeInteger(deleted) && deleted! >= 0 ? deleted : undefined,
        }),
        member && sessionId ? sessionCookie(sessionId, secure) : undefined,
      );
    }
    if (method === "POST" && path === "/admin/feedback/seen") {
      const result = options.core.markFeedbackSeen({
        sessionId,
        feedbackId: form.get("feedback") ?? "",
      });
      if (result.ok) {
        return { status: 204, headers: { "Cache-Control": "no-store" }, body: "" };
      }
      const status = result.failure.code === "feedback_not_found" ? 404 : 403;
      return {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        body: JSON.stringify({ error: result.failure.code }),
      };
    }
    if (method === "POST" && path === "/admin/feedback/delete") {
      const result = options.core.deleteFeedback({
        sessionId,
        feedbackIds: form.getAll("feedback"),
      });
      if (result.ok) {
        return redirect(`/admin/feedback?deleted=${result.value.deleted}`, sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      if (result.failure.code === "not_signed_in" || result.failure.code === "not_an_admin") {
        return {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
          body: failureSentence(result.failure),
        };
      }
      const feedback = options.core.feedbackForAdmin(sessionId);
      return html(
        renderAdminFeedbackPage({
          member,
          feedback: feedback.ok ? feedback.value : [],
          error: failureSentence(result.failure),
        }),
        member && sessionId ? sessionCookie(sessionId, secure) : undefined,
      );
    }
    if (method === "GET" && path === "/book-club") {
      return await bookClubPage(options, member, sessionId, secure, undefined, new URLSearchParams(request.query ?? "").get("month") ?? undefined);
    }
    if (method === "POST" && path === "/book-club/close") {
      const outcome = closeBookClubForm(options.core, {
        sessionId,
        suggestionId: form.get("suggestion"),
      });
      if (!outcome.error) {
        if (member && outcome.closed) {
          record(outcome.title
            ? { kind: "chose-book", username: member.username, title: outcome.title }
            : { kind: "closed-with-no-book", username: member.username });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/start-over") {
      const outcome = startOverForm(options.core, sessionId);
      if (!outcome.error) {
        if (member && outcome.started) {
          record({ kind: "started-new-book", username: member.username });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/open") {
      const outcome = openBookClubForm(options.core, sessionId);
      if (!outcome.error) {
        if (member && outcome.changed) {
          record({ kind: "opened-suggestions", username: member.username });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/suggestions") {
      const coverRaw = form.get("cover");
      let coverId: number | null = null;
      if (coverRaw !== null && coverRaw !== "") {
        const parsed = Number(coverRaw);
        if (!Number.isInteger(parsed)) {
          return await bookClubPage(
            options,
            options.core.currentMember(sessionId),
            sessionId,
            secure,
            "Choose one of the books that matched that title.",
          );
        }
        coverId = parsed;
      }
      const outcome = await suggestBookForm(options.core, {
        sessionId,
        title: form.get("title") ?? "",
        coverId,
        lookup: options.matches,
      });
      if (outcome.matches && outcome.title) {
        return html(
          renderBookMatchPage({
            member: options.core.currentMember(sessionId),
            title: outcome.title,
            matches: outcome.matches,
          }),
          sessionId ? sessionCookie(sessionId, secure) : undefined,
        );
      }
      if (!outcome.error) {
        if (member && outcome.title) {
          record({ kind: "suggested", username: member.username, title: outcome.title });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/suggestions/remove") {
      const outcome = removeBookForm(options.core, {
        sessionId,
        suggestionId: form.get("suggestion") ?? "",
      });
      if (!outcome.error) {
        if (member && outcome.title && outcome.suggestedBy) {
          record({
            kind: "removed-book",
            username: member.username,
            title: outcome.title,
            suggestedBy: outcome.suggestedBy,
          });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/meeting") {
      const outcome = proposeMeetingForm(options.core, { sessionId, startsAt: form.get("starts") ?? "" });
      if (!outcome.error) {
        if (member && outcome.startsAt) {
          record({ kind: "proposed-meeting", username: member.username, when: formatMeetingTime(outcome.startsAt) });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/meeting/remove") {
      const outcome = removeMeetingForm(options.core, { sessionId, meetingTimeId: form.get("meeting") ?? "" });
      if (!outcome.error) {
        if (member && outcome.startsAt) {
          record({ kind: "removed-meeting", username: member.username, when: formatMeetingTime(outcome.startsAt) });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/meeting/votes") {
      const outcome = voteForMeetingForm(options.core, { sessionId, meetingTimeId: form.get("meeting") ?? "" });
      if (!outcome.error) {
        if (member && outcome.recorded && outcome.startsAt) {
          record({ kind: "voted-meeting", username: member.username, when: formatMeetingTime(outcome.startsAt) });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/meeting/votes/remove") {
      const outcome = withdrawMeetingForm(options.core, { sessionId, meetingTimeId: form.get("meeting") ?? "" });
      if (!outcome.error) {
        if (member && outcome.removed && outcome.startsAt) {
          record({ kind: "withdrew-meeting", username: member.username, when: formatMeetingTime(outcome.startsAt) });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/meeting/select") {
      const outcome = selectMeetingForm(options.core, { sessionId, meetingTimeId: form.get("meeting") });
      if (!outcome.error) {
        if (member && outcome.startsAt) {
          record({ kind: "chose-meeting", username: member.username, when: formatMeetingTime(outcome.startsAt) });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/book-club/votes") {
      const outcome = voteForBookForm(options.core, {
        sessionId,
        suggestionId: form.get("suggestion") ?? "",
      });
      if (!outcome.error) {
        if (member && outcome.title && outcome.placed && outcome.placed !== "unchanged") {
          record({ kind: "voted", username: member.username, title: outcome.title, moved: outcome.placed === "moved" });
        }
        return redirect("/book-club", sessionId ? sessionCookie(sessionId, secure) : undefined);
      }
      return await bookClubPage(options, options.core.currentMember(sessionId), sessionId, secure, outcome.error);
    }
    if (method === "POST" && path === "/sign-out") {
      if (sessionId) {
        options.core.signOut(sessionId);
        if (member) {
          record({ kind: "signed-out", username: member.username });
        }
      }
      return redirect("/sign-in", clearSessionCookie(secure));
    }
    return { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" }, body: "Not found" };
  }

  return { handle, core: options.core };
}

async function bookClubPage(
  options: { core: Core; covers?: (title: string) => Promise<number | null> },
  member: ReturnType<Core["currentMember"]>,
  sessionId: string | null,
  secure: boolean,
  error?: string,
  month?: string,
): Promise<WebResponse> {
  if (member && options.covers) {
    await options.core.ensureBookCovers(sessionId, options.covers);
  }
  const rounds = member ? options.core.bookClubRounds(sessionId) : { ok: true as const, value: [] };
  return html(
    renderBookClubPage({
      member,
      rounds: rounds.ok ? rounds.value : [],
      error,
      month,
    }),
    member && sessionId ? sessionCookie(sessionId, secure) : undefined,
  );
}

function html(body: string, setCookie?: string): WebResponse {
  return {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...(setCookie ? { "Set-Cookie": setCookie } : {}),
    },
    body,
  };
}

function redirect(location: string, setCookie?: string): WebResponse {
  return {
    status: 303,
    headers: {
      Location: location,
      ...(setCookie ? { "Set-Cookie": setCookie } : {}),
    },
    body: "",
  };
}
