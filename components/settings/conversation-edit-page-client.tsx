"use client";

import { useRouter } from "next/navigation";

import { ConversationEditForm } from "@/components/settings/conversation-edit-form";
import type { RosterMember } from "@/lib/api/roster";
import type { AppContextOption, ScheduledConversation } from "@/lib/api/types";

interface ConversationEditPageClientProps {
  conversation: ScheduledConversation;
  workspaceId: string;
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
}

export function ConversationEditPageClient({
  conversation,
  workspaceId,
  rosterMembers,
  appContextOptions,
}: ConversationEditPageClientProps) {
  const router = useRouter();

  return (
    <ConversationEditForm
      conversation={conversation}
      workspaceId={workspaceId}
      rosterMembers={rosterMembers}
      appContextOptions={appContextOptions}
      onCancel={() => router.push("/settings/conversations")}
      onSaved={() => {
        router.push(`/settings/conversations/${conversation.id}`);
        router.refresh();
      }}
    />
  );
}
