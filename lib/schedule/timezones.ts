export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "Pacific/Honolulu", label: "Honolulu", region: "Americas" },
  { value: "America/Anchorage", label: "Anchorage", region: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles", region: "Americas" },
  { value: "America/Denver", label: "Denver", region: "Americas" },
  { value: "America/Chicago", label: "Chicago", region: "Americas" },
  { value: "America/New_York", label: "New York", region: "Americas" },
  { value: "America/Toronto", label: "Toronto", region: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City", region: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo", region: "Americas" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", region: "Americas" },
  { value: "Europe/London", label: "London", region: "Europe" },
  { value: "Europe/Paris", label: "Paris", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid", region: "Europe" },
  { value: "Europe/Rome", label: "Rome", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm", region: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw", region: "Europe" },
  { value: "Europe/Athens", label: "Athens", region: "Europe" },
  { value: "Asia/Dubai", label: "Dubai", region: "Asia & Pacific" },
  { value: "Asia/Kolkata", label: "India", region: "Asia & Pacific" },
  { value: "Asia/Singapore", label: "Singapore", region: "Asia & Pacific" },
  { value: "Asia/Tokyo", label: "Tokyo", region: "Asia & Pacific" },
  { value: "Asia/Seoul", label: "Seoul", region: "Asia & Pacific" },
  { value: "Australia/Sydney", label: "Sydney", region: "Asia & Pacific" },
  { value: "Pacific/Auckland", label: "Auckland", region: "Asia & Pacific" },
];

export const TIMEZONE_REGIONS = [
  "Americas",
  "Europe",
  "Asia & Pacific",
] as const;

export function groupTimezonesByRegion(): Record<string, TimezoneOption[]> {
  return TIMEZONE_REGIONS.reduce<Record<string, TimezoneOption[]>>(
    (acc, region) => {
      acc[region] = TIMEZONE_OPTIONS.filter((tz) => tz.region === region);
      return acc;
    },
    {},
  );
}
