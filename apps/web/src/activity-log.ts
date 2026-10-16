import { appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { activityLine, type ActivityEvent } from "@bookclub/core";

export function activityLogPath(sqlitePath: string): string {
  return join(dirname(sqlitePath), "activity.log");
}

export function createActivityLog(
  filePath: string,
  write: (line: string) => void = (line) => {
    console.log(line);
  },
): (event: ActivityEvent) => void {
  return (event) => {
    const line = activityLine(new Date(), event);
    write(line);
    try {
      appendFileSync(filePath, `${line}\n`, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`Could not write the activity log: ${message}`);
    }
  };
}
