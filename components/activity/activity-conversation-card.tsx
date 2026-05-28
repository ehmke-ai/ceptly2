import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityScheduledConversation } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";

interface ActivityConversationCardProps {
  conversation: ActivityScheduledConversation;
}

function formatRunDate(firedAt: string): string {
  return new Date(firedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityConversationCard({
  conversation,
}: ActivityConversationCardProps) {
  const schedulePreview = formatSchedulePreview(
    conversation.time_local,
    conversation.timezone,
    conversation.frequency,
    conversation.days_of_week,
    conversation.enabled,
  );
  const run = conversation.latest_run;
  const responded = run?.responded_count ?? 0;
  const expected = run?.expected_count ?? 0;
  const progress = expected > 0 ? Math.round((responded / expected) * 100) : 0;

  return (
    <Link href={`/activity/${conversation.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/30 dark:border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{conversation.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {conversation.summary?.trim() || schedulePreview}
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-4">
          {run ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Latest · {formatRunDate(run.fired_at)}
                </span>
                <span className="font-medium">
                  {responded}/{expected} responded
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {conversation.missing_members.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Waiting on{" "}
                  {conversation.missing_members
                    .map((member) => member.display_name)
                    .join(", ")}
                  {run.not_responded_count > conversation.missing_members.length
                    ? ` +${run.not_responded_count - conversation.missing_members.length} more`
                    : ""}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No check-in runs yet. Results will appear after the schedule
              fires.
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
