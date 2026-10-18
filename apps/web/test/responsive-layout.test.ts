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
  assert.match(source, /@media \(hover:\s*none\),\s*\(pointer:\s*coarse\)[\s\S]*?\.cover:hover\s*\{[^}]*transform:\s*none/);
});

test("narrow forms, dialogs, calendars, and controls are constrained", () => {
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?dialog[^}]*max-width:\s*calc\(100vw - 2rem\)/);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?input[^}]*max-width:\s*100%/);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?\.calendar\s*\{[^}]*padding:/);
  assert.match(source, /@media \(max-width:\s*700px\)[\s\S]*?button[^}]*min-height:\s*44px/);
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
  assert.match(source, /\.book-stack > \.votes\s*\{[^}]*position:\s*absolute/s);
  assert.equal(existsSync(cardUrl), true);
  assert.ok(statSync(cardUrl).size < 12_000);
  assert.match(serverSource, /pathname === "\/assets\/book-card\.svg"/);
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
