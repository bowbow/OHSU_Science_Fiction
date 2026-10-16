import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../src/html.ts", import.meta.url), "utf8");

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
