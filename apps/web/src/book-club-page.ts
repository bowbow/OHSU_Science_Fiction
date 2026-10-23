import type { BookClubRoundView, CatalogBook, Core, MemberView } from "@bookclub/core";
import { escapeHtml, page } from "./html.ts";
import { failureSentence } from "./messages.ts";

export function renderBookClubPage(options: {
  member: MemberView | null;
  rounds: BookClubRoundView[];
  error?: string;
  month?: string;
}): string {
  if (!options.member) {
    return page({
      title: "Book club",
      member: null,
      active: "book-club",
      body: `<p>Sign in to see the book club.</p><p><a href="/sign-in">Sign in</a></p>`,
    });
  }
  const error = options.error ? `<p class="error">${escapeHtml(options.error)}</p>` : "";
  const club = options.rounds[0];
  const open = club?.status === "open_for_suggestions";
  const topVotes = club && club.suggestions.length > 0
    ? Math.max(...club.suggestions.map((suggestion) => suggestion.votes))
    : null;
  const leaders = topVotes === null || !club
    ? []
    : club.suggestions.filter((suggestion) => suggestion.votes === topVotes);
  const tied = open && leaders.length > 1;
  const selected = club?.selectedSuggestionId
    ? club.suggestions.find((suggestion) => suggestion.id === club.selectedSuggestionId) ?? null
    : null;
  const heading = selected
    ? `The book club will read ${selected.title}.`
    : open
      ? options.member.role === "admin"
        ? "Book club is open for book suggestions."
        : "Book club voting is open."
      : club
        ? "No book was selected."
        : "Book club is not open for book suggestions.";
  const openAction = options.member.role === "admin" && club && !open && !selected
    ? `<form class="sheet" method="post" action="/book-club/open"><button type="submit">Open for book suggestions</button></form>`
    : options.member.role === "admin" && !club
      ? `<form class="sheet" method="post" action="/book-club/open"><button type="submit">Open for book suggestions</button></form>`
      : "";
  const tieNotice = tied && options.member.role === "admin"
    ? `<p>These books have the same number of votes. Choose the book the club will read.</p>`
    : "";
  const closeAction = options.member.role === "admin" && open && !tied
    ? `<form method="post" action="/book-club/close"><button type="submit">Close the call for new books</button></form>`
    : "";
  const startOverAction = selected && options.member.role === "admin" ? startOverConfirm() : "";
  const suggestAction = open && options.member.role === "admin"
    ? `<form class="sheet" method="post" action="/book-club/suggestions">
         <label>Book title <input name="title" required></label>
         <button type="submit">Suggest book</button>
       </form>`
    : "";
  const chooseIds = tied && options.member.role === "admin" ? new Set(leaders.map((suggestion) => suggestion.id)) : new Set<string>();
  const openList = !selected && open && club ? suggestionList(club, options.member, true, chooseIds) : "";
  const selectedView = selected && club ? selectedBookAndMeetings(club, selected, options.member, options.month) : "";
  return page({
    title: "Book club",
    heading,
    member: options.member,
    active: "book-club",
    sidebarAction: startOverAction,
    body: `${error}${tieNotice}${openList}${selectedView}${closeAction}${suggestAction}${openAction}`,
  });
}

