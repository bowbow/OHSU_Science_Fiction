import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;
const DUMMY_SALT = "bookclub-dummy-salt";
const DUMMY_HASH = scryptSync("not-a-member-password", DUMMY_SALT, KEY_LENGTH).toString("base64url");

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("base64url");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const actual = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "base64url");
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

export function dummyPasswordCheck(password: string): void {
  verifyPassword(password, DUMMY_HASH, DUMMY_SALT);
}
