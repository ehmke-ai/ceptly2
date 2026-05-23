"use client";

import { SlackIntegrationPanel } from "@/components/settings/integrations/slack-integration-panel";
import type { SlackConnectionStatus } from "@/lib/api/slack";

interface SlackConnectionCardProps {
  workspaceId: string;
  canEdit: boolean;
  status: SlackConnectionStatus;
  showConnectedAlert?: boolean;
  showErrorAlert?: boolean;
}

export function SlackConnectionCard({
  workspaceId,
  canEdit,
  status,
  showConnectedAlert = false,
  showErrorAlert = false,
}: SlackConnectionCardProps) {
  return (
    <SlackIntegrationPanel
      workspaceId={workspaceId}
      canEdit={canEdit}
      status={status}
      description="Connect Ceptly to Slack so check-ins run in DMs for your team."
      showConnectedAlert={showConnectedAlert}
      showErrorAlert={showErrorAlert}
    />
  );
}
