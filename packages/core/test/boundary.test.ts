import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { SCHEMA } from "../src/db.ts";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the core package has no runtime dependencies", () => {
  const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  assert.deepEqual(pkg.dependencies ?? {}, {});
});

test("core source does not import the website, a UI framework, or Google", () => {
  const files = walk(join(packageRoot, "src"));
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const importLines = source.split("\n").filter((line) => line.trimStart().startsWith("import "));
    for (const line of importLines) {
      assert.equal(/node:http|react|google-auth-library/i.test(line), false, `${file}: ${line}`);
    }
  }
});

test("the schema has no lockout counter or session expiry", () => {
  assert.equal(/fail|lock|expir/i.test(SCHEMA), false);
  assert.match(SCHEMA, /ended_at/);
});

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...walk(path));
    } else if (entry.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}
