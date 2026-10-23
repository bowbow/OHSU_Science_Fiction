export type WebConfig = {
  sqlitePath: string;
  publicBaseUrl: string;
  initializeDatabase: boolean;
  googleBooksApiKey: string | null;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WebConfig {
  return {
    sqlitePath: env.BOOKCLUB_SQLITE_PATH ?? "data/bookclub.sqlite",
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    initializeDatabase: booleanSetting(env.BOOKCLUB_INITIALIZE_DATABASE, true),
    googleBooksApiKey: optionalSetting(env.GOOGLE_BOOKS_API_KEY),
  };
}

function optionalSetting(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function booleanSetting(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === "") {
    return defaultValue;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error("BOOKCLUB_INITIALIZE_DATABASE must be 'true' or 'false'.");
}
