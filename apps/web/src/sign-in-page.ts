import type { Core, MemberView } from "@bookclub/core";
import { escapeHtml, page } from "./html.ts";
import { failureSentence } from "./messages.ts";

export function renderSignInPage(options: {
  member: MemberView | null;
  error?: string;
}): string {
  if (options.member) {
    return page({
      title: "Sign in",
      member: options.member,
      active: "sign-in",
      body: `<p>You are already signed in.</p><p><a href="/account">Go to your account</a></p>`,
    });
  }
  const error = options.error ? `<p class="error">${escapeHtml(options.error)}</p>` : "";
  return page({
    title: "Sign in",
    member: null,
    active: "sign-in",
    body: `${error}
<form class="sheet" method="post" action="/sign-in">
  <label>Username <input name="username" autocomplete="username" required></label>
  <label>Password <input name="password" type="password" autocomplete="current-password"></label>
  <button type="submit">Sign in</button>
</form>`,
  });
}

export function signInWithPasswordForm(
  core: Core,
  input: { username: string; password: string },
): { error?: string; sessionId?: string; username?: string } {
  const result = core.signInWithPassword({ username: input.username, password: input.password });
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { sessionId: result.sessionId, username: result.member.username };
}
