import type { UsernameInvalidReason } from "./errors.ts";

const ALLOWED = /^[\p{L}\p{N}_-]+$/u;
const STARTS_ALNUM = /^[\p{L}\p{N}]/u;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): UsernameInvalidReason | null {
  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return "empty";
  }
  if (trimmed.length < 3) {
    return "too_short";
  }
  if (trimmed.length > 30) {
    return "too_long";
  }
  if (!ALLOWED.test(trimmed)) {
    return "bad_characters";
  }
  if (!STARTS_ALNUM.test(trimmed)) {
    return "must_start_alphanumeric";
  }
  return null;
}

export function displayUsername(username: string): string {
  return username.trim();
}
