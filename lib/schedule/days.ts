export const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

export function toggleDayInList(days: number[], day: number): number[] {
  return days.includes(day)
    ? days.filter((value) => value !== day)
    : [...days, day].sort((a, b) => a - b);
}

export function formatSelectedDays(days: number[]): string {
  return [...days]
    .sort((a, b) => a - b)
    .map(
      (day) =>
        DAY_OPTIONS.find((option) => option.value === day)?.label ??
        String(day),
    )
    .join(", ");
}