function selectedBookAndMeetings(
  club: BookClubRoundView,
  selected: BookClubRoundView["suggestions"][number],
  member: MemberView,
  month?: string,
): string {
  const book = `<div class="winner">${suggestionList({ ...club, suggestions: [selected] }, member, false, new Set())}</div>`;
  const meeting = meetingParts(club, member, month);
  return `<div class="reading">${book}${meeting.side}</div>${meeting.below}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function formatMeetingTime(startsAt: string): string {
  const [date, time] = startsAt.split("T");
  const [year, month, day] = (date ?? "").split("-").map(Number);
  const [hour, minute] = (time ?? "").split(":").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
  const clockHour = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  const minutes = String(minute).padStart(2, "0");
  return `${weekday}, ${MONTHS[month - 1]} ${day}, ${year} at ${clockHour}:${minutes} ${suffix}`;
}

function meetingParts(club: BookClubRoundView, member: MemberView, month?: string): { side: string; below: string } {
  const chosen = club.selectedMeetingTimeId
    ? club.meetingTimes.find((time) => time.id === club.selectedMeetingTimeId) ?? null
    : null;
  if (chosen) {
    const sentence = `<p class="meeting-chosen">The book club will meet on ${escapeHtml(formatMeetingTime(chosen.startsAt))}.</p>`;
    return { side: `<div class="meeting-side">${meetingCalendar([chosen], "chosen")}${sentence}</div>`, below: "" };
  }
  const topVotes = club.meetingTimes.length > 0 ? Math.max(...club.meetingTimes.map((time) => time.votes)) : null;
  const leaders = topVotes === null ? [] : club.meetingTimes.filter((time) => time.votes === topVotes);
  const tied = leaders.length > 1;
  const admin = member.role === "admin";
  const notice = tied && admin
    ? `<p class="meeting-note">These times have the same number of votes. Choose the time the club will meet.</p>`
    : "";
  const empty = !admin && club.meetingTimes.length === 0 ? `<p class="meeting-note">No meeting times have been proposed yet.</p>` : "";
  const proposeHint = admin ? `<p class="meeting-note">Click an open day to propose a time.</p>` : "";
  const calendar = meetingCalendar(club.meetingTimes, admin ? "propose" : "vote", month);
  const side = calendar ? `<div class="meeting-side">${calendar}</div>` : "";
  const prompt = !admin && club.meetingTimes.length > 0 && club.meetingTimes.every((time) => !time.votedByMe)
    ? `<p class="meeting-note">Click each day you can attend.</p>`
    : "";
  const items = admin ? club.meetingTimes.map((time) => {
    const remove = `<form method="post" action="/book-club/meeting/remove"><input type="hidden" name="meeting" value="${escapeHtml(time.id)}"><button class="quiet" type="submit">Remove</button></form>`;
    const choose = tied && leaders.some((leader) => leader.id === time.id)
      ? `<form method="post" action="/book-club/meeting/select"><input type="hidden" name="meeting" value="${escapeHtml(time.id)}"><button type="submit">Choose this time</button></form>`
      : "";
    return `<li><span class="votes">${voteCount(time.votes)}</span><span class="meeting-when">${escapeHtml(formatMeetingTime(time.startsAt))}</span><span class="meeting-actions">${choose}${remove}</span></li>`;
  }).join("") : "";
  const list = items ? `<ul class="meetings">${items}</ul>` : "";
  const leader = !tied ? leaders[0] ?? null : null;
  const leadSentence = leader
    ? leader.votes > 0
      ? `<strong>${escapeHtml(formatMeetingTime(leader.startsAt))}</strong> has the most votes.`
      : `<strong>${escapeHtml(formatMeetingTime(leader.startsAt))}</strong> is the only proposed time.`
    : "";
  const select = admin && leader
    ? `<div class="meeting-finalize">
         <p>${leadSentence} Press <strong>Date selected</strong> to lock in the selected book together with this date and time for the club.</p>
         <form method="post" action="/book-club/meeting/select"><button type="submit">Date selected</button></form>
       </div>`
    : "";
  return { side, below: `${notice}${proposeHint}${empty}${prompt}${list}${select}` };
}

function startOverConfirm(): string {
  return `<div class="start-over">
    <button type="button" class="start-over-open">Start a new book</button>
    <dialog class="confirm">
      <p>Starting over clears the chosen book, the suggestions, the votes, and the meeting time. The club opens for suggestions again with an empty list.</p>
      <div class="confirm-actions">
        <form method="post" action="/book-club/start-over"><button type="submit">Yes</button></form>
        <button type="button" class="quiet start-over-close">No</button>
      </div>
    </dialog>
  </div>
  <script>
    const startOverOpen = document.querySelector(".start-over-open");
    const startOverDialog = document.querySelector(".start-over dialog");
    const startOverClose = document.querySelector(".start-over-close");
    if (startOverOpen && startOverDialog instanceof HTMLDialogElement) {
      startOverOpen.addEventListener("click", () => startOverDialog.showModal());
    }
    if (startOverClose && startOverDialog instanceof HTMLDialogElement) {
      startOverClose.addEventListener("click", () => startOverDialog.close());
    }
  </script>`;
}

type CalendarMode = "vote" | "propose" | "chosen";

function meetingCalendar(
  times: { id: string; startsAt: string; votes: number; votedByMe: boolean }[],
  mode: CalendarMode,
  focus?: string,
): string {
  if (mode !== "propose" && times.length === 0) {
    return "";
  }
  const byMonth = new Map<string, Map<number, typeof times>>();
  for (const time of times) {
    const [date] = time.startsAt.split("T");
    const [year, monthText, dayText] = (date ?? "").split("-");
    const day = Number(dayText);
    const key = `${year}-${monthText}`;
    const days = byMonth.get(key) ?? new Map<number, typeof times>();
    const clocks = days.get(day) ?? [];
    clocks.push(time);
    days.set(day, clocks);
    byMonth.set(key, days);
  }
  const keys = mode === "propose" ? [shownMonth(focus, times)] : [...byMonth.keys()].sort();
  const months = keys.map((key) => renderMonth(key, byMonth.get(key) ?? new Map(), mode)).join("");
  return `<div class="calendars">${months}${mode === "propose" ? proposeTimeDialog() : ""}</div>`;
}

function shownMonth(focus: string | undefined, times: { startsAt: string }[]): string {
  if (focus && /^\d{4}-(0[1-9]|1[0-2])$/.test(focus)) {
    return focus;
  }
  const first = times.map((time) => time.startsAt.slice(0, 7)).sort()[0];
  if (first) {
    return first;
  }
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(key: string, delta: number): string {
  const [yearText, monthText] = key.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function proposeTimeDialog(): string {
  return `<dialog class="confirm propose-time">
    <p class="propose-date-label">Propose a meeting.</p>
    <form method="post" action="/book-club/meeting">
      <input type="hidden" name="date" value="">
      <input type="hidden" name="starts" value="">
      <input type="hidden" name="clock" value="16:00">
      <div class="dial-picker" aria-label="Choose a meeting time">
        <div class="dial-readout">
          <button type="button" class="dial-value active" data-dial-mode="hour" aria-label="Choose hour">04</button>
          <span class="dial-colon" aria-hidden="true">:</span>
          <button type="button" class="dial-value" data-dial-mode="minute" aria-label="Choose minutes">00</button>
          <div class="dial-periods" aria-label="Choose AM or PM">
            <button type="button" class="dial-period" data-period="AM" aria-pressed="false">AM</button>
            <button type="button" class="dial-period active" data-period="PM" aria-pressed="true">PM</button>
          </div>
        </div>
        <p class="dial-instruction" aria-live="polite">Select an hour</p>
        <div class="clock-face" style="--dial-angle: 120deg">
          <span class="clock-hand" aria-hidden="true"></span>
          <span class="clock-center" aria-hidden="true"></span>
          <div class="dial-options dial-hours">
            <button type="button" class="clock-option" style="--index: 0" data-hour="12">12</button>
            <button type="button" class="clock-option" style="--index: 1" data-hour="1">1</button>
            <button type="button" class="clock-option" style="--index: 2" data-hour="2">2</button>
            <button type="button" class="clock-option" style="--index: 3" data-hour="3">3</button>
            <button type="button" class="clock-option active" style="--index: 4" data-hour="4">4</button>
            <button type="button" class="clock-option" style="--index: 5" data-hour="5">5</button>
            <button type="button" class="clock-option" style="--index: 6" data-hour="6">6</button>
            <button type="button" class="clock-option" style="--index: 7" data-hour="7">7</button>
            <button type="button" class="clock-option" style="--index: 8" data-hour="8">8</button>
            <button type="button" class="clock-option" style="--index: 9" data-hour="9">9</button>
            <button type="button" class="clock-option" style="--index: 10" data-hour="10">10</button>
            <button type="button" class="clock-option" style="--index: 11" data-hour="11">11</button>
          </div>
          <div class="dial-options dial-minutes" hidden>
            <button type="button" class="clock-option active" style="--index: 0" data-minute="0">00</button>
            <button type="button" class="clock-option" style="--index: 1" data-minute="5">05</button>
            <button type="button" class="clock-option" style="--index: 2" data-minute="10">10</button>
            <button type="button" class="clock-option" style="--index: 3" data-minute="15">15</button>
            <button type="button" class="clock-option" style="--index: 4" data-minute="20">20</button>
            <button type="button" class="clock-option" style="--index: 5" data-minute="25">25</button>
            <button type="button" class="clock-option" style="--index: 6" data-minute="30">30</button>
            <button type="button" class="clock-option" style="--index: 7" data-minute="35">35</button>
            <button type="button" class="clock-option" style="--index: 8" data-minute="40">40</button>
            <button type="button" class="clock-option" style="--index: 9" data-minute="45">45</button>
            <button type="button" class="clock-option" style="--index: 10" data-minute="50">50</button>
            <button type="button" class="clock-option" style="--index: 11" data-minute="55">55</button>
          </div>
        </div>
      </div>
      <div class="confirm-actions">
        <button type="submit">Propose</button>
        <button type="button" class="quiet propose-close">Cancel</button>
      </div>
    </form>
  </dialog>
  <script>
    const proposeDialog = document.querySelector(".propose-time");
    const proposeForm = proposeDialog ? proposeDialog.querySelector("form") : null;
    const proposeLabel = document.querySelector(".propose-date-label");
    const clockFace = proposeForm ? proposeForm.querySelector(".clock-face") : null;
    const hourOptions = proposeForm ? proposeForm.querySelectorAll("[data-hour]") : [];
    const minuteOptions = proposeForm ? proposeForm.querySelectorAll("[data-minute]") : [];
    const hourDisplay = proposeForm ? proposeForm.querySelector('[data-dial-mode="hour"]') : null;
    const minuteDisplay = proposeForm ? proposeForm.querySelector('[data-dial-mode="minute"]') : null;
    const periodOptions = proposeForm ? proposeForm.querySelectorAll("[data-period]") : [];
    const hours = proposeForm ? proposeForm.querySelector(".dial-hours") : null;
    const minutes = proposeForm ? proposeForm.querySelector(".dial-minutes") : null;
    const dialInstruction = proposeForm ? proposeForm.querySelector(".dial-instruction") : null;
    let dialHour = 4;
    let dialMinute = 0;
    let dialPeriod = "PM";
    let dialMode = "hour";
    const syncDial = () => {
      if (!proposeForm) return;
      const clockInput = proposeForm.querySelector('[name="clock"]');
      if (hourDisplay) hourDisplay.textContent = String(dialHour).padStart(2, "0");
      if (minuteDisplay) minuteDisplay.textContent = String(dialMinute).padStart(2, "0");
      if (hourDisplay) hourDisplay.classList.toggle("active", dialMode === "hour");
      if (minuteDisplay) minuteDisplay.classList.toggle("active", dialMode === "minute");
      if (hours instanceof HTMLElement) hours.hidden = dialMode !== "hour";
      if (minutes instanceof HTMLElement) minutes.hidden = dialMode !== "minute";
      if (dialInstruction) dialInstruction.textContent = dialMode === "hour" ? "Select an hour" : "Select minutes";
      hourOptions.forEach((option) => option.classList.toggle("active", Number(option.getAttribute("data-hour")) === dialHour));
      minuteOptions.forEach((option) => option.classList.toggle("active", Number(option.getAttribute("data-minute")) === dialMinute));
      periodOptions.forEach((option) => {
        const active = option.getAttribute("data-period") === dialPeriod;
        option.classList.toggle("active", active);
        option.setAttribute("aria-pressed", String(active));
      });
      const step = dialMode === "hour" ? dialHour % 12 : dialMinute / 5;
      if (clockFace instanceof HTMLElement) clockFace.style.setProperty("--dial-angle", String(step * 30) + "deg");
      if (clockInput instanceof HTMLInputElement) {
        let hour = dialHour % 12;
        if (dialPeriod === "PM") hour += 12;
        clockInput.value = String(hour).padStart(2, "0") + ":" + String(dialMinute).padStart(2, "0");
      }
    };
    const resetDial = () => {
      dialHour = 4;
      dialMinute = 0;
      dialPeriod = "PM";
      dialMode = "hour";
      syncDial();
    };
    hourOptions.forEach((option) => option.addEventListener("click", () => {
      dialHour = Number(option.getAttribute("data-hour"));
      dialMode = "minute";
      syncDial();
    }));
    minuteOptions.forEach((option) => option.addEventListener("click", () => {
      dialMinute = Number(option.getAttribute("data-minute"));
      syncDial();
    }));
    [hourDisplay, minuteDisplay].forEach((display) => {
      if (display) display.addEventListener("click", () => {
        dialMode = display.getAttribute("data-dial-mode") || "hour";
        syncDial();
      });
    });
    periodOptions.forEach((option) => option.addEventListener("click", () => {
      dialPeriod = option.getAttribute("data-period") || "PM";
      syncDial();
    }));
    document.querySelectorAll(".cal-add").forEach((button) => {
      button.addEventListener("click", () => {
        if (!(proposeDialog instanceof HTMLDialogElement) || !proposeForm || !proposeLabel) return;
        proposeForm.reset();
        resetDial();
        const date = button.getAttribute("data-date") || "";
        const dateInput = proposeForm.querySelector("[name=date]");
        if (dateInput instanceof HTMLInputElement) dateInput.value = date;
        proposeLabel.textContent = button.getAttribute("data-label") || "Propose a meeting.";
        proposeDialog.showModal();
      });
    });
    const proposeClose = document.querySelector(".propose-close");
    if (proposeClose && proposeDialog instanceof HTMLDialogElement) {
      proposeClose.addEventListener("click", () => proposeDialog.close());
    }
    if (proposeForm) {
      proposeForm.addEventListener("submit", () => {
        const dateInput = proposeForm.querySelector("[name=date]");
        const clockInput = proposeForm.querySelector("[name=clock]");
        const startsInput = proposeForm.querySelector("[name=starts]");
        if (dateInput instanceof HTMLInputElement && clockInput instanceof HTMLInputElement && startsInput instanceof HTMLInputElement) {
          startsInput.value = dateInput.value + "T" + clockInput.value;
        }
      });
    }
  </script>`;
}

function shortClock(clock: string): string {
  const [hour, minute] = clock.split(":").map(Number);
  const clockHour = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${clockHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function renderMonth(
  key: string,
  days: Map<number, { id: string; startsAt: string; votes: number; votedByMe: boolean }[]>,
  mode: CalendarMode,
): string {
  const [yearText, monthText] = key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: string[] = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push("<td></td>");
  }
  for (let day = 1; day <= lastDay; day += 1) {
    const clocks = days.get(day);
    const date = `${yearText}-${monthText}-${String(day).padStart(2, "0")}`;
    if (!clocks) {
      cells.push(mode === "propose" ? `<td>${addTimeButton(date, day)}</td>` : `<td><span class="cal-day">${day}</span></td>`);
    } else {
      const hits = clocks.map((time) => calendarHit(time, day, mode !== "chosen")).join("");
      const more = mode === "propose" ? addTimeButton(date, day, true) : "";
      cells.push(`<td class="proposed" data-date="${date}">${hits}${more}</td>`);
    }
  }
  while (cells.length % 7 !== 0) {
    cells.push("<td></td>");
  }
  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(`<tr>${cells.slice(index, index + 7).join("")}</tr>`);
  }
  const heads = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<th scope="col">${day}</th>`).join("");
  const previous = shiftMonth(key, -1);
  const next = shiftMonth(key, 1);
  const title = `${MONTHS[month - 1]} ${year}`;
  const caption = mode === "propose"
    ? `<a class="cal-nav" href="/book-club?month=${previous}" aria-label="Previous month">‹</a><span>${title}</span><a class="cal-nav" href="/book-club?month=${next}" aria-label="Next month">›</a>`
    : title;
  return `<table class="calendar"><caption>${caption}</caption><thead><tr>${heads}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function addTimeButton(date: string, day: number, another = false): string {
  const label = `Propose a meeting on ${formatMeetingDate(date)}.`;
  const className = another ? "cal-add cal-add-more" : "cal-add";
  const text = another ? "+" : String(day);
  return `<button type="button" class="${className}" data-date="${date}" data-label="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${text}</button>`;
}

function formatMeetingDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
  return `${weekday}, ${MONTHS[month - 1]} ${day}, ${year}`;
}

function calendarHit(
  time: { id: string; startsAt: string; votes: number; votedByMe: boolean },
  day: number,
  interactive: boolean,
): string {
  const clock = shortClock(time.startsAt.split("T")[1] ?? "");
  const count = voteCount(time.votes);
  const body = `<span class="cal-day">${day}</span><span class="cal-time">${escapeHtml(clock)}</span><span class="cal-count">${count}</span>`;
  const voted = time.votedByMe ? " voted" : "";
  if (!interactive) {
    return `<span class="cal-hit${voted}">${body}</span>`;
  }
  const action = time.votedByMe ? "/book-club/meeting/votes/remove" : "/book-club/meeting/votes";
  const label = `${time.votedByMe ? "Remove your vote for" : "Vote for"} ${formatMeetingTime(time.startsAt)}, ${count}`;
  return `<form method="post" action="${action}"><input type="hidden" name="meeting" value="${escapeHtml(time.id)}"><button type="submit" class="cal-hit${voted}" aria-label="${escapeHtml(label)}">${body}</button></form>`;
}

function voteCount(votes: number): string {
  return votes === 1 ? "1 vote" : `${votes} votes`;
}

