import "server-only";

export type ServerLogLevel = "info" | "warn" | "error";

function sanitize(value: string): string {
  return value
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/((?:password|token|secret|authorization|cookie|database_url)\s*[:=]\s*)[^\s,;"']+/gi, "$1[REDACTED]");
}

export function logServerEvent(
  level: ServerLogLevel,
  event: string,
  details: Record<string, unknown> = {}
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "nusantara-card",
    event,
    ...details,
  };
  const line = sanitize(JSON.stringify(entry));
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
