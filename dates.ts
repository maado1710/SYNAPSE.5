// Calendar-day keys in the learner's LOCAL time zone.
// (The old versions used toISOString(), which is UTC, so streaks and the daily
// goal rolled over at UTC midnight instead of the learner's midnight.)

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(date = new Date()) {
  return dayKey(date);
}

export function yesterdayKey(date = new Date()) {
  // Building from y/m/d keeps this correct across DST changes.
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
}