function suggestionList(
  round: BookClubRoundView,
  member: MemberView,
  showActions: boolean,
  chooseIds: Set<string>,
): string {
  if (round.suggestions.length === 0) {
    return "<p>No books have been suggested yet.</p>";
  }
  const items = round.suggestions.map((suggestion) => {
    const title = escapeHtml(suggestion.title);
    const removeDialogId = `remove-book-${escapeHtml(suggestion.id)}`;
    const remove = showActions && member.role === "admin"
      ? suggestion.votes > 0
        ? `<div class="book-remove">
             <button class="quiet danger book-remove-control book-remove-open" type="button" aria-label="Remove ${title}" title="Remove book" aria-controls="${removeDialogId}">&times;</button>
             <dialog class="confirm book-remove-confirm" id="${removeDialogId}">
               <p><strong>${title}</strong> has ${voteCount(suggestion.votes)}. Are you sure you want to remove it?</p>
               <div class="confirm-actions">
                 <form method="post" action="/book-club/suggestions/remove"><input type="hidden" name="suggestion" value="${escapeHtml(suggestion.id)}"><button class="danger" type="submit">Yes, remove book</button></form>
                 <button class="quiet book-remove-close" type="button">No, keep book</button>
               </div>
             </dialog>
           </div>`
        : `<form class="book-remove" method="post" action="/book-club/suggestions/remove"><input type="hidden" name="suggestion" value="${escapeHtml(suggestion.id)}"><button class="quiet danger book-remove-control" type="submit" aria-label="Remove ${title}" title="Remove book">&times;</button></form>`
      : "";
    const vote = !showActions
      ? ""
      : suggestion.votedByMe
        ? `<span class="your-vote">Your vote</span>`
        : `<form method="post" action="/book-club/votes"><input type="hidden" name="suggestion" value="${escapeHtml(suggestion.id)}"><button type="submit">Vote</button></form>`;
    const choose = chooseIds.has(suggestion.id)
      ? `<form class="choose" method="post" action="/book-club/close"><input type="hidden" name="suggestion" value="${escapeHtml(suggestion.id)}"><button type="submit">Choose this book</button></form>`
      : "";
    const votes = `<span class="votes">${voteCount(suggestion.votes)}</span>`;
    const actions = vote || choose ? `<span class="book-actions">${vote}${choose}</span>` : "";
    const voters = member.role === "admin" && suggestion.voters && suggestion.voters.length > 0
      ? `<details class="voter-disclosure">
           <summary>View voters</summary>
           <div class="voter-list" role="list" aria-label="Voters for ${title}">
             ${suggestion.voters.map((voter) => `<span class="voter-name" role="listitem">${escapeHtml(voter)}</span>`).join("")}
           </div>
         </details>`
      : "";
    const suggestedBy = escapeHtml(suggestion.suggestedBy);
    if (suggestion.coverId === null) {
      return `<li class="book" title="Suggested by ${suggestedBy}"><div class="book-float-group"><div class="book-stack">${votes}${remove}<span class="book-title">${title}</span>${actions}</div>${voters}</div></li>`;
    }
    const cover = `<img class="cover" alt="${title}" src="https://covers.openlibrary.org/b/id/${suggestion.coverId}-M.jpg" onerror="var card=this.closest('li');var name=card.querySelector('.book-title');if(name)name.hidden=false;var drift=this.closest('.cover-float');if(drift)drift.classList.remove('cover-float');this.remove()">`;
    return `<li class="book" title="Suggested by ${suggestedBy}"><div class="book-float-group cover-float"><div class="book-stack">${votes}${remove}${cover}<span class="book-title" hidden>${title}</span>${actions}</div>${voters}</div></li>`;
  }).join("");
  return `<ul class="books">${items}</ul>
  <script>
    (() => {
      document.querySelectorAll(".book-remove-open").forEach((button) => {
        button.addEventListener("click", () => {
          const dialogId = button.getAttribute("aria-controls");
          const dialog = dialogId ? document.getElementById(dialogId) : null;
          if (dialog instanceof HTMLDialogElement) dialog.showModal();
        });
      });
      document.querySelectorAll(".book-remove-close").forEach((button) => {
        button.addEventListener("click", () => {
          const dialog = button.closest("dialog");
          if (dialog instanceof HTMLDialogElement) dialog.close();
        });
      });
    })();
  </script>`;
}

