import type { ScheduleFrequency } from "@/lib/api/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function isValidIanaTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function formatScheduleTimePreview(
  timeLocal: string,
  timezone: string,
): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeLocal);
  if (!match || !isValidIanaTimezone(timezone)) {
    return "Select a valid time and timezone";
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const hour12 = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  const minuteStr = String(minutes).padStart(2, "0");

  let timeZoneName = timezone;
  try {
    timeZoneName =
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "longGeneric",
      })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value ?? timezone;
  } catch {
    // keep raw timezone id
  }

  return `${hour12}:${minuteStr} ${period} ${timeZoneName}`;
}

export function formatScheduleDaysPreview(
  frequency: ScheduleFrequency,
  daysOfWeek: number[],
): string {
  if (frequency === "daily") {
    return "every day";
  }

  if (daysOfWeek.length === 0) {
    return "no days selected";
  }

  const labels = [...daysOfWeek]
    .sort((a, b) => a - b)
    .map((day) => DAY_LABELS[day] ?? String(day));

  return labels.join(", ");
}

export function formatSchedulePreview(
  timeLocal: string,
  timezone: string,
  frequency: ScheduleFrequency,
  daysOfWeek: number[],
  enabled: boolean,
): string {
  if (!enabled) {
    return "Check-ins are paused";
  }

  const timePreview = formatScheduleTimePreview(timeLocal, timezone);
  const daysPreview = formatScheduleDaysPreview(frequency, daysOfWeek);

  return `Check-ins will run at ${timePreview} on ${daysPreview}`;
}
