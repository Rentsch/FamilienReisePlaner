export function formatTripDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatDurationHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
}

// Parses durations like "5h30min", "5h 30", "5h", "45min" or a bare number of minutes.
export function parseDurationHM(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*(?:min|m)?)?$/i);
  if (!match || (!match[1] && !match[2])) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  const mins = match[2] ? Number(match[2]) : 0;
  return hours * 60 + mins;
}

export function addMinutesToTime(time: string, minutes: number): { time: string; nextDay: boolean } {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const nextDay = total >= 1440 || total < 0;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return { time: `${hh}:${mm}`, nextDay };
}
