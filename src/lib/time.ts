export function addMinutesToTime(time: string, minutes: number): { time: string; nextDay: boolean } {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const nextDay = total >= 1440 || total < 0;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return { time: `${hh}:${mm}`, nextDay };
}
