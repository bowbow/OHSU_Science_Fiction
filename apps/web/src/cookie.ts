const COOKIE = "bookclub_session";
const MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

export function readSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) {
      const value = rest.join("=");
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

export function sessionCookie(sessionId: string, secure: boolean): string {
  return `${COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? "; Secure" : ""}`;
}
