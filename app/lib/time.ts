const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type TimeFormat = "kickoff" | "kickoffLong" | "clock";

const pad = (n: number) => String(n).padStart(2, "0");

// Built by hand rather than with Intl: Node and browsers ship different ICU
// data ("Sat, 3 Oct" vs "Sat 3 Oct", "Sep" vs "Sept"), and the UTC text must
// be identical on both sides of hydration.
//
// `utc` false uses the runtime's zone: the visitor's in the browser.
export function formatTime(iso: string, format: TimeFormat, utc: boolean): string {
  const d = new Date(iso);
  const [weekday, day, month, year, hours, minutes] = utc
    ? [d.getUTCDay(), d.getUTCDate(), d.getUTCMonth(), d.getUTCFullYear(), d.getUTCHours(), d.getUTCMinutes()]
    : [d.getDay(), d.getDate(), d.getMonth(), d.getFullYear(), d.getHours(), d.getMinutes()];
  const clock = `${pad(hours)}:${pad(minutes)}`;
  if (format === "clock") return clock;
  const date = `${WEEKDAYS[weekday]} ${day} ${MONTHS[month]}`;
  return format === "kickoffLong" ? `${date} ${year}, ${clock}` : `${date}, ${clock}`;
}