export function closeBookClubForm(
  core: Core,
  input: { sessionId: string | null; suggestionId?: string | null },
): { error?: string; closed?: boolean; title?: string | null } {
  const result = core.closeBookClub(input);
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { closed: true, title: result.value.selectedTitle };
}

export function startOverForm(core: Core, sessionId: string | null): { error?: string; started?: boolean } {
  const result = core.startOver(sessionId);
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { started: true };
}

export function openBookClubForm(core: Core, sessionId: string | null): { error?: string; changed?: boolean } {
  const result = core.openBookClub(sessionId);
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { changed: result.value.changed };
}

export function removeBookForm(
  core: Core,
  input: { sessionId: string | null; suggestionId: string },
): { error?: string; title?: string; suggestedBy?: string } {
  const result = core.removeBookSuggestion(input);
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { title: result.value.title, suggestedBy: result.value.suggestedBy };
}

export function voteForBookForm(
  core: Core,
  input: { sessionId: string | null; suggestionId: string },
): { error?: string; title?: string; placed?: "new" | "moved" | "unchanged" } {
  const result = core.voteForBook(input);
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { title: result.value.title, placed: result.value.placed };
}

export async function suggestBookForm(
  core: Core,
  input: {
    sessionId: string | null;
    title: string;
    coverId: number | null;
    lookup?: (title: string) => Promise<CatalogBook[]>;
  },
): Promise<{ error?: string; title?: string; matches?: CatalogBook[] }> {
  if (!input.lookup) {
    const result = core.suggestBook({ sessionId: input.sessionId, title: input.title });
    if (!result.ok) {
      return { error: failureSentence(result.failure) };
    }
    return { title: result.value.title };
  }
  const result = await core.suggestMatchedBook(
    { sessionId: input.sessionId, title: input.title, coverId: input.coverId },
    input.lookup,
  );
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  if (result.value.matches && result.value.matches.length > 1) {
    return { title: result.value.title, matches: result.value.matches };
  }
  return { title: result.value.title };
}

