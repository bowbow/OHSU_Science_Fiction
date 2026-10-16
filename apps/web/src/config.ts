export type WebConfig = {
  sqlitePath: string;
  publicBaseUrl: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WebConfig {
  return {
    sqlitePath: env.BOOKCLUB_SQLITE_PATH ?? "data/bookclub.sqlite",
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  };
}
