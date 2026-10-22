import type { UsernameInvalidReason } from "./errors.ts";

const OHSU_EMAIL = /^[^\s@]+@ohsu\.edu$/iu;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): UsernameInvalidReason | null {
  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return "empty";
  }
  if (!OHSU_EMAIL.test(trimmed)) {
    return "not_ohsu_email";
  }
  return null;
}

export function displayUsername(username: string): string {
  return username.trim();
}