export function renderBookMatchPage(options: {
  member: MemberView | null;
  title: string;
  matches: CatalogBook[];
}): string {
  const choices = options.matches.map((match) => {
    const authors = match.authors ? `<p>${escapeHtml(match.authors)}</p>` : "";
    const year = match.year === null ? "" : `<p>${match.year}</p>`;
    const alt = match.authors ? `${match.title} by ${match.authors}` : match.title;
    return `<li>
      <form method="post" action="/book-club/suggestions">
        <input type="hidden" name="title" value="${escapeHtml(options.title)}">
        <input type="hidden" name="cover" value="${match.coverId}">
        <img class="cover" alt="${escapeHtml(alt)}" src="https://covers.openlibrary.org/b/id/${match.coverId}-M.jpg">
        ${authors}
        ${year}
        <button type="submit">Add this book</button>
      </form>
    </li>`;
  }).join("");
  return page({
    title: "Book club",
    heading: "Which book did you mean?",
    member: options.member,
    active: "book-club",
    body: `<p class="match-note">Nothing is added until you pick one. <a href="/book-club">Back to the list</a></p><ul class="matches">${choices}</ul>`,
  });
}

function meetingValue<T>(result: { ok: true; value: T } | { ok: false; failure: Parameters<typeof failureSentence>[0] }): { error?: string; value?: T } {
  if (!result.ok) {
    return { error: failureSentence(result.failure) };
  }
  return { value: result.value };
}

