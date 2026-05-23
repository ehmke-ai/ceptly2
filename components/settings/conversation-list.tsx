"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { removeConversation } from "@/actions/conversations";
import { ConversationEditForm } from "@/components/settings/conversation-edit-form";
import { ConversationIcPreview } from "@/components/settings/conversation-ic-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ScheduledConversation } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";

interface ConversationListProps {
  conversations: ScheduledConversation[];
  workspaceId: string;
  canEdit: boolean;
}

export function ConversationList({
  conversations,
  workspaceId,
  canEdit,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
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
        <Link
          href="/chat"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Describe your check-ins on the home page
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
      setEditingId((current) =>
        current === conversationId ? null : current,
      );
      router.refresh();
    });
  };

  const handleSaved = () => {
    setEditingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {conversations.map((conversation) => {
        const isEditing = editingId === conversation.id;
        const isDeleting = deletingId === conversation.id;
        const isConfirmingDelete = confirmDeleteId === conversation.id;
        const schedulePreview = formatSchedulePreview(
          conversation.time_local,
          conversation.timezone,
          conversation.frequency,
          conversation.days_of_week,
          conversation.enabled,
        );
        const enabledQuestions =
          conversation.questions?.filter((question) => question.enabled) ?? [];
        const sortedQuestions = [...(conversation.questions ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        );

        return (
          <Card key={conversation.id} className="dark:border-white/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">{conversation.name}</CardTitle>
                  {!isEditing ? (
                    <CardDescription className="mt-1">
                      {schedulePreview}
                    </CardDescription>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {!conversation.enabled ? (
                    <Badge variant="outline">Paused</Badge>
                  ) : null}
                  {canEdit && !isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(conversation.id);
                          setConfirmDeleteId(null);
                          setError(null);
                        }}
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

            <CardContent className="space-y-4">
              {isConfirmingDelete ? (
                <Alert variant="destructive">
                  <AlertDescription className="space-y-3">
                    <p>
                      Delete <span className="font-medium">{conversation.name}</span>?
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
              ) : null}

              {isEditing ? (
                <ConversationEditForm
                  conversation={conversation}
                  workspaceId={workspaceId}
                  onCancel={() => setEditingId(null)}
                  onSaved={handleSaved}
                />
              ) : (
                <>
                  <p className="text-sm">
                    {enabledQuestions.length} question
                    {enabledQuestions.length === 1 ? "" : "s"} enabled
                  </p>

                  {sortedQuestions.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {sortedQuestions.map((question) => (
                        <li
                          key={question.id}
                          className={question.enabled ? "" : "opacity-60"}
                        >
                          {question.prompt_text}
                          {!question.enabled ? " (disabled)" : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <ConversationIcPreview
                    name={conversation.name}
                    questions={sortedQuestions}
                  />
                </>
              )}
            </CardContent>
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
