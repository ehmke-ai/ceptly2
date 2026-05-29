import { snapScheduleTimeToInterval } from "./interval";

const TIME_LOCAL_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const QUARTER_HOUR_MINUTES = [0, 15, 30, 45] as const;
export const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export type SchedulePeriod = "AM" | "PM";

export interface ScheduleTimeParts {
  hour12: number;
  minute: (typeof QUARTER_HOUR_MINUTES)[number];
  period: SchedulePeriod;
}

export function parseTimeLocal24(timeLocal: string): ScheduleTimeParts {
  const normalized = snapScheduleTimeToInterval(timeLocal);
  const match = TIME_LOCAL_PATTERN.exec(normalized);
  const hours24 = match ? Number.parseInt(match[1] ?? "9", 10) : 9;
  const minute = match
    ? (Number.parseInt(match[2] ?? "0", 10) as ScheduleTimeParts["minute"])
    : 0;

  return {
    hour12: hours24 % 12 || 12,
    minute,
    period: hours24 >= 12 ? "PM" : "AM",
  };
}

export function toTimeLocal24(parts: ScheduleTimeParts): string {
  let hours24 = parts.hour12 % 12;
  if (parts.period === "PM") {
    hours24 += 12;
  }
  if (parts.period === "AM" && parts.hour12 === 12) {
    hours24 = 0;
  }
  if (parts.period === "PM" && parts.hour12 === 12) {
    hours24 = 12;
  }

  return `${String(hours24).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function formatTimeLocal12(timeLocal: string): string {
  const { hour12, minute, period } = parseTimeLocal24(timeLocal);
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatHour12Label(hour12: number): string {
  return String(hour12).padStart(2, "0");
}

export function formatMinuteLabel(minute: number): string {
  return String(minute).padStart(2, "0");
}
