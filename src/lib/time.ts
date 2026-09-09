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
  return `${h}h ${String(m).padStart(2, "0")}`;
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
