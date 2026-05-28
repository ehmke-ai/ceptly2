import Link from "next/link";

import { AdhocReachOutSummary } from "@/components/activity/adhoc-reach-out-summary";
import { Badge } from "@/components/ui/badge";
import type { ActivityAdhocSession } from "@/lib/api/types";

interface ActivityAdhocListProps {
  sessions: ActivityAdhocSession[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(
  status: ActivityAdhocSession["status"],
): "default" | "outline" | "secondary" {
  if (status === "completed") {
    return "default";
  }
  if (status === "in_progress") {
    return "secondary";
  }
  return "outline";
}

export function ActivityAdhocList({ sessions }: ActivityAdhocListProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recent reach-outs. Use Chat → Reach out to message someone in Slack.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border dark:divide-white/10 dark:border-white/10">
      {sessions.map((session) => (
        <li key={session.session_id}>
          <Link
            href={`/activity/${session.conversation_id}`}
            className="block px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <AdhocReachOutSummary
                  intentLabel={session.intent_label}
                  topic={session.topic}
                  deliveryFacts={session.delivery_facts}
                  agentPrompt={session.agent_prompt}
                  compact
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {session.member_name} · {formatTime(session.started_at)}
                </p>
              </div>
              <Badge
                variant={statusVariant(session.status)}
                className="shrink-0"
              >
                {session.status.replace("_", " ")}
              </Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
