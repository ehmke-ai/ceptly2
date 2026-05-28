import type { ConversationResultDestination } from "@/lib/api/types";
import type { SlackChannel } from "@/lib/api/slack-channels";

export function buildResultDestinations(input: {
  channelIds: string[];
  channels: SlackChannel[];
  rosterDmIds: string[];
}): ConversationResultDestination[] {
  const destinations: ConversationResultDestination[] = [];

  for (const channelId of input.channelIds) {
    const channel = input.channels.find((item) => item.id === channelId);
    destinations.push({
      type: "slack_channel",
      channel_id: channelId,
      ...(channel?.name ? { name: channel.name } : {}),
    });
  }

  for (const rosterMemberId of input.rosterDmIds) {
    destinations.push({
      type: "roster_dm",
      roster_member_id: rosterMemberId,
    });
  }

  return destinations;
}

export function parseResultDestinations(
  destinations: ConversationResultDestination[] | undefined,
): {
  channelIds: string[];
  rosterDmIds: string[];
  includeWorkspaceDigest: boolean;
} {
  const channelIds: string[] = [];
  const rosterDmIds: string[] = [];
  let includeWorkspaceDigest = false;

  for (const item of destinations ?? []) {
    if (item.type === "slack_channel") {
      channelIds.push(item.channel_id);
    } else if (item.type === "roster_dm") {
      rosterDmIds.push(item.roster_member_id);
    } else if (item.type === "workspace_digest") {
      includeWorkspaceDigest = true;
    }
  }

  return { channelIds, rosterDmIds, includeWorkspaceDigest };
}
