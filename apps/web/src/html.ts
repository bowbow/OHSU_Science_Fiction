import type { MemberView } from "@bookclub/core";

export const SITE_NAME = "OHSU Science Fiction Bookclub";
export const NAV_SITE_NAME = "OHSU SF Bookclub";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type PageId = "account" | "register" | "sign-in" | "book-club" | "feedback" | "feedback-admin";

export function memberName(member: MemberView): string {
  return member.username;
}

function navItem(label: string, href: string, active: boolean): string {
  const current = active ? ` aria-current="page"` : "";
  return `<a href="${href}"${current}>${label}</a>`;
}

export function page(options: {
  title: string;
  heading?: string;
  member: MemberView | null;
  body: string;
  active: PageId;
  sidebarAction?: string;
}): string {
  const role = options.member?.role === "admin" ? `<p class="member-role">Admin</p>` : "";
  const name = options.member
    ? `<p class="signed-in-name">${escapeHtml(memberName(options.member))}</p>
       ${role}`
    : "";
  const account = options.member?.role === "admin"
    ? `${navItem("Account", "/account", options.active === "account")}
       ${navItem("Book club", "/book-club", options.active === "book-club")}
       ${navItem("View feedback", "/admin/feedback", options.active === "feedback-admin")}`
    : "";
  const provideFeedback = options.member
    ? navItem("Provide feedback", "/feedback", options.active === "feedback")
    : "";
  const nav = options.member
    ? `${account}
       ${provideFeedback}
       ${options.sidebarAction ?? ""}
       <form method="post" action="/sign-out"><button type="submit">Sign out</button></form>`
    : `${navItem("Register", "/register", options.active === "register")}
       ${navItem("Sign in", "/sign-in", options.active === "sign-in")}`;
  return `<!DOCTYPE html>
<html lang="en" data-variant="scifi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)} · ${SITE_NAME}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Orbitron:wght@500;600;700&display=swap">
  <script>
    (() => {
      try {
        const requestedVariant = new URLSearchParams(window.location.search).get("variant");
        const hasRequestedVariant = requestedVariant === "scifi" || requestedVariant === "classic";
        if (hasRequestedVariant) sessionStorage.setItem("site-variant", requestedVariant);
        const selectedVariant = hasRequestedVariant
          ? requestedVariant
          : sessionStorage.getItem("site-variant") || "scifi";
        if (selectedVariant === "classic") delete document.documentElement.dataset.variant;
        else document.documentElement.dataset.variant = "scifi";
      } catch {}
    })();
  </script>
  <style>
    :root {
      --paper: #ffffff;
      --surface: #dee2ee;
      --ink: #1c2430;
      --accent: #244e8b;
      --accent-deep: #1c3f72;
      --line: #cfd1d9;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html { max-width: 100%; }
    body {
      margin: 0;
      max-width: 100%;
      overflow-x: hidden;
      font-family: "Instrument Sans", "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--paper);
    }
    img { max-width: 100%; height: auto; }
    .layout {
      display: grid;
      grid-template-columns: 7.75rem minmax(0, 1fr);
      min-height: 100vh;
      background: linear-gradient(
        180deg,
        var(--accent) 0 5.6rem,
        #5f88bc 14rem,
        #b7cce3 28rem,
        #eef3f8 46rem,
        var(--paper) 64rem
      );
    }
    aside {
      background: transparent;
      color: white;
      padding: 1.2rem 0.7rem 1.6rem 0.55rem;
    }
    .mark { margin: 0 0 1.4rem; font-weight: 600; }
    .sun {
      display: inline-block;
      width: 1.05rem;
      height: 1.05rem;
      margin-right: 0.35rem;
      border-radius: 50%;
      background: white;
      vertical-align: -2px;
    }
    .signed-in-name { margin: 0; font-size: 1.2rem; font-weight: 600; overflow-wrap: anywhere; }
    .member-role {
      margin: 0.2rem 0 1.4rem;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.78);
    }
    nav { display: flex; flex-direction: column; gap: 0.2rem; }
    nav a, nav button {
      display: block;
      width: 100%;
      box-sizing: border-box;
      text-align: left;
      color: white;
      background: transparent;
      border: 0;
      border-radius: 999px;
      padding: 0.45rem 0.45rem;
      font: inherit;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-decoration: none;
      cursor: pointer;
    }
    nav a[aria-current="page"], nav a:hover { background: rgba(255, 255, 255, 0.16); }
    nav > form button {
      margin-top: 0.55rem;
      text-align: center;
      letter-spacing: 0;
      text-transform: none;
      font-size: 0.72rem;
      padding: 0.35rem 0.4rem;
      color: var(--accent);
      background: white;
    }
    nav > form button:hover { background: #e7eef6; }
    nav button.start-over-open {
      margin-top: 0.9rem;
      text-align: center;
      letter-spacing: 0;
      text-transform: none;
      font-size: 0.72rem;
      line-height: 1.25;
      white-space: normal;
      color: white;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.75);
    }
    nav button.start-over-open:hover { background: rgba(255, 255, 255, 0.16); }
    main { background: transparent; }
    .banner {
      position: relative;
      overflow: hidden;
      padding: 3.2rem 2.6rem 1.2rem;
      color: white;
      background: transparent;
    }
    .banner::after {
      content: "";
      position: absolute;
      width: 16rem;
      height: 16rem;
      right: -3rem;
      top: -5rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.16);
    }
    .banner h1 { position: relative; margin: 0; font-size: 2.5rem; font-weight: 600; line-height: 1.15; }
    .content { padding: 1.35rem 2.6rem 3rem; background: transparent; }
    main h2 { margin: 0 0 1.4rem; color: white; font-size: 1.2rem; font-weight: 600; text-shadow: 0 1px 1px rgba(28, 63, 114, 0.25); }
    main a { color: var(--accent); font-weight: 600; }
    .sheet {
      background: var(--surface);
      border-radius: 1.25rem;
      box-shadow: 0 12px 32px rgba(36, 78, 139, 0.08);
    }
    .sheet { max-width: 26rem; margin-top: 1rem; padding: 1.25rem 1.3rem 1.4rem; }
    label { display: block; margin-top: 0.9rem; font-weight: 600; }
    .form-help { margin: 0.45rem 0 0; color: #526174; font-size: 0.9rem; line-height: 1.4; }
    input {
      width: 100%;
      max-width: 24rem;
      margin-top: 0.35rem;
      padding: 0.75rem 0.85rem;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-radius: 0.8rem;
      background: var(--paper);
      font: inherit;
    }
    input:focus { outline: 2px solid var(--accent); border-color: transparent; }
    button {
      border: 0;
      border-radius: 999px;
      padding: 0.7rem 1.2rem;
      background: var(--accent);
      color: white;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: var(--accent-deep); }
    .sheet button, .content > form button { margin-top: 1rem; }
    button.quiet {
      background: transparent;
      color: var(--accent);
      border: 1px solid var(--accent);
    }
    button.quiet:hover { background: rgba(36, 78, 139, 0.08); }
    .error { color: #9f1239; font-weight: 600; }
    .form-error {
      margin: 0 0 1rem;
      padding: 0.75rem 0.9rem;
      border: 1px solid currentColor;
      border-radius: 0.75rem;
      background: rgba(159, 18, 57, 0.08);
    }
    .reading {
      display: grid;
      grid-template-columns: auto minmax(26rem, 36rem);
      justify-content: start;
      align-items: start;
      gap: 1.75rem 2.5rem;
      margin-bottom: 2rem;
    }
    .reading .winner { position: relative; z-index: 1; }
    .meeting-side, .calendars, .calendar { width: 100%; }
    .meeting-side { display: flex; flex-direction: column; align-items: stretch; gap: 0.9rem; }
    .meeting-side .meeting-chosen { margin: 0; max-width: 22rem; }
    .winner .books { display: flex; padding: 0; }
    .winner .book-stack {
      width: min(100%, 11rem);
      padding: 1rem 1.15rem 1.05rem;
      background: rgba(255, 255, 255, 0.94);
      border-radius: 1.25rem;
      box-shadow: 0 16px 36px rgba(28, 63, 114, 0.16);
    }
    .winner .book-stack .cover { width: 100%; }
    .books { list-style: none; margin: 0; padding: 0.6rem 0 1rem; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.4rem 1.5rem; align-items: start; }
    .books li { position: relative; z-index: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-width: 0; max-width: 100%; font-size: 1.05rem; font-weight: 600; line-height: 1.3; }
    .book-float-group { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 100%; min-width: 0; }
    .book-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.55rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      text-align: center;
    }
    .cover-float {
      transform-origin: center top;
      animation: float-book 5.2s ease-in-out infinite alternate;
    }
    .book-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.35rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .book-actions .choose { order: 1; flex: 1 0 100%; display: flex; justify-content: center; min-width: 0; }
    .cover {
      width: min(100%, 8.5rem);
      aspect-ratio: 2 / 3;
      object-fit: cover;
      border-radius: 0.4rem;
      background: var(--surface);
      box-shadow: 0 12px 24px rgba(26, 22, 18, 0.16);
    }
    .books li:nth-child(2n) .cover-float { animation-duration: 6.4s; animation-delay: -1.6s; }
    .books li:nth-child(3n) .cover-float { animation-duration: 4.6s; animation-delay: -2.4s; }
    @keyframes float-book {
      from { transform: translateY(6px) rotate(-1.4deg); }
      to { transform: translateY(-14px) rotate(1.4deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .cover-float { animation: none; }
    }
    @media (hover: none), (pointer: coarse) {
      .cover-float { animation: none; }
    }
    .votes { margin: 0; font-size: 0.92rem; font-weight: 500; color: #4d5d73; }
    .your-vote {
      display: inline-block;
      margin-left: 0.35rem;
      padding: 0.2rem 0.7rem;
      border-radius: 999px;
      background: var(--accent);
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .books button { padding: 0.28rem 0.7rem; font-size: 0.8rem; }
    .books form { display: inline-block; margin: 0.4rem 0.35rem 0 0; }
    .books .book-actions form { margin: 0; max-width: 100%; min-width: 0; }
    .books .book-actions button,
    .books .book-actions .your-vote { max-width: 100%; white-space: normal; line-height: 1.2; }
    .books .book-actions .your-vote { margin-left: 0; }
    .voter-disclosure {
      width: 100%;
      max-width: 14rem;
      margin-top: 0.45rem;
      color: #4d5d73;
      font-size: 0.78rem;
      font-weight: 500;
      text-align: left;
    }
    .voter-disclosure summary {
      width: fit-content;
      margin: 0 auto;
      color: var(--accent);
      cursor: pointer;
      font-weight: 700;
    }
    .voter-disclosure summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    .voter-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-top: 0.5rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid rgba(36, 78, 139, 0.22);
      border-radius: 0.55rem;
      background: rgba(36, 78, 139, 0.07);
      overflow-wrap: anywhere;
    }
    .voter-name::before { content: "•"; margin-right: 0.45rem; color: var(--accent); }
    .success { color: #23603f; font-weight: 700; }
    .feedback-form { width: min(100%, 52rem); }
    .feedback-form form { display: flex; flex-direction: column; gap: 0.75rem; }
    .feedback-form label { font-weight: 700; }
    .feedback-form textarea {
      width: 100%;
      min-height: 16rem;
      resize: vertical;
      padding: 0.8rem;
      border: 1px solid var(--line);
      border-radius: 0.55rem;
      color: var(--ink);
      background: rgba(255, 255, 255, 0.96);
      font: inherit;
      line-height: 1.5;
    }
    .feedback-form textarea:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
    .feedback-form-meta { display: flex; justify-content: space-between; gap: 1rem; }
    .feedback-form-meta p { margin: 0; color: #4d5d73; font-size: 0.85rem; }
    .feedback-form-meta .over-limit { color: #a11b2f; font-weight: 700; }
    .feedback-form button { align-self: flex-start; }
    .feedback-form-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
    .feedback-form-actions > button, .feedback-form-actions > .feedback-cancel {
      min-width: 10rem;
      min-height: 2.65rem;
      margin: 0;
      padding: 0.7rem 1.2rem;
      box-sizing: border-box;
      line-height: normal;
    }
    .feedback-cancel {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--accent);
      border-radius: 999px;
      color: white;
      background: var(--accent);
      font: inherit;
      font-weight: 400;
      text-decoration: none;
    }
    .feedback-list { list-style: none; display: flex; flex-direction: column; gap: 0.65rem; margin: 1rem 0 0; padding: 0; }
    .feedback-list > li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.65rem; align-items: start; }
    .feedback-select { display: flex; align-items: center; margin: 0; padding-top: 0.8rem; }
    .feedback-select input[type="checkbox"] {
      width: 1.15rem;
      height: 1.15rem;
      max-width: none;
      margin: 0;
      padding: 0;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .feedback-delete-button { margin-top: 1rem; }
    .feedback-item { border: 1px solid var(--line); border-radius: 0.55rem; background: rgba(255, 255, 255, 0.82); overflow: hidden; }
    .feedback-summary-line {
      display: grid;
      grid-template-columns: 8.5rem minmax(8rem, 12rem) minmax(0, 1fr);
      gap: 0.8rem;
      align-items: center;
      padding: 0.75rem 0.9rem;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 400;
      transition: background-color 160ms ease, box-shadow 160ms ease;
    }
    .feedback-item.is-unseen > .feedback-summary-line {
      font-weight: 700;
      background: rgba(36, 78, 139, 0.1);
      box-shadow: inset 0.22rem 0 var(--accent);
    }
    .feedback-summary-line time, .feedback-user { font-weight: inherit; }
    .feedback-preview { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .feedback-full { margin: 0; padding: 0.9rem; border-top: 1px solid var(--line); white-space: pre-wrap; overflow-wrap: anywhere; }
    .match-note { color: white; text-shadow: 0 1px 1px rgba(28, 63, 114, 0.25); }
    .match-note a { color: white; }
    .matches { list-style: none; display: flex; flex-wrap: wrap; gap: 1.5rem; margin: 0.4rem 0 0; padding: 0; }
    .matches li {
      width: min(100%, 11rem);
      padding: 1rem 0.85rem 1.05rem;
      background: rgba(255, 255, 255, 0.94);
      border-radius: 1.25rem;
      box-shadow: 0 16px 36px rgba(28, 63, 114, 0.16);
    }
    .matches form { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; margin: 0; text-align: center; }
    .matches .cover { width: 8.5rem; }
    .matches p { margin: 0; color: var(--ink); font-size: 0.92rem; font-weight: 500; }
    .matches button { margin-top: 0.35rem; padding: 0.45rem 0.8rem; font-size: 0.85rem; }
    .meeting-note, .meeting-chosen { color: var(--ink); }
    .calendars { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0; }
    .calendar {
      border-collapse: separate;
      border-spacing: 0.25rem;
      width: 100%;
      max-width: 36rem;
      table-layout: fixed;
      padding: 0.85rem 0.7rem 0.7rem;
      background: rgba(255, 255, 255, 0.94);
      border-radius: 1rem;
      color: var(--ink);
    }
    .calendar caption { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; padding: 0 0.15rem 0.45rem; font-weight: 600; text-align: center; }
    .calendar caption span { flex: 1; white-space: nowrap; }
    .cal-nav { color: var(--accent); text-decoration: none; font-size: 1.2rem; line-height: 1; padding: 0 0.25rem; }
    .calendar th { font-size: 0.72rem; font-weight: 600; color: #4d5d73; }
    .calendar td {
      width: auto;
      height: auto;
      min-height: 3.1rem;
      vertical-align: middle;
      text-align: center;
      border-radius: 0.45rem;
      font-size: 0.85rem;
    }
    .calendar td.proposed { height: auto; padding: 0.12rem; background: transparent; vertical-align: middle; }
    .calendar .cal-hit {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.05rem;
      width: 100%;
      min-height: 3.35rem;
      margin: 0;
      padding: 0.2rem 0.08rem;
      border-radius: 0.45rem;
      background: var(--accent);
      color: white;
      font-size: 0.72rem;
      font-weight: 600;
      line-height: 1.15;
    }
    .calendar button.cal-add {
      min-height: 2.2rem;
      padding: 0.15rem;
      background: transparent;
      color: var(--ink);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .calendar button.cal-add:hover { background: rgba(36, 78, 139, 0.12); }
    .calendar button.cal-add-more { min-height: 0; width: auto; margin-top: 0.15rem; padding: 0 0.4rem; color: var(--accent); font-size: 0.95rem; }
    .calendar button.cal-hit { cursor: pointer; }
    .calendar button.cal-hit:hover { background: var(--accent-deep); }
    .calendar .cal-hit.voted { background: #1a7a45; }
    .calendar button.cal-hit.voted:hover { background: #146338; }
    .cal-day, .cal-time, .cal-count { display: block; }
    .cal-time, .cal-count { font-size: 0.72rem; font-weight: 600; line-height: 1.2; white-space: nowrap; }
    .calendar form { margin: 0; }
    dialog.confirm {
      border: 0;
      border-radius: 1.25rem;
      padding: 1.4rem 1.5rem 1.5rem;
      max-width: 28rem;
      color: var(--ink);
      box-shadow: 0 24px 60px rgba(28, 63, 114, 0.28);
    }
    dialog.confirm::backdrop { background: rgba(28, 36, 48, 0.45); }
    dialog.confirm p { margin: 0 0 1.1rem; line-height: 1.45; }
    .confirm-actions { display: flex; gap: 0.6rem; align-items: center; }
    dialog.confirm form, dialog.confirm button { margin: 0; }
    dialog.confirm button {
      display: inline-block;
      width: auto;
      text-align: center;
      letter-spacing: 0;
      text-transform: none;
      font-size: 0.95rem;
      color: white;
      background: var(--accent);
      border: 0;
    }
    dialog.confirm button.quiet {
      color: var(--accent);
      background: transparent;
      border: 1px solid var(--accent);
    }
    dialog.confirm label { margin-top: 0; }
    dialog.confirm .confirm-actions { margin-top: 1rem; }
    .dial-picker { display: flex; flex-direction: column; align-items: center; }
    .dial-readout { display: flex; align-items: stretch; justify-content: center; gap: 0.3rem; }
    dialog.confirm button.dial-value {
      min-width: 4rem;
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--line);
      border-radius: 0.55rem;
      color: var(--ink);
      background: rgba(36, 78, 139, 0.08);
      font-size: 1.9rem;
      font-variant-numeric: tabular-nums;
    }
    dialog.confirm button.dial-value.active { color: #ffffff; border-color: var(--accent); background: var(--accent); }
    .dial-colon { align-self: center; font-size: 1.9rem; font-weight: 600; }
    .dial-periods { display: flex; flex-direction: column; gap: 0.2rem; margin-left: 0.25rem; }
    dialog.confirm button.dial-period {
      flex: 1;
      min-width: 2.9rem;
      padding: 0.2rem 0.4rem;
      border: 1px solid var(--line);
      border-radius: 0.35rem;
      color: var(--ink);
      background: transparent;
      font-size: 0.72rem;
    }
    dialog.confirm button.dial-period.active { color: #ffffff; border-color: var(--accent); background: var(--accent); }
    dialog.confirm .dial-instruction { margin: 0.7rem 0 0.4rem; color: #4d5d73; font-size: 0.78rem; font-weight: 600; }
    .clock-face {
      --dial-angle: 120deg;
      position: relative;
      width: 15.5rem;
      max-width: 76vw;
      aspect-ratio: 1;
      border: 1px solid rgba(36, 78, 139, 0.16);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(36, 78, 139, 0.05) 0 52%, rgba(36, 78, 139, 0.1) 53% 100%);
    }
    .dial-options { position: absolute; inset: 0; }
    .dial-options[hidden] { display: none; }
    .clock-hand {
      position: absolute;
      z-index: 1;
      bottom: 50%;
      left: calc(50% - 1px);
      width: 2px;
      height: 5.75rem;
      background: var(--accent);
      transform: rotate(var(--dial-angle));
      transform-origin: 50% 100%;
      transition: transform 160ms ease;
    }
    .clock-hand::before { content: ""; position: absolute; top: -0.25rem; left: -0.2rem; width: 0.45rem; height: 0.45rem; border-radius: 50%; background: var(--accent); }
    .clock-center { position: absolute; z-index: 3; top: calc(50% - 0.22rem); left: calc(50% - 0.22rem); width: 0.44rem; height: 0.44rem; border-radius: 50%; background: var(--accent); }
    dialog.confirm button.clock-option {
      position: absolute;
      z-index: 2;
      top: 50%;
      left: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.35rem;
      height: 2.35rem;
      padding: 0;
      border: 1px solid transparent;
      border-radius: 50%;
      color: var(--ink);
      background: #ffffff;
      font-size: 0.78rem;
      font-weight: 600;
      transform: translate(-50%, -50%) rotate(calc(var(--index) * 30deg)) translateY(-5.75rem) rotate(calc(var(--index) * -30deg));
    }
    dialog.confirm button.clock-option:hover { border-color: rgba(36, 78, 139, 0.45); background: #e7ecf5; }
    dialog.confirm button.clock-option.active { color: #ffffff; border-color: var(--accent); background: var(--accent); }
    .meetings { list-style: none; margin: 0.4rem 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .meetings li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.45rem 0.7rem;
      max-width: 42rem;
      padding: 0.85rem 1rem;
      background: rgba(255, 255, 255, 0.94);
      border-radius: 1rem;
      color: var(--ink);
    }
    .meeting-when { font-weight: 600; }
    .meeting-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; }
    .meeting-actions form { margin: 0; }
    .meetings button { padding: 0.28rem 0.7rem; font-size: 0.8rem; }
    .meeting-finalize {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.7rem 1rem;
      max-width: 46rem;
      margin: 1rem 0 0;
      padding: 0.8rem 1rem;
      border-left: 3px solid var(--accent);
      background: rgba(36, 78, 139, 0.08);
    }
    .meeting-finalize p { flex: 1 1 26rem; margin: 0; line-height: 1.45; }
    .meeting-finalize form { margin: 0; }
    @media (max-width: 1050px) {
      .reading { grid-template-columns: minmax(0, 36rem); }
      .books { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 700px) {
      .layout { grid-template-columns: 1fr; }
      aside {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 0.15rem 0.75rem;
        width: 100%;
        min-width: 0;
        padding: 0.75rem 1.2rem 0;
        background: transparent;
      }
      .mark { grid-column: 1; grid-row: 1 / span 2; margin: 0; white-space: nowrap; }
      .signed-in-name { grid-column: 2; margin: 0; font-size: 1rem; }
      .member-role { grid-column: 2; margin: 0; font-size: 0.65rem; }
      nav {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
        padding-top: 0.35rem;
      }
      nav > form { width: auto; max-width: 100%; margin: 0; }
      nav a, nav button,
      nav > form button,
      nav button.start-over-open {
        width: auto;
        min-height: 44px;
        margin: 0;
        padding: 0.55rem 0.8rem;
        text-align: center;
      }
      main, .banner, .content, .reading, .meeting-side, .calendars { min-width: 0; max-width: 100%; }
      .banner { padding: 2.25rem 1.2rem 0.85rem; }
      .content { padding: 1rem 1.2rem 2.5rem; }
      .banner h1 { font-size: 2rem; }
      .reading { grid-template-columns: 1fr; }
      .winner .books { justify-content: center; }
      .sheet, form, input, button, .matches, .meetings { max-width: 100%; }
      .sheet { width: 100%; }
      input { width: 100%; max-width: 100%; }
      button { min-height: 44px; }
      .books { gap: 2rem 1rem; }
      .books button, .matches button, .meetings button { min-height: 44px; padding: 0.55rem 0.8rem; }
      .book-title, .meeting-when, p { overflow-wrap: anywhere; }
      .calendar {
        max-width: 100%;
        border-spacing: 0.16rem;
        padding: 0.65rem 0.4rem 0.5rem;
      }
      .calendar caption { padding-bottom: 0.35rem; }
      .calendar th { font-size: 0.66rem; }
      .calendar td { min-width: 0; font-size: 0.78rem; }
      .calendar .cal-hit { min-height: 44px; padding: 0.2rem 0.04rem; }
      .calendar button.cal-add { min-height: 44px; }
      .calendar button.cal-add-more { min-height: 2rem; }
      .cal-time, .cal-count { font-size: 0.65rem; white-space: normal; overflow-wrap: normal; }
      dialog, dialog.confirm {
        width: auto;
        max-width: calc(100vw - 2rem);
        margin-left: auto;
        margin-right: auto;
        padding: 1.1rem;
      }
      .confirm-actions { flex-wrap: wrap; }
    }
    @media (max-width: 480px) {
      .books { grid-template-columns: 1fr; }
      .cover { width: min(100%, 9rem); }
    }
    @media (max-width: 380px) {
      aside { padding-left: 0.8rem; padding-right: 0.8rem; }
      .banner { padding: 1.8rem 0.8rem 0.7rem; }
      .content { padding: 0.85rem 0.8rem 2rem; }
      .banner h1 { font-size: 1.75rem; }
      .calendar { border-spacing: 0.08rem; padding-left: 0.22rem; padding-right: 0.22rem; }
      .calendar th { font-size: 0.6rem; }
      .calendar .cal-hit { font-size: 0.65rem; }
      .feedback-summary-line { grid-template-columns: 6.5rem 7rem minmax(0, 1fr); gap: 0.45rem; padding: 0.65rem; font-size: 0.75rem; }
      .feedback-form-meta { flex-direction: column; gap: 0.2rem; }
    }

    /* Default sci-fi treatment; ?variant=classic selects the original design. */
    html[data-variant="scifi"] {
      color-scheme: dark;
      --hud-bg: #020708;
      --hud-panel: #061012;
      --hud-panel-deep: #030a0c;
      --hud-teal: #57ded3;
      --hud-blue: #53a7ff;
      --hud-text: #d9f7f4;
      --hud-muted: #7fa5a4;
      --hud-line: rgba(87, 222, 211, 0.42);
      background: var(--hud-bg);
    }
    html[data-variant="scifi"] body {
      color: var(--hud-text);
      cursor: url("/assets/target-cursor.svg") 16 16, crosshair;
      background:
        radial-gradient(circle at 84% 10%, rgba(83, 167, 255, 0.11), transparent 30rem),
        radial-gradient(circle at 20% 74%, rgba(87, 222, 211, 0.08), transparent 34rem),
        var(--hud-bg);
    }
    html[data-variant="scifi"] body::after {
      content: "";
      position: fixed;
      inset: 0;
      z-index: 50;
      pointer-events: none;
      opacity: 0.12;
      background: repeating-linear-gradient(
        180deg,
        transparent 0,
        transparent 3px,
        rgba(87, 222, 211, 0.14) 4px
      );
      mix-blend-mode: screen;
    }
    html[data-variant="scifi"] .layout {
      position: relative;
      isolation: isolate;
      grid-template-columns: 13rem minmax(0, 1fr);
      background: linear-gradient(135deg, #041012, #020708 62%);
    }
    html[data-variant="scifi"] .layout > main {
      position: relative;
      z-index: 1;
    }
    html[data-variant="scifi"] .layout::after {
      content: "";
      position: fixed;
      z-index: 0;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(rgba(87, 222, 211, 0.025) 1px, transparent 1px) 0 0 / 2rem 2rem,
        linear-gradient(90deg, rgba(87, 222, 211, 0.025) 1px, transparent 1px) 0 0 / 2rem 2rem,
        linear-gradient(rgba(2, 9, 11, 0.5), rgba(2, 7, 8, 0.68)),
        url("/assets/starfield.jpg") center center / cover no-repeat;
      filter: saturate(0.72) contrast(1.06) brightness(0.76);
    }
    html[data-variant="scifi"] .layout::before {
      content: "";
      position: fixed;
      z-index: -1;
      left: 13rem;
      right: 0;
      bottom: -9rem;
      height: 28rem;
      opacity: 0.2;
      transform: perspective(28rem) rotateX(58deg);
      transform-origin: bottom;
      background-image:
        linear-gradient(rgba(87, 222, 211, 0.4) 1px, transparent 1px),
        linear-gradient(90deg, rgba(87, 222, 211, 0.4) 1px, transparent 1px);
      background-size: 3rem 3rem;
      mask-image: linear-gradient(to top, black, transparent 88%);
    }
    html[data-variant="scifi"] aside {
      position: relative;
      z-index: 2;
      padding: 2rem 1.15rem;
      background: rgba(2, 9, 11, 0.92);
      box-shadow: 12px 0 42px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(16px);
    }
    html[data-variant="scifi"] aside::before {
      content: "";
      position: absolute;
      top: 0;
      right: -1px;
      bottom: 0;
      width: 10px;
      pointer-events: none;
      background: var(--hud-line);
      clip-path: polygon(
        9px 0, 10px 0, 10px 34%, 3px calc(34% + 7px), 3px calc(66% - 7px),
        10px 66%, 10px 100%, 9px 100%, 9px calc(66% + 1px), 2px calc(66% - 6px),
        2px calc(34% + 6px), 9px calc(34% - 1px)
      );
      filter: drop-shadow(0 0 4px rgba(87, 222, 211, 0.18));
    }
    html[data-variant="scifi"] aside::after {
      content: "NAV // 01";
      position: absolute;
      left: 1.15rem;
      bottom: 1.2rem;
      color: rgba(87, 222, 211, 0.48);
      font: 500 0.58rem/1 "Orbitron", sans-serif;
      letter-spacing: 0.22em;
    }
    html[data-variant="scifi"] .mark,
    html[data-variant="scifi"] main h2 {
      font-family: "Orbitron", "Segoe UI", sans-serif;
      text-transform: uppercase;
    }
    html[data-variant="scifi"] .mark {
      margin-bottom: 2.5rem;
      color: #9bf4ec;
      font-size: 0.78rem;
      line-height: 1.55;
      letter-spacing: 0.12em;
      text-shadow: 0 0 16px rgba(87, 222, 211, 0.48);
    }
    html[data-variant="scifi"] .sun {
      width: 0.8rem;
      height: 0.8rem;
      margin-right: 0.6rem;
      border: 1px solid var(--hud-text);
      border-radius: 0;
      background: var(--hud-teal);
      box-shadow: 0 0 6px var(--hud-teal), 0 0 18px var(--hud-teal);
      transform: rotate(45deg);
    }
    html[data-variant="scifi"] .signed-in-name { color: #ffffff; }
    html[data-variant="scifi"] .member-role { color: #8fc6ff; }
    html[data-variant="scifi"] nav {
      gap: 0.65rem;
      filter:
        drop-shadow(0 0 7px rgba(87, 222, 211, 0.58))
        drop-shadow(0 0 18px rgba(83, 167, 255, 0.3));
      transition: filter 150ms ease;
    }
    html[data-variant="scifi"] nav:hover {
      filter:
        drop-shadow(0 0 9px rgba(87, 222, 211, 0.72))
        drop-shadow(0 0 24px rgba(83, 167, 255, 0.42));
    }
    html[data-variant="scifi"] a,
    html[data-variant="scifi"] button,
    html[data-variant="scifi"] summary,
    html[data-variant="scifi"] label[for] {
      cursor: url("/assets/target-cursor.svg") 16 16, crosshair;
    }
    html[data-variant="scifi"] .form-help { color: #8faeb2; }
    html[data-variant="scifi"] .form-error {
      color: #ff9bac;
      border-color: rgba(255, 100, 128, 0.82);
      border-radius: 0;
      background: rgba(95, 8, 31, 0.58);
      box-shadow: 0 0 16px rgba(255, 75, 109, 0.2);
      clip-path: polygon(0 0, calc(100% - 0.7rem) 0, 100% 0.7rem, 100% 100%, 0.7rem 100%, 0 calc(100% - 0.7rem));
    }
    html[data-variant="scifi"] input { cursor: text; }
    html[data-variant="scifi"] nav a,
    html[data-variant="scifi"] nav button {
      border: 1px solid rgba(87, 222, 211, 0.24);
      border-radius: 0;
      clip-path: polygon(0 0, calc(100% - 0.7rem) 0, 100% 0.7rem, 100% 100%, 0.7rem 100%, 0 calc(100% - 0.7rem));
      color: #bff9f4;
      background: rgba(4, 17, 20, 0.72);
      letter-spacing: 0.12em;
      filter:
        drop-shadow(0 0 5px rgba(87, 222, 211, 0.4))
        drop-shadow(0 0 12px rgba(83, 167, 255, 0.18));
      transition: color 150ms ease, background 150ms ease, filter 150ms ease;
    }
    html[data-variant="scifi"] nav a[aria-current="page"],
    html[data-variant="scifi"] nav a:hover,
    html[data-variant="scifi"] nav button:hover {
      color: #021012;
      background: var(--hud-teal);
      box-shadow: 0 0 20px rgba(87, 222, 211, 0.4);
      filter:
        drop-shadow(0 0 7px rgba(87, 222, 211, 0.66))
        drop-shadow(0 0 18px rgba(83, 167, 255, 0.34));
    }
    html[data-variant="scifi"] nav > form button {
      color: #021012;
      background: var(--hud-teal);
    }
    html[data-variant="scifi"] .banner {
      min-height: 12.5rem;
      margin: 1rem 1.25rem 0;
      padding: 4.8rem 3.5rem 2.2rem;
      border: 1px solid var(--hud-line);
      clip-path: polygon(
        0 1.1rem, 1.1rem 0, 18% 0, calc(18% + 0.7rem) 0.7rem,
        32% 0.7rem, calc(32% + 0.7rem) 0, calc(100% - 1rem) 0, 100% 1rem,
        100% 72%, calc(100% - 0.55rem) calc(72% + 0.55rem),
        calc(100% - 0.55rem) calc(88% - 0.55rem), 100% 88%,
        100% 100%, 68% 100%, calc(68% - 0.55rem) calc(100% - 0.55rem),
        46% calc(100% - 0.55rem), calc(46% - 0.55rem) 100%, 0 100%
      );
      background:
        linear-gradient(90deg, var(--hud-teal), transparent) 3rem 1.1rem / 8rem 1px no-repeat,
        linear-gradient(90deg, var(--hud-blue), transparent) right 2rem top 0.35rem / 9rem 1px no-repeat,
        linear-gradient(90deg, rgba(87, 222, 211, 0.08), transparent 44%),
        linear-gradient(180deg, rgba(83, 167, 255, 0.07), transparent),
        rgba(2, 9, 11, 0.58);
      box-shadow: inset 0 0 32px rgba(87, 222, 211, 0.025), 0 0 18px rgba(83, 167, 255, 0.06);
    }
    html[data-variant="scifi"] .banner::before {
      content: "ARCHIVE NODE  //  OHSU-07  //  ONLINE";
      position: absolute;
      top: 2.2rem;
      left: 3.5rem;
      color: var(--hud-teal);
      font: 600 0.62rem/1 "Orbitron", sans-serif;
      letter-spacing: 0.22em;
    }
    html[data-variant="scifi"] .banner::after {
      width: 23rem;
      height: 23rem;
      right: -5rem;
      top: -10rem;
      border: 1px solid rgba(87, 222, 211, 0.26);
      background:
        radial-gradient(circle, transparent 52%, rgba(83, 167, 255, 0.11) 53% 54%, transparent 55%),
        repeating-radial-gradient(circle, transparent 0 1.6rem, rgba(87, 222, 211, 0.09) 1.65rem 1.7rem);
      box-shadow: 0 0 52px rgba(83, 167, 255, 0.1), inset 0 0 42px rgba(87, 222, 211, 0.05);
    }
    html[data-variant="scifi"] .banner h1 {
      max-width: 50rem;
      color: #ffffff;
      font-family: "Orbitron", "Segoe UI", sans-serif;
      font-size: clamp(2rem, 5vw, 4rem);
      letter-spacing: 0.04em;
      text-shadow: -2px 0 var(--hud-blue), 2px 0 var(--hud-teal), 0 0 28px rgba(87, 222, 211, 0.22);
    }
    html[data-variant="scifi"] .content {
      position: relative;
      margin: 0 1.25rem 1.25rem;
      padding: 2.5rem 3.5rem 4rem;
      background:
        linear-gradient(rgba(87, 222, 211, 0.28), rgba(87, 222, 211, 0.28)) left top / 1px 31% no-repeat,
        linear-gradient(135deg, transparent 45%, var(--hud-line) 47% 53%, transparent 55%) left 31% / 9px 9px no-repeat,
        linear-gradient(rgba(87, 222, 211, 0.28), rgba(87, 222, 211, 0.28)) left bottom / 1px calc(69% - 9px) no-repeat,
        linear-gradient(rgba(87, 222, 211, 0.28), rgba(87, 222, 211, 0.28)) right top / 1px 58% no-repeat,
        linear-gradient(45deg, transparent 45%, var(--hud-line) 47% 53%, transparent 55%) right 58% / 9px 9px no-repeat,
        linear-gradient(rgba(87, 222, 211, 0.28), rgba(87, 222, 211, 0.28)) right bottom / 1px calc(42% - 9px) no-repeat,
        linear-gradient(90deg, var(--hud-teal), transparent) left bottom / 8rem 1px no-repeat,
        linear-gradient(270deg, var(--hud-blue), transparent) right bottom / 8rem 1px no-repeat,
        rgba(2, 8, 10, 0.34);
      box-shadow: inset 0 -18px 42px rgba(83, 167, 255, 0.025);
    }
    html[data-variant="scifi"] .content::before {
      content: "";
      position: absolute;
      top: -1px;
      left: 0;
      right: 0;
      height: 10px;
      pointer-events: none;
      background: var(--hud-line);
      clip-path: polygon(
        0 0, 38% 0, calc(38% + 8px) 8px, calc(54% - 8px) 8px, 54% 0,
        100% 0, 100% 1px, calc(54% + 1px) 1px, calc(54% - 7px) 9px,
        calc(38% + 7px) 9px, calc(38% - 1px) 1px, 0 1px
      );
    }
    html[data-variant="scifi"] main h2 {
      color: #9bf4ec;
      font-size: 0.82rem;
      letter-spacing: 0.2em;
      text-shadow: 0 0 14px rgba(87, 222, 211, 0.4);
    }
    html[data-variant="scifi"] main h2::before { content: "[ "; color: var(--hud-blue); }
    html[data-variant="scifi"] main h2::after { content: " ]"; color: var(--hud-blue); }
    html[data-variant="scifi"] main a { color: var(--hud-teal); }
    html[data-variant="scifi"] .sheet,
    html[data-variant="scifi"] .matches li,
    html[data-variant="scifi"] .calendar,
    html[data-variant="scifi"] .meetings li {
      color: var(--hud-text);
      border: 1px solid rgba(87, 222, 211, 0.34);
      border-radius: 0.25rem;
      background:
        linear-gradient(90deg, var(--hud-teal), transparent) left top / 4.75rem 1px no-repeat,
        linear-gradient(180deg, var(--hud-teal), transparent) left top / 1px 4.75rem no-repeat,
        linear-gradient(270deg, var(--hud-blue), transparent) right bottom / 4.75rem 1px no-repeat,
        linear-gradient(0deg, var(--hud-blue), transparent) right bottom / 1px 4.75rem no-repeat,
        linear-gradient(145deg, rgba(6, 18, 21, 0.94), rgba(2, 9, 11, 0.97));
      box-shadow: 0 0 0 1px rgba(83, 167, 255, 0.05), 0 18px 48px rgba(0, 0, 0, 0.4), inset 0 0 28px rgba(87, 222, 211, 0.025);
      clip-path: polygon(
        0 0, calc(100% - 1.2rem) 0, 100% 1.2rem,
        100% 38%, calc(100% - 0.45rem) calc(38% + 0.45rem),
        calc(100% - 0.45rem) calc(62% - 0.45rem), 100% 62%,
        100% 100%, 1.2rem 100%, 0 calc(100% - 1.2rem),
        0 68%, 0.45rem calc(68% - 0.45rem),
        0.45rem calc(46% + 0.45rem), 0 46%
      );
    }
    html[data-variant="scifi"] .books { gap: 2rem 1.25rem; }
    html[data-variant="scifi"] .book-stack,
    html[data-variant="scifi"] .winner .book-stack {
      position: relative;
      width: min(100%, 14rem);
      height: 27rem;
      min-height: 27rem;
      padding: 1.5rem 1.65rem 2rem;
      gap: 0.7rem;
      color: var(--hud-text);
      background: url("/assets/book-card.svg?v=3") center center / 100% 100% no-repeat;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      filter:
        drop-shadow(0 16px 24px rgba(0, 0, 0, 0.5))
        drop-shadow(0 0 12px rgba(87, 222, 211, 0.2));
    }
    html[data-variant="scifi"] .book-stack:not(:has(.cover)) {
      height: auto;
      min-height: 17rem;
      justify-content: center;
      padding-top: 4.2rem;
    }
    html[data-variant="scifi"] .book-stack > .votes {
      position: relative;
      z-index: 2;
      align-self: flex-start;
      flex: 0 0 auto;
      max-width: 7.5rem;
      margin: 0 0 0.65rem 0.25rem;
      padding: 0.22rem 0.7rem;
      overflow: hidden;
      color: #021012;
      border: 1px solid rgba(167, 255, 248, 0.88);
      background: linear-gradient(90deg, rgba(125, 255, 243, 0.96), rgba(43, 145, 182, 0.92));
      box-shadow: 0 0 10px rgba(87, 222, 211, 0.36), inset 0 0 8px rgba(255, 255, 255, 0.16);
      clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 50%, calc(100% - 0.55rem) 100%, 0 100%, 0.35rem 50%);
      font-family: "Orbitron", sans-serif;
      font-size: 0.66rem;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: 0.08em;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }
    html[data-variant="scifi"] .book-stack .book-title { color: #d9f7f4; }
    html[data-variant="scifi"] .book-stack .cover,
    html[data-variant="scifi"] .book-stack .book-actions { flex: 0 0 auto; }
    html[data-variant="scifi"] .book-stack .book-actions {
      margin-top: auto;
      padding: 0.25rem 0.2rem 0.35rem;
      border-top: 1px solid rgba(87, 222, 211, 0.22);
    }
    html[data-variant="scifi"] .book-stack .your-vote {
      border: 1px solid rgba(87, 222, 211, 0.52);
      background: linear-gradient(90deg, rgba(35, 108, 114, 0.95), rgba(20, 69, 83, 0.95));
      box-shadow: 0 0 12px rgba(87, 222, 211, 0.24);
      font-family: "Orbitron", sans-serif;
      font-size: 0.66rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure {
      position: relative;
      z-index: 3;
      width: min(calc(100% - 2.8rem), 11rem);
      max-width: 11rem;
      margin-top: -2.6rem;
      padding: 0;
      color: var(--hud-muted);
      text-align: center;
    }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure summary {
      display: block;
      width: 100%;
      padding: 0.38rem 0.7rem;
      border: 1px solid rgba(87, 222, 211, 0.62);
      color: var(--hud-teal);
      background:
        linear-gradient(90deg, rgba(87, 222, 211, 0.17), rgba(3, 19, 25, 0.96) 32%, rgba(3, 19, 25, 0.96) 68%, rgba(87, 222, 211, 0.17));
      box-shadow: 0 0 12px rgba(87, 222, 211, 0.2), inset 0 0 12px rgba(87, 222, 211, 0.06);
      clip-path: polygon(0.65rem 0, calc(100% - 0.65rem) 0, 100% 50%, calc(100% - 0.65rem) 100%, 0.65rem 100%, 0 50%);
      list-style: none;
      font-family: "Orbitron", sans-serif;
      font-size: 0.62rem;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      text-shadow: 0 0 8px rgba(87, 222, 211, 0.45);
    }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure summary::-webkit-details-marker { display: none; }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure summary::before {
      content: "▸";
      display: inline-block;
      margin-right: 0.45rem;
      color: #ff5b8d;
    }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure[open] summary::before { content: "▾"; }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure summary:focus-visible { outline-color: var(--hud-teal); }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure .voter-list {
      margin-top: 0.35rem;
      border-color: rgba(87, 222, 211, 0.38);
      border-radius: 0;
      color: var(--hud-text);
      background:
        linear-gradient(90deg, rgba(87, 222, 211, 0.1), transparent 62%),
        rgba(2, 10, 12, 0.82);
      box-shadow: inset 0 0 14px rgba(87, 222, 211, 0.05), 0 0 10px rgba(87, 222, 211, 0.08);
    }
    html[data-variant="scifi"] .book-float-group > .voter-disclosure .voter-name::before { color: var(--hud-teal); }
    html[data-variant="scifi"] .success { color: #9bf4ec; text-shadow: 0 0 10px rgba(87, 222, 211, 0.35); }
    html[data-variant="scifi"] .feedback-form textarea {
      color: var(--hud-text);
      border-color: rgba(87, 222, 211, 0.42);
      border-radius: 0;
      background: rgba(2, 10, 12, 0.9);
      box-shadow: inset 0 0 18px rgba(87, 222, 211, 0.05);
    }
    html[data-variant="scifi"] .feedback-form textarea:focus { outline-color: var(--hud-teal); }
    html[data-variant="scifi"] .feedback-form-meta p { color: var(--hud-muted); }
    html[data-variant="scifi"] .feedback-form-meta .over-limit { color: #ff7c9e; }
    html[data-variant="scifi"] .feedback-cancel {
      border-color: var(--hud-teal);
      border-radius: 0;
      clip-path: polygon(0.65rem 0, 100% 0, 100% calc(100% - 0.65rem), calc(100% - 0.65rem) 100%, 0 100%, 0 0.65rem);
      color: #021012;
      background: var(--hud-teal);
      font-family: "Orbitron", sans-serif;
      font-size: 0.72rem;
      font-weight: 400;
      letter-spacing: 0.06em;
      box-shadow: 0 0 16px rgba(87, 222, 211, 0.18);
      filter:
        drop-shadow(0 0 5px rgba(87, 222, 211, 0.44))
        drop-shadow(0 0 13px rgba(83, 167, 255, 0.2));
      transition: color 150ms ease, background 150ms ease, border-color 150ms ease, filter 150ms ease;
    }
    html[data-variant="scifi"] .feedback-cancel:hover {
      color: #ffffff;
      border-color: #9bceff;
      background: var(--hud-blue);
      filter:
        drop-shadow(0 0 8px rgba(83, 167, 255, 0.68))
        drop-shadow(0 0 20px rgba(87, 222, 211, 0.32));
    }
    html[data-variant="scifi"] .feedback-select input[type="checkbox"] {
      accent-color: var(--hud-teal);
      cursor: url("/assets/target-cursor.svg") 16 16, crosshair;
    }
    html[data-variant="scifi"] .feedback-item {
      border-color: rgba(87, 222, 211, 0.34);
      border-radius: 0;
      color: var(--hud-text);
      background: rgba(3, 17, 20, 0.82);
      box-shadow: inset 0 0 16px rgba(87, 222, 211, 0.04);
    }
    html[data-variant="scifi"] .feedback-summary-line { color: var(--hud-text); }
    html[data-variant="scifi"] .feedback-item.is-unseen > .feedback-summary-line {
      background: rgba(87, 222, 211, 0.11);
      box-shadow: inset 0.22rem 0 var(--hud-teal), inset 0 0 20px rgba(87, 222, 211, 0.04);
    }
    html[data-variant="scifi"] .feedback-summary-line:hover { background: rgba(87, 222, 211, 0.08); }
    html[data-variant="scifi"] .feedback-summary-line time { color: var(--hud-teal); }
    html[data-variant="scifi"] .feedback-user { color: #8fc6ff; }
    html[data-variant="scifi"] .feedback-preview { color: var(--hud-muted); }
    html[data-variant="scifi"] .feedback-full { border-top-color: rgba(87, 222, 211, 0.24); background: rgba(2, 10, 12, 0.75); }
    html[data-variant="scifi"] input {
      color: #ffffff;
      border: 1px solid rgba(87, 222, 211, 0.4);
      border-radius: 0;
      background: rgba(2, 10, 12, 0.88);
      box-shadow: inset 0 0 16px rgba(87, 222, 211, 0.04);
    }
    html[data-variant="scifi"] input:focus {
      outline: 1px solid var(--hud-teal);
      box-shadow: 0 0 18px rgba(87, 222, 211, 0.24), inset 0 0 16px rgba(87, 222, 211, 0.07);
    }
    html[data-variant="scifi"] dialog.confirm button.dial-value,
    html[data-variant="scifi"] dialog.confirm button.dial-period,
    html[data-variant="scifi"] dialog.confirm button.clock-option {
      clip-path: none;
      filter: none;
      font-family: "Orbitron", sans-serif;
      letter-spacing: 0.04em;
      box-shadow: none;
    }
    html[data-variant="scifi"] dialog.confirm button.dial-value,
    html[data-variant="scifi"] dialog.confirm button.dial-period {
      color: var(--hud-text);
      border-color: rgba(87, 222, 211, 0.38);
      border-radius: 0;
      background: rgba(3, 17, 20, 0.92);
    }
    html[data-variant="scifi"] dialog.confirm button.dial-value.active,
    html[data-variant="scifi"] dialog.confirm button.dial-period.active,
    html[data-variant="scifi"] dialog.confirm button.clock-option.active {
      color: #021012;
      border-color: var(--hud-teal);
      background: var(--hud-teal);
      box-shadow: 0 0 14px rgba(87, 222, 211, 0.4);
    }
    html[data-variant="scifi"] dialog.confirm .dial-instruction { color: var(--hud-muted); }
    html[data-variant="scifi"] .clock-face {
      border-color: rgba(87, 222, 211, 0.42);
      background:
        radial-gradient(circle, transparent 0 10%, rgba(87, 222, 211, 0.035) 11% 52%, rgba(3, 17, 20, 0.94) 53% 100%),
        repeating-radial-gradient(circle, transparent 0 1.45rem, rgba(87, 222, 211, 0.045) 1.5rem 1.53rem);
      box-shadow: inset 0 0 28px rgba(87, 222, 211, 0.08), 0 0 20px rgba(83, 167, 255, 0.1);
    }
    html[data-variant="scifi"] .clock-hand,
    html[data-variant="scifi"] .clock-hand::before,
    html[data-variant="scifi"] .clock-center { background: var(--hud-teal); box-shadow: 0 0 8px rgba(87, 222, 211, 0.7); }
    html[data-variant="scifi"] dialog.confirm button.clock-option {
      color: var(--hud-text);
      background: #061416;
      border-color: rgba(87, 222, 211, 0.16);
    }
    html[data-variant="scifi"] dialog.confirm button.clock-option:hover { color: #ffffff; border-color: var(--hud-blue); background: #102c38; }
    html[data-variant="scifi"] button {
      border: 1px solid var(--hud-teal);
      border-radius: 0;
      clip-path: polygon(0.65rem 0, 100% 0, 100% calc(100% - 0.65rem), calc(100% - 0.65rem) 100%, 0 100%, 0 0.65rem);
      color: #021012;
      background: var(--hud-teal);
      font-family: "Orbitron", sans-serif;
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      box-shadow: 0 0 16px rgba(87, 222, 211, 0.18);
      filter:
        drop-shadow(0 0 5px rgba(87, 222, 211, 0.44))
        drop-shadow(0 0 13px rgba(83, 167, 255, 0.2));
      transition: color 150ms ease, background 150ms ease, border-color 150ms ease, filter 150ms ease;
    }
    html[data-variant="scifi"] button:hover {
      color: #ffffff;
      background: var(--hud-blue);
      border-color: #9bceff;
      box-shadow: 0 0 24px rgba(83, 167, 255, 0.38);
      filter:
        drop-shadow(0 0 8px rgba(83, 167, 255, 0.68))
        drop-shadow(0 0 20px rgba(87, 222, 211, 0.32));
    }
    html[data-variant="scifi"] button.quiet {
      color: #8fc6ff;
      border-color: var(--hud-blue);
      background: rgba(83, 167, 255, 0.08);
    }
    html[data-variant="scifi"] .cover {
      border: 1px solid rgba(87, 222, 211, 0.5);
      border-radius: 0.15rem;
      box-shadow: 0 0 0 4px rgba(87, 222, 211, 0.035), 0 16px 30px rgba(0, 0, 0, 0.55), 0 0 22px rgba(83, 167, 255, 0.12);
    }
    html[data-variant="scifi"] .votes,
    html[data-variant="scifi"] .meeting-note,
    html[data-variant="scifi"] .meeting-chosen,
    html[data-variant="scifi"] .matches p { color: var(--hud-muted); }
    html[data-variant="scifi"] .meeting-finalize {
      border-left-color: var(--hud-teal);
      background: linear-gradient(90deg, rgba(87, 222, 211, 0.1), rgba(3, 17, 20, 0.72));
      box-shadow: inset 0 0 18px rgba(87, 222, 211, 0.04);
    }
    html[data-variant="scifi"] .meeting-finalize p { color: var(--hud-muted); }
    html[data-variant="scifi"] .meeting-finalize strong { color: var(--hud-text); }
    html[data-variant="scifi"] .your-vote,
    html[data-variant="scifi"] .calendar .cal-hit { background: #236c72; }
    html[data-variant="scifi"] .calendar th { color: var(--hud-teal); }
    html[data-variant="scifi"] .calendar button.cal-add,
    html[data-variant="scifi"] .calendar button.cal-hit {
      clip-path: none;
      box-shadow: none;
      filter: none;
      font-family: "Instrument Sans", "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    html[data-variant="scifi"] .calendar button.cal-add {
      color: var(--hud-text);
      border-color: transparent;
      background: transparent;
    }
    html[data-variant="scifi"] .calendar button.cal-add:hover {
      color: #ffffff;
      border-color: rgba(87, 222, 211, 0.45);
      background: rgba(87, 222, 211, 0.12);
      box-shadow: inset 0 0 12px rgba(87, 222, 211, 0.08);
    }
    html[data-variant="scifi"] .calendar button.cal-add-more { color: var(--hud-teal); }
    html[data-variant="scifi"] .calendar button.cal-hit {
      color: #ffffff;
      border-color: rgba(87, 222, 211, 0.35);
    }
    html[data-variant="scifi"] dialog.confirm {
      color: var(--hud-text);
      border: 1px solid var(--hud-teal);
      border-radius: 0;
      background: #041012;
      box-shadow: 0 0 48px rgba(87, 222, 211, 0.2);
    }
    html[data-variant="scifi"] dialog.confirm::backdrop { background: rgba(0, 3, 12, 0.78); }
    @media (max-width: 700px) {
      html[data-variant="scifi"] .layout { grid-template-columns: 1fr; }
      html[data-variant="scifi"] .layout::before { left: 0; }
      html[data-variant="scifi"] aside {
        padding: 0.9rem 1rem 0;
        border-right: 0;
      }
      html[data-variant="scifi"] aside::before {
        top: auto;
        right: 0;
        bottom: -1px;
        left: 0;
        width: auto;
        height: 9px;
        clip-path: polygon(
          0 0, 36% 0, calc(36% + 7px) 7px, calc(62% - 7px) 7px,
          62% 0, 100% 0, 100% 1px, calc(62% + 1px) 1px,
          calc(62% - 6px) 8px, calc(36% + 6px) 8px, calc(36% - 1px) 1px, 0 1px
        );
      }
      html[data-variant="scifi"] aside::after { display: none; }
      html[data-variant="scifi"] .mark { margin: 0; }
      html[data-variant="scifi"] .banner { min-height: 10rem; margin: 0.6rem 0.6rem 0; padding: 4.2rem 1.2rem 1.3rem; }
      html[data-variant="scifi"] .banner::before { top: 1.8rem; left: 1.2rem; font-size: 0.52rem; }
      html[data-variant="scifi"] .banner h1 { font-size: clamp(1.65rem, 9vw, 2.5rem); }
      html[data-variant="scifi"] .content { margin: 0 0.6rem 0.6rem; padding: 1.4rem 1.2rem 3rem; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside>
      <p class="mark"><span class="sun" aria-hidden="true"></span>${NAV_SITE_NAME}</p>
      ${name}
      <nav aria-label="Options">${nav}</nav>
    </aside>
    <main>
      <header class="banner"><h1>${SITE_NAME}</h1></header>
      <div class="content">
        <h2>${escapeHtml(options.heading ?? options.title)}</h2>
        ${options.body}
      </div>
    </main>
  </div>
</body>
</html>`;
}
