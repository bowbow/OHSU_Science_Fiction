import type { MemberView } from "@bookclub/core";
import { escapeHtml, page } from "./html.ts";

export function renderAccountPage(member: MemberView | null): string {
  if (!member) {
    return page({
      title: "Account",
      member: null,
      active: "account",
      body: `<p>You are signed out.</p><p><a href="/sign-in">Sign in</a></p>`,
    });
  }
  return page({
    title: "Account",
    member,
    active: "account",
    body: `<p>You are signed in as ${escapeHtml(member.username)}.</p><p>${member.role === "admin" ? "You are an admin." : "You are a regular member."}</p>`,
  });
}
