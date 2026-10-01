const FORMATS = {
  kickoff: { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
  kickoffLong: {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  },
  clock: { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export type TimeFormat = keyof typeof FORMATS;

// Without `timeZone` this uses the runtime's zone: the visitor's in the browser,
// UTC in the container. Pass "UTC" for anything rendered on the server.
export function formatTime(iso: string, format: TimeFormat, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", { ...FORMATS[format], timeZone }).format(new Date(iso));
}
