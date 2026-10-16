import { chmodSync, mkdirSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { backup, DatabaseSync } from "node:sqlite";

type IntegrityRow = { integrity_check: string };

export function verifySqliteDatabase(path: string): void {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const rows = db.prepare("PRAGMA integrity_check").all() as IntegrityRow[];
    if (rows.length !== 1 || rows[0]?.integrity_check !== "ok") {
      throw new Error(`SQLite integrity check failed for ${path}.`);
    }
  } finally {
    db.close();
  }
}

export async function createVerifiedBackup(sourcePath: string, destinationDirectory: string): Promise<string> {
  const source = resolve(sourcePath);
  const directory = resolve(destinationDirectory);
  mkdirSync(directory, { recursive: true, mode: 0o700 });

  const timestamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
  const destination = join(directory, `bookclub-${timestamp}-${randomUUID()}.sqlite`);
  const db = new DatabaseSync(source, { readOnly: true });

  try {
    await backup(db, destination);
  } catch (error) {
    rmSync(destination, { force: true });
    throw error;
  } finally {
    db.close();
  }

  try {
    chmodSync(destination, 0o600);
    verifySqliteDatabase(destination);
    return destination;
  } catch (error) {
    rmSync(destination, { force: true });
    throw error;
  }
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "backup" && args.length === 2) {
    process.stdout.write(`${await createVerifiedBackup(args[0]!, args[1]!)}\n`);
    return;
  }
  if (command === "verify" && args.length === 1) {
    verifySqliteDatabase(args[0]!);
    process.stdout.write("ok\n");
    return;
  }
  throw new Error("usage: sqlite-backup.ts backup <source.sqlite> <destination-directory> | verify <database.sqlite>");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
