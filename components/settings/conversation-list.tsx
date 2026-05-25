"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { removeConversation } from "@/actions/conversations";
import { ConversationRecipientsToggle } from "@/components/settings/conversation-recipients-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RosterMember } from "@/lib/api/roster";
import type { ScheduledConversation } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";

interface ConversationListProps {
  conversations: ScheduledConversation[];
  workspaceId: string;
  rosterMembers: RosterMember[];
  canEdit: boolean;
}

export function ConversationList({
  conversations,
  workspaceId,
  rosterMembers,
  canEdit,
}: ConversationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canDeleteAny = conversations.length > 1;

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No scheduled conversations yet.{" "}
        {canEdit ? (
          <Link
            href="/settings/conversations/new"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Add a conversation
          </Link>
        ) : null}
        {canEdit ? " or " : null}
        <Link
          href="/chat"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          describe check-ins on the home page
        </Link>
        .
      </p>
    );
  }

  const handleDelete = (conversationId: string) => {
    if (!canDeleteAny) {
      return;
    }

    if (confirmDeleteId !== conversationId) {
      setConfirmDeleteId(conversationId);
      setError(null);
      return;
    }

    setDeletingId(conversationId);
    setError(null);

    startTransition(async () => {
      const result = await removeConversation({
        workspaceId,
        conversationId,
      });

      if (result.error) {
        setError(result.error);
        setDeletingId(null);
        setConfirmDeleteId(null);
        return;
      }

      setConfirmDeleteId(null);
      setDeletingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {conversations.map((conversation) => {
        const isDeleting = deletingId === conversation.id;
        const isConfirmingDelete = confirmDeleteId === conversation.id;
        const schedulePreview = formatSchedulePreview(
          conversation.time_local,
          conversation.timezone,
          conversation.frequency,
          conversation.days_of_week,
          conversation.enabled,
        );
        const summary =
          conversation.summary?.trim() ||
          schedulePreview;

        return (
          <Card key={conversation.id} className="dark:border-white/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/settings/conversations/${conversation.id}`}
                  className="min-w-0 flex-1 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CardTitle className="text-lg">{conversation.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {summary}
                  </CardDescription>
                </Link>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {!conversation.enabled ? (
                    <Badge variant="outline">Paused</Badge>
                  ) : null}
                  {canEdit ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/settings/conversations/${conversation.id}/edit`}
                          />
                        }
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      {canDeleteAny ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(conversation.id)}
                          disabled={isPending && isDeleting}
                        >
                          {isPending && isDeleting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                          Delete
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <div className="border-t px-6 py-3 dark:border-white/10">
              <ConversationRecipientsToggle
                rosterMemberIds={conversation.roster_member_ids}
                rosterMembers={rosterMembers}
              />
            </div>

            {isConfirmingDelete ? (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertDescription className="space-y-3">
                    <p>
                      Delete{" "}
                      <span className="font-medium">{conversation.name}</span>?
                      This cannot be undone.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(conversation.id)}
                        disabled={isPending}
                      >
                        {isPending && isDeleting ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, delete"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}
          </Card>
        );
      })}

      {!canEdit ? (
        <p className="text-sm text-muted-foreground">
          Only founders and admins can edit or delete conversations.
        </p>
      ) : null}

      {canEdit && !canDeleteAny ? (
        <p className="text-sm text-muted-foreground">
          You need at least one scheduled conversation. Create another before
          deleting this one.
        </p>
      ) : null}
    </div>
  );
}
