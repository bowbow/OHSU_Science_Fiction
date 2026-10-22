import type { Core, MemberView } from "@bookclub/core";
import { escapeHtml, page } from "./html.ts";
import { failureSentence } from "./messages.ts";

export function renderRegisterPage(options: {
  member: MemberView | null;
  error?: string;
  username?: string;
}): string {
  if (options.member) {
    return page({
      title: "Register",
      member: options.member,
      active: "register",
      body: `<p class="error">You are already signed in.</p><p><a href="/account">Go to your account</a></p>`,
    });
  }
  const error = options.error
    ? `<p class="error form-error" role="alert">${escapeHtml(options.error)}</p>`
    : "";
  return page({
    title: "Register",
    member: null,
    active: "register",
    body: `<form class="sheet" method="post" action="/register" novalidate>
  ${error}
  <label for="register-username">Username</label>
  <input id="register-username" name="username" type="email" autocomplete="username" required pattern="[^@\\s]+@[Oo][Hh][Ss][Uu]\\.[Ee][Dd][Uu]" title="Please use your OHSU email as your username." aria-describedby="register-username-help" value="${escapeHtml(options.username ?? "")}">
  <p class="form-help" id="register-username-help">Please use your OHSU email as your username.</p>
  <label for="register-password">Password</label>
  <input id="register-password" name="password" type="password" autocomplete="new-password" aria-describedby="register-password-help">
  <p class="form-help" id="register-password-help">Choose your password. Please do not use a password that you use elsewhere!</p>
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
