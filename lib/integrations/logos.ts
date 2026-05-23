export type IntegrationLogo =
  | string
  | {
      light: string;
      dark: string;
    };

export const INTEGRATION_LOGOS: Record<string, IntegrationLogo> = {
  slack: "/integrations/slack.png",
  linear: {
    light: "/integrations/linear-dark.png",
    dark: "/integrations/linear-light.png",
  },
};

export function getIntegrationLogo(
  integrationId: string,
  theme: "light" | "dark" = "light",
): string | null {
  const logo = INTEGRATION_LOGOS[integrationId];
  if (!logo) {
    return null;
  }

  if (typeof logo === "string") {
    return logo;
  }

  return theme === "dark" ? logo.dark : logo.light;
}
