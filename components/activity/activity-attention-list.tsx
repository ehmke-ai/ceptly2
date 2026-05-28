"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  AlertTriangle,
  Clock,
  MailWarning,
  MessageSquareWarning,
  X,
} from "lucide-react";

import { dismissActivityAttentionAction } from "@/actions/activity";
import { Button } from "@/components/ui/button";
import type { ActivityAttentionItem } from "@/lib/api/types";

interface ActivityAttentionListProps {
  workspaceId: string;
  items: ActivityAttentionItem[];
}

function attentionHref(item: ActivityAttentionItem): string {
  if (item.type === "roster_tracker_mismatch") {
    return "/team";
  }
  return `/activity/${item.conversation_id}`;
}

function formatMissingTrackers(trackers: ("linear" | "jira")[]): string {
  const labels = trackers.map((tracker) =>
    tracker === "linear" ? "Linear" : "Jira",
  );
  if (labels.length === 2) {
    return "Linear or Jira";
  }
  return labels[0] ?? "issue tracker";
}

function AttentionIcon({ type }: { type: ActivityAttentionItem["type"] }) {
  if (type === "blocker") {
    return <AlertTriangle className="size-4 shrink-0 text-amber-500" />;
  }
  if (type === "missing_responses") {
    return <MessageSquareWarning className="size-4 shrink-0 text-orange-500" />;
  }
  if (type === "roster_tracker_mismatch") {
    return <MailWarning className="size-4 shrink-0 text-orange-500" />;
  }
  return <Clock className="size-4 shrink-0 text-muted-foreground" />;
}

function attentionLabel(item: ActivityAttentionItem): string {
  if (item.type === "missing_responses") {
    const names =
      item.missing_names.length > 0
        ? item.missing_names.join(", ")
        : `${item.missing_count} people`;
    return `${item.conversation_name} · ${item.missing_count} haven't responded (${names})`;
  }
  if (item.type === "blocker") {
    return `${item.member_name} reported a blocker in ${item.conversation_name}`;
  }
  if (item.type === "roster_tracker_mismatch") {
    return `${item.member_name} · no ${formatMissingTrackers(item.missing_trackers)} account matches ${item.member_email}`;
  }
  return `Reach out to ${item.member_name} · waiting for reply`;
}

function attentionDetail(item: ActivityAttentionItem): string | null {
  if (item.type === "blocker") {
    return item.excerpt;
  }
  if (item.type === "awaiting_reply") {
    return item.topic;
  }
  if (item.type === "roster_tracker_mismatch") {
    return `Use the same email in Slack and ${formatMissingTrackers(item.missing_trackers)}. Update the roster email on Team or fix the email in your issue tracker.`;
  }
  return null;
}

function isDismissible(item: ActivityAttentionItem): item is Extract<
  ActivityAttentionItem,
  { type: "roster_tracker_mismatch" }
> {
  return item.type === "roster_tracker_mismatch";
}

export function ActivityAttentionList({
  workspaceId,
  items,
}: ActivityAttentionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return null;
  }

  const handleDismiss = (
    item: Extract<ActivityAttentionItem, { type: "roster_tracker_mismatch" }>,
  ) => {
    startTransition(async () => {
      const result = await dismissActivityAttentionAction({
        workspaceId,
        itemType: "roster_tracker_mismatch",
        itemKey: item.roster_member_id,
      });

      if (result.error) {
        console.error(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Needs attention</h2>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const detail = attentionDetail(item);
          const key =
            item.type === "blocker"
              ? `blocker-${item.session_id}`
              : item.type === "awaiting_reply"
                ? `awaiting-${item.session_id}`
                : item.type === "roster_tracker_mismatch"
                  ? `tracker-mismatch-${item.roster_member_id}`
                  : `missing-${item.conversation_id}-${item.run_id}`;

          return (
            <li key={`${key}-${index}`}>
              <div className="flex items-start gap-2 rounded-lg border border-border px-4 py-3 dark:border-white/10">
                <Link
                  href={attentionHref(item)}
                  className="flex min-w-0 flex-1 gap-3 transition-colors hover:opacity-80"
                >
                  <AttentionIcon type={item.type} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{attentionLabel(item)}</p>
                    {detail ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ) : null}
                  </div>
                </Link>
                {isDismissible(item) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    disabled={isPending}
                    aria-label={`Dismiss alert for ${item.member_name}`}
                    onClick={() => handleDismiss(item)}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
