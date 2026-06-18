// Appointment times are stored as the studio's wall-clock time (the exact digits
// the user/customer picked), labeled UTC in the database. Read them back via UTC
// components so the displayed time always matches what was booked — regardless of
// the viewer's browser timezone. (A 09:30 booking must read 09:30 everywhere.)

export function wallTime(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

// Minutes since midnight (wall-clock) — used for vertical positioning in the calendar.
export function wallMinutes(ts: string): number {
  const d = new Date(ts);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