export function proposeMeetingForm(core: Core, input: { sessionId: string | null; startsAt: string }): { error?: string; startsAt?: string } {
  const outcome = meetingValue(core.proposeMeetingTime(input));
  return outcome.error ? { error: outcome.error } : { startsAt: outcome.value?.startsAt };
}

export function removeMeetingForm(core: Core, input: { sessionId: string | null; meetingTimeId: string }): { error?: string; startsAt?: string } {
  const outcome = meetingValue(core.removeMeetingTime(input));
  return outcome.error ? { error: outcome.error } : { startsAt: outcome.value?.startsAt };
}

export function voteForMeetingForm(core: Core, input: { sessionId: string | null; meetingTimeId: string }): { error?: string; startsAt?: string; recorded?: boolean } {
  const outcome = meetingValue(core.voteForMeetingTime(input));
  return outcome.error ? { error: outcome.error } : { startsAt: outcome.value?.startsAt, recorded: outcome.value?.recorded };
}

export function withdrawMeetingForm(core: Core, input: { sessionId: string | null; meetingTimeId: string }): { error?: string; startsAt?: string; removed?: boolean } {
  const outcome = meetingValue(core.withdrawMeetingVote(input));
  return outcome.error ? { error: outcome.error } : { startsAt: outcome.value?.startsAt, removed: outcome.value?.removed };
}

export function selectMeetingForm(
  core: Core,
  input: { sessionId: string | null; meetingTimeId?: string | null },
): { error?: string; startsAt?: string } {
  const outcome = meetingValue(core.selectMeetingTime(input));
  return outcome.error ? { error: outcome.error } : { startsAt: outcome.value?.startsAt };
}
