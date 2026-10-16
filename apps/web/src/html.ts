import type { MemberView } from "@bookclub/core";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type PageId = "account" | "register" | "sign-in" | "book-club";

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
       ${navItem("Book club", "/book-club", options.active === "book-club")}`
    : "";
  const nav = options.member
    ? `${account}
       ${options.sidebarAction ?? ""}
       <form method="post" action="/sign-out"><button type="submit">Sign out</button></form>`
    : `${navItem("Register", "/register", options.active === "register")}
       ${navItem("Sign in", "/sign-in", options.active === "sign-in")}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)} · Welcome to the Bookclub</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap">
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
    .books li { position: relative; z-index: 0; display: flex; justify-content: center; min-width: 0; max-width: 100%; font-size: 1.05rem; font-weight: 600; line-height: 1.3; }
    .books li:has(.cover:hover) { z-index: 2; }
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
    .cover-float:hover { animation: none; }
    .cover {
      width: min(100%, 8.5rem);
      aspect-ratio: 2 / 3;
      object-fit: cover;
      border-radius: 0.4rem;
      background: var(--surface);
      transform-origin: center center;
      box-shadow: 0 12px 24px rgba(26, 22, 18, 0.16);
    }
    .books li:nth-child(2n) .cover-float { animation-duration: 6.4s; animation-delay: -1.6s; }
    .books li:nth-child(3n) .cover-float { animation-duration: 4.6s; animation-delay: -2.4s; }
    .books li:has(.cover:hover) .cover-float { animation: none; }
    .cover:hover {
      position: relative;
      z-index: 1;
      transform: scale(1.85);
      box-shadow: 0 18px 40px rgba(26, 22, 18, 0.28);
    }
    @keyframes float-book {
      from { transform: translateY(6px) rotate(-1.4deg); }
      to { transform: translateY(-14px) rotate(1.4deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .cover-float { animation: none; }
    }
    @media (hover: none), (pointer: coarse) {
      .cover-float { animation: none; }
      .cover:hover {
        position: static;
        z-index: auto;
        transform: none;
        box-shadow: 0 12px 24px rgba(26, 22, 18, 0.16);
      }
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
    .matches .cover:hover { transform: none; }
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
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside>
      <p class="mark"><span class="sun" aria-hidden="true"></span>Bookclub</p>
      ${name}
      <nav aria-label="Options">${nav}</nav>
    </aside>
    <main>
      <header class="banner"><h1>Welcome to the Bookclub</h1></header>
      <div class="content">
        <h2>${escapeHtml(options.heading ?? options.title)}</h2>
        ${options.body}
      </div>
    </main>
  </div>
</body>
</html>`;
}
