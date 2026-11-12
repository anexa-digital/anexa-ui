// An instant (UTC, what APIs store) seen as a civil date and a clock in a time zone, and back. Daylight saving is
// handled by asking Intl for the zone's offset at that moment, twice, so a clock that falls in a gap or a fold
// resolves the way the zone does (the later offset wins in a gap, the earlier in a fold).

const partsFormats = new Map<string, Intl.DateTimeFormat>();
function partsFormat(timeZone: string): Intl.DateTimeFormat {
  let format = partsFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    partsFormats.set(timeZone, format);
  }
  return format;
}

function wallClock(date: Date, timeZone: string): { date: string; time: string; seconds: number } {
  const parts = partsFormat(timeZone).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, seconds: Number(get("second")) };
}

/** Minutes the zone is ahead of UTC at an instant (Bogotá: -300). */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const wall = wallClock(instant, timeZone);
  const asUtc = Date.UTC(Number(wall.date.slice(0, 4)), Number(wall.date.slice(5, 7)) - 1, Number(wall.date.slice(8, 10)), Number(wall.time.slice(0, 2)), Number(wall.time.slice(3, 5)), wall.seconds);
  return Math.round((asUtc - (instant.getTime() - instant.getMilliseconds())) / 60000);
}

/** The civil date ("YYYY-MM-DD") and clock ("HH:MM") of an instant in a zone; null when the instant is not valid. */
export function civilFromInstant(iso: string | null | undefined, timeZone: string): { date: string; time: string } | null {
  if (!iso) return null;
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;
  const { date, time } = wallClock(instant, timeZone);
  return { date, time };
}

/** The instant (ISO, UTC) of a civil date and clock in a zone; null when either is not well formed. */
export function instantFromCivil(date: string, time: string, timeZone: string): string | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!day || !clock) return null;
  const [hours, minutes] = [Number(clock[1]), Number(clock[2])];
  if (hours > 23 || minutes > 59) return null;
  const naive = Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]), hours, minutes);
  const first = naive - zoneOffsetMinutes(new Date(naive), timeZone) * 60000;
  const second = naive - zoneOffsetMinutes(new Date(first), timeZone) * 60000;
  return new Date(second).toISOString();
}
