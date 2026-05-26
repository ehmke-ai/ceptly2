import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  MessageSquareWarning,
} from "lucide-react";

import type { ActivityAttentionItem } from "@/lib/api/types";

interface ActivityAttentionListProps {
  items: ActivityAttentionItem[];
}

function attentionHref(item: ActivityAttentionItem): string {
  return `/activity/${item.conversation_id}`;
}

function AttentionIcon({ type }: { type: ActivityAttentionItem["type"] }) {
  if (type === "blocker") {
    return <AlertTriangle className="size-4 shrink-0 text-amber-500" />;
  }
  if (type === "missing_responses") {
    return <MessageSquareWarning className="size-4 shrink-0 text-orange-500" />;
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
  return `Reach out to ${item.member_name} · waiting for reply`;
}

function attentionDetail(item: ActivityAttentionItem): string | null {
  if (item.type === "blocker") {
    return item.excerpt;
  }
  if (item.type === "awaiting_reply") {
    return item.topic;
  }
  return null;
}

export function ActivityAttentionList({ items }: ActivityAttentionListProps) {
  if (items.length === 0) {
    return null;
  }

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
                : `missing-${item.conversation_id}-${item.run_id}`;

          return (
            <li key={`${key}-${index}`}>
              <Link
                href={attentionHref(item)}
                className="flex gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50 dark:border-white/10"
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}
