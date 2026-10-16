import type { Core, MemberView } from "@bookclub/core";
import { escapeHtml, page } from "./html.ts";
import { failureSentence } from "./messages.ts";

export function renderRegisterPage(options: {
  member: MemberView | null;
  error?: string;
}): string {
  if (options.member) {
    return page({
      title: "Register",
      member: options.member,
      active: "register",
      body: `<p class="error">You are already signed in.</p><p><a href="/account">Go to your account</a></p>`,
    });
  }
  const error = options.error ? `<p class="error">${escapeHtml(options.error)}</p>` : "";
  return page({
    title: "Register",
    member: null,
    active: "register",
    body: `${error}
<form class="sheet" method="post" action="/register">
  <label>Username <input name="username" autocomplete="username" required></label>
  <label>Password <input name="password" type="password" autocomplete="new-password"></label>
  <button type="submit">Create account</button>
</form>`,
  });
}

export function registerWithPasswordForm(
  core: Core,
  input: { username: string; password: string; sessionId: string | null },
): { error?: string; sessionId?: string; username?: string } {
  if (input.sessionId && core.currentMember(input.sessionId)) {
    return { error: "You are already signed in." };
  }
  const result = core.registerWithPassword({
    username: input.username,
    password: input.password,
    sessionId: input.sessionId,
  });
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { sessionId: result.sessionId, username: result.member.username };
}
