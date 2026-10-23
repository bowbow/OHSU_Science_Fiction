import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../src/html.ts", import.meta.url), "utf8");
const serverSource = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");

test("the page declares a device-width viewport and global overflow safety", () => {
  assert.match(source, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(source, /\*, \*::before, \*::after\s*\{[^}]*box-sizing:\s*border-box/s);
  assert.match(source, /body\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(source, /img\s*\{[^}]*max-width:\s*100%/s);
});

test("responsive width bands preserve three, two, and one book columns", () => {
  assert.match(source, /\.books\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(source, /@media \(max-width:\s*1050px\)[\s\S]*?\.books\s*\{[^}]*repeat\(2,/);
  assert.match(source, /@media \(max-width:\s*480px\)[\s\S]*?\.books\s*\{[^}]*grid-template-columns:\s*1fr/);
});

test("phone navigation and touch interaction receive dedicated rules", () => {
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?aside\s*\{[^}]*display:\s*grid/);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?nav\s*\{[^}]*flex-direction:\s*row/);
  assert.match(source, /@media \(hover:\s*none\),\s*\(pointer:\s*coarse\)/);
  assert.match(source, /@media \(hover:\s*none\),\s*\(pointer:\s*coarse\)[\s\S]*?\.cover-float\s*\{[^}]*animation:\s*none/);
});

test("book covers do not react to hover", () => {
  assert.doesNotMatch(source, /\.cover:hover\s*\{/);
  assert.doesNotMatch(source, /:has\(\.cover:hover\)/);
  assert.doesNotMatch(source, /\.cover-float:hover/);
});

test("narrow forms, dialogs, calendars, and controls are constrained", () => {
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?dialog[^}]*max-width:\s*calc\(100vw - 2rem\)/);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?input[^}]*max-width:\s*100%/);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?\.calendar\s*\{[^}]*padding:/);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?button[^}]*min-height:\s*44px/);
});

test("book suggestion controls place closing beside the add-book panel", () => {
  assert.match(source, /\.book-suggestion-controls\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;/s);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?\.book-suggestion-controls\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;/s);
});

test("the sci-fi book grid ends with a notched HUD divider", () => {
  assert.match(source, /\.books-end-divider\s*\{\s*display:\s*none;/s);
  assert.match(source, /html\[data-variant="scifi"\] \.books-end-divider\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*border-top:\s*1px solid/s);
  assert.match(source, /html\[data-variant="scifi"\] \.books-end-divider::before\s*\{[^}]*clip-path:\s*polygon/s);
});

test("unseen feedback summaries are bold and seen summaries are normal", () => {
  assert.match(source, /\.feedback-summary-line \{[\s\S]*?font-weight: 400;/);
  assert.match(source, /\.feedback-item\.is-unseen > \.feedback-summary-line \{[^}]*font-weight: 700;[^}]*background: rgba\(36, 78, 139, 0\.1\);/s);
  assert.match(source, /html\[data-variant="scifi"\] \.feedback-item\.is-unseen > \.feedback-summary-line \{[^}]*background: rgba\(87, 222, 211, 0\.11\);/s);
});

test("feedback submit and cancel controls share the same dimensions and sci-fi typography", () => {
  assert.match(source, /\.feedback-form-actions > button, \.feedback-form-actions > \.feedback-cancel \{[^}]*min-width: 10rem;[^}]*min-height: 2\.65rem;[^}]*margin: 0;[^}]*padding: 0\.7rem 1\.2rem;/s);
  assert.match(source, /html\[data-variant="scifi"\] \.feedback-cancel \{[^}]*color: #021012;[^}]*background: var\(--hud-teal\);[^}]*font-family: "Orbitron", sans-serif;[^}]*font-size: 0\.72rem;/s);
});

test("the sci-fi title keeps mixed case and its chromatic offset", () => {
  assert.doesNotMatch(
    source,
    /html\[data-variant="scifi"\] \.banner h1\s*\{[^}]*text-transform:\s*uppercase/s,
  );
  assert.match(
    source,
    /html\[data-variant="scifi"\] \.banner h1\s*\{[^}]*text-shadow:\s*-2px 0 var\(--hud-blue\),\s*2px 0 var\(--hud-teal\)/s,
  );
});

test("the sci-fi panels use angular HUD framing", () => {
  assert.match(
    source,
    /html\[data-variant="scifi"\] \.sheet,[\s\S]*?linear-gradient\(90deg, var\(--hud-teal\), transparent\) left top/s,
  );
  assert.match(
    source,
    /html\[data-variant="scifi"\] \.banner\s*\{[^}]*clip-path:\s*polygon/s,
  );
  assert.match(
    source,
    /html\[data-variant="scifi"\] \.content::before\s*\{[^}]*clip-path:\s*polygon/s,
  );
});

test("the sci-fi background uses the local starfield image", () => {
  const imageUrl = new URL("../public/starfield.jpg", import.meta.url);
  assert.match(source, /url\("\/assets\/starfield\.jpg"\) center center \/ cover no-repeat/);
  assert.match(source, /filter:\s*saturate\(0\.72\) contrast\(1\.06\) brightness\(0\.76\)/);
  assert.equal(existsSync(imageUrl), true);
  assert.ok(statSync(imageUrl).size < 2_000_000);
  assert.match(serverSource, /pathname === "\/assets\/starfield\.jpg"/);
  assert.match(serverSource, /contentType: "image\/jpeg"/);
});

