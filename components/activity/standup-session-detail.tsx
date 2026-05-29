"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { fetchStandupSessionDetail } from "@/actions/standups";
import { CheckinTranscriptMessageList } from "@/components/activity/checkin-transcript-message-list";
import { Badge } from "@/components/ui/badge";
import type {
  StandupSessionDetail,
  StandupSessionSummary,
} from "@/lib/api/types";

interface StandupSessionDetailViewProps {
  workspaceId: string;
  standupId: string;
  sessions: StandupSessionSummary[];
  initialSession: StandupSessionDetail | null;
}

function formatLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StandupSessionDetailView({
  workspaceId,
  standupId,
  sessions,
  initialSession,
}: StandupSessionDetailViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    initialSession?.session_id ?? sessions[0]?.session_id ?? "",
  );
  const [detail, setDetail] = useState<StandupSessionDetail | null>(
    initialSession,
  );
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(
    initialSession?.session_id ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setError(null);
    if (sessionId === loadedSessionId && detail) {
      return;
    }
    setLoading(true);
    const result = await fetchStandupSessionDetail({
      workspaceId,
      standupId,
      sessionId,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDetail(result.session);
    setLoadedSessionId(sessionId);
  };

  useEffect(() => {
    const initialId = initialSession?.session_id ?? sessions[0]?.session_id;
    if (initialId && !loadedSessionId) {
      void handleSelect(initialId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load first session once
  }, []);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No standup sessions yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="standup-session-select" className="text-sm font-medium">
          Session
        </label>
        <select
          id="standup-session-select"
          value={selectedSessionId}
          onChange={(event) => void handleSelect(event.target.value)}
          className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {sessions.map((session) => (
            <option key={session.session_id} value={session.session_id}>
              {formatLabel(session.scheduled_fire_at)} ({session.status})
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading session…
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{detail.status}</Badge>
            <span className="text-sm text-muted-foreground">
              {formatLabel(detail.scheduled_fire_at)}
            </span>
          </div>

          {detail.summary_text ? (
            <div className="rounded-lg border border-border p-4 dark:border-white/10">
              <p className="text-sm font-medium">Summary</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {detail.summary_text}
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Thread</h2>
            <CheckinTranscriptMessageList
              standupMessages={detail.messages}
              icDisplayName={
                detail.participants[0]?.display_name ?? "Participant"
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
