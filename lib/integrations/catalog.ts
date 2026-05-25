export interface KnownIntegration {
  id: string;
  name: string;
  description: string;
}

export const KNOWN_INTEGRATIONS: Record<string, KnownIntegration> = {
  slack: {
    id: "slack",
    name: "Slack",
    description:
      "Connect Ceptly to Slack for check-in DMs and Team insights search across your workspace history.",
  },
  linear: {
    id: "linear",
    name: "Linear",
    description:
      "Connect Linear so standup check-ins reference assigned issues (with links) and can update ticket status when someone finishes or starts work. Reconnect after upgrading to enable status updates.",
  },
};

export function resolveIntegration(
  integrationId: string,
  fromApi?: KnownIntegration | null,
): KnownIntegration | null {
  return fromApi ?? KNOWN_INTEGRATIONS[integrationId] ?? null;
}