test("the sci-fi variant uses a local targeting cursor", () => {
  const cursorUrl = new URL("../public/target-cursor.svg", import.meta.url);
  assert.match(source, /cursor:\s*url\("\/assets\/target-cursor\.svg"\) 16 16, crosshair/);
  assert.equal(existsSync(cursorUrl), true);
  assert.ok(statSync(cursorUrl).size < 8_000);
  assert.match(serverSource, /pathname === "\/assets\/target-cursor\.svg"/);
  assert.match(serverSource, /contentType: "image\/svg\+xml; charset=utf-8"/);
});

test("the sci-fi books use a local electronic card image", () => {
  const cardUrl = new URL("../public/book-card.svg", import.meta.url);
  assert.match(source, /\.book-stack,[\s\S]*?background:\s*url\("\/assets\/book-card\.svg\?v=3"\) center center \/ 100% 100% no-repeat/s);
  assert.match(source, /\.book-stack > \.votes\s*\{[^}]*position:\s*relative;[^}]*align-self:\s*flex-start;[^}]*flex:\s*0 0 auto;/s);
  assert.match(source, /\.book-stack > \.votes\s*\{[^}]*background:\s*linear-gradient[^}]*font-size:\s*0\.66rem;/s);
  assert.match(source, /html\[data-variant="scifi"\] \.book-stack,[\s\S]*?height:\s*27rem;[\s\S]*?min-height:\s*27rem;[\s\S]*?padding:\s*1\.5rem 1\.65rem 2rem;/s);
  assert.match(source, /\.book-stack:not\(:has\(\.cover\)\)\s*\{[^}]*height:\s*27rem;[^}]*min-height:\s*27rem;[^}]*justify-content:\s*center;/s);
  assert.match(source, /\.book-stack:not\(:has\(\.cover\)\) > \.votes\s*\{[^}]*position:\s*absolute;[^}]*top:\s*1\.5rem;[^}]*left:\s*1\.9rem;[^}]*margin:\s*0;/s);
  assert.match(source, /\.book-stack:not\(:has\(\.cover\)\) > \.book-title\s*\{[^}]*position:\s*absolute;[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*transform:\s*translate\(-50%, -50%\);/s);
  assert.match(source, /\.book-stack \.cover,[\s\S]*?\.book-stack \.book-actions\s*\{[^}]*flex:\s*0 0 auto;/s);
  assert.match(source, /\.book-stack:has\(\.cover\) > \.cover\s*\{[^}]*position:\s*absolute;[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*transform:\s*translate\(-50%, -50%\);/s);
  assert.match(source, /\.book-stack \.book-actions\s*\{[^}]*margin-top:\s*auto;/s);
  assert.match(source, /\.book-float-group\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);
  assert.match(source, /\.book-float-group > \.voter-disclosure\s*\{[^}]*width:\s*min\(calc\(100% - 2\.8rem\), 11rem\);[^}]*margin-top:\s*-1\.75rem;/s);
  assert.match(source, /\.book-float-group > \.voter-disclosure summary\s*\{[^}]*display:\s*block;[^}]*clip-path:\s*polygon/s);
  assert.match(source, /\.book-remove\s*\{[^}]*position:\s*absolute;[^}]*top:\s*0\.45rem;[^}]*right:\s*0\.45rem;/s);
  assert.match(source, /\.book-remove button\.book-remove-control\s*\{[^}]*width:\s*2rem;[^}]*height:\s*2rem;[^}]*border-radius:\s*0;[^}]*clip-path:\s*polygon/s);
  assert.equal(existsSync(cardUrl), true);
  assert.ok(statSync(cardUrl).size < 12_000);
  assert.match(serverSource, /pathname === "\/assets\/book-card\.svg"/);
});

test("book information uses an angular drawer that remains usable on phones", () => {
  assert.match(source, /\.book-information\s*\{[^}]*position:\s*absolute;[^}]*right:\s*0\.45rem;/s);
  assert.match(source, /\.book-information-drawer\s*\{[^}]*max-height:[^}]*overflow:\s*auto;/s);
  assert.match(source, /html\[data-variant="scifi"\] \.book-information-drawer\s*\{[^}]*clip-path:\s*polygon[^}]*background:/s);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?\.book-information-drawer,[\s\S]*?position:\s*fixed;[^}]*width:\s*min\(22rem, calc\(100vw - 2rem\)\);/s);
});

test("the sci-fi controls use layered HUD glows", () => {
  assert.match(
    source,
    /html\[data-variant="scifi"\] nav\s*\{[^}]*drop-shadow\(0 0 7px rgba\(87, 222, 211, 0\.58\)\)[^}]*drop-shadow\(0 0 18px rgba\(83, 167, 255, 0\.3\)\)/s,
  );
  assert.match(
    source,
    /html\[data-variant="scifi"\] nav a,[\s\S]*?drop-shadow\(0 0 5px rgba\(87, 222, 211, 0\.4\)\)[\s\S]*?drop-shadow\(0 0 12px rgba\(83, 167, 255, 0\.18\)\)/s,
  );
  assert.match(
    source,
    /html\[data-variant="scifi"\] button\s*\{[^}]*drop-shadow\(0 0 5px rgba\(87, 222, 211, 0\.44\)\)[^}]*drop-shadow\(0 0 13px rgba\(83, 167, 255, 0\.2\)\)/s,
  );
});

test("the sci-fi calendar keeps its date controls legible", () => {
  assert.match(
    source,
    /html\[data-variant="scifi"\] \.calendar button\.cal-add,\s*html\[data-variant="scifi"\] \.calendar button\.cal-hit\s*\{[^}]*clip-path:\s*none[^}]*filter:\s*none/s,
  );
  assert.match(
    source,
    /html\[data-variant="scifi"\] \.calendar button\.cal-add\s*\{[^}]*color:\s*var\(--hud-text\)[^}]*background:\s*transparent/s,
  );
});
