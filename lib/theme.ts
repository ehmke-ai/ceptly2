export const THEME_COOKIE_NAME = "theme";

export type ThemePreference = "light" | "dark";

export const DEFAULT_THEME: ThemePreference = "dark";

export function parseThemeCookie(
  value: string | undefined,
): ThemePreference | undefined {
  if (value === "light" || value === "dark") {
    return value;
  }
  return undefined;
}

export function resolveTheme(value: string | undefined): ThemePreference {
  return parseThemeCookie(value) ?? DEFAULT_THEME;
}
