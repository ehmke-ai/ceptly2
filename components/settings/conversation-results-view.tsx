"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  ConversationRunDetail,
  ConversationRunSummary,
} from "@/lib/api/types";

interface ConversationResultsViewProps {
  runs: ConversationRunSummary[];
  initialRun: ConversationRunDetail | null;
  onSelectRun: (runId: string) => Promise<ConversationRunDetail | null>;
}

function formatRunLabel(firedAt: string): string {
  return new Date(firedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MemberResponse({
  member,
}: {
  member: ConversationRunDetail["responded"][number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border dark:border-white/10">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="min-w-0">
          <p className="font-medium">{member.display_name}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline">{member.status}</Badge>
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border px-4 py-3 text-sm dark:border-white/10">
          {member.transcript?.map((message, index) => (
            <div key={index}>
              <p className="text-xs font-medium text-muted-foreground">
                {message.role === "user" ? member.display_name : "Ceptly"}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
          {member.legacy_responses?.map((response, index) => (
            <div key={index}>
              <p className="text-xs font-medium text-muted-foreground">
                Q: {response.question_prompt}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{response.answer_text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ConversationResultsView({
  runs,
  initialRun,
  onSelectRun,
}: ConversationResultsViewProps) {
  const [selectedRunId, setSelectedRunId] = useState(
    initialRun?.run_id ?? runs[0]?.run_id ?? "",
  );
  const [runDetail, setRunDetail] = useState<ConversationRunDetail | null>(
    initialRun,
  );
  const [loading, setLoading] = useState(false);

  const selectedSummary = useMemo(
    () => runs.find((run) => run.run_id === selectedRunId),
    [runs, selectedRunId],
  );

  const handleRunChange = async (runId: string) => {
    setSelectedRunId(runId);
    if (runId === initialRun?.run_id && runDetail?.run_id === runId) {
      return;
    }
    setLoading(true);
    const detail = await onSelectRun(runId);
    setRunDetail(detail);
    setLoading(false);
  };

  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No check-in runs yet. When the schedule fires, responses will appear
        here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="run-select" className="text-sm font-medium">
          Run
        </label>
        <select
          id="run-select"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedRunId}
          onChange={(event) => void handleRunChange(event.target.value)}
          disabled={loading}
        >
          {runs.map((run, index) => (
            <option key={run.run_id} value={run.run_id}>
              {index === 0 ? "Latest — " : ""}
              {formatRunLabel(run.fired_at)} ({run.responded_count}/
              {run.expected_count} responded)
            </option>
          ))}
        </select>
        {selectedSummary ? (
          <p className="text-sm text-muted-foreground">
            {selectedSummary.not_responded_count} missing
          </p>
        ) : null}
      </div>

      {loading || !runDetail ? (
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading run..." : "Select a run to view results."}
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              Responded ({runDetail.responded.length})
            </h2>
            {runDetail.responded.length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet.</p>
            ) : (
              <div className="space-y-2">
                {runDetail.responded.map((member) => (
                  <MemberResponse key={member.session_id} member={member} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              Not responded ({runDetail.not_responded.length})
            </h2>
            {runDetail.not_responded.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everyone assigned to this conversation responded.
              </p>
            ) : (
              <ul className="space-y-2">
                {runDetail.not_responded.map((member) => (
                  <li
                    key={member.roster_member_id}
                    className="rounded-lg border border-dashed border-border px-4 py-3 dark:border-white/10"
                  >
                    <p className="font-medium">{member.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
