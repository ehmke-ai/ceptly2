"use client";

import { useEffect, useState } from "react";

import { AdhocReachOutSummary } from "@/components/activity/adhoc-reach-out-summary";
import { CheckinTranscriptMessageList } from "@/components/activity/checkin-transcript-message-list";
import { Badge } from "@/components/ui/badge";
import { fetchConversationSessionDetail } from "@/actions/conversation-sessions";
import type {
  ConversationRunRespondedMember,
  ConversationSessionSummary,
} from "@/lib/api/types";

interface ConversationSessionsClientProps {
  workspaceId: string;
  conversationId: string;
  sessions: ConversationSessionSummary[];
  initialSession?: ConversationRunRespondedMember | null;
}

function formatSessionLabel(startedAt: string): string {
  return new Date(startedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationSessionsClient({
  workspaceId,
  conversationId,
  sessions,
  initialSession = null,
}: ConversationSessionsClientProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    initialSession?.session_id ?? sessions[0]?.session_id ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(
    initialSession?.session_id ?? null,
  );
  const [sessionDetail, setSessionDetail] =
    useState<ConversationRunRespondedMember | null>(initialSession);

  const handleSessionChange = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    if (sessionId === loadedSessionId && sessionDetail) {
      return;
    }
    setLoading(true);
    const result = await fetchConversationSessionDetail({
      workspaceId,
      conversationId,
      sessionId,
    });
    setSessionDetail(result.session);
    setLoadedSessionId(sessionId);
    setLoading(false);
  };

  useEffect(() => {
    const initialId = initialSession?.session_id ?? sessions[0]?.session_id;
    if (initialId && !loadedSessionId) {
      void handleSessionChange(initialId);
    }
    // Only bootstrap the first session once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reach-out sessions yet. Start a conversation from Chat to message
        someone in Slack.
      </p>
    );
  }

  const selectedSummary = sessions.find(
    (session) => session.session_id === selectedSessionId,
  );

  return (
    <div className="space-y-8">
      {sessions.length > 1 ? (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="session-select" className="text-sm font-medium">
            Session
          </label>
          <select
            id="session-select"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedSessionId}
            onChange={(event) => void handleSessionChange(event.target.value)}
            disabled={loading}
          >
            {sessions.map((session, index) => (
              <option key={session.session_id} value={session.session_id}>
                {index === 0 ? "Latest — " : ""}
                {session.display_name} · {formatSessionLabel(session.started_at)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {selectedSummary ? (
        <>
          <section className="space-y-4 rounded-lg border border-border px-4 py-4 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{selectedSummary.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSummary.email}
                </p>
              </div>
              <Badge variant="outline">{selectedSummary.status}</Badge>
            </div>

            <AdhocReachOutSummary
              intentLabel={selectedSummary.intent_label}
              topic={selectedSummary.topic}
              deliveryFacts={selectedSummary.delivery_facts}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Conversation</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading conversation...
              </p>
            ) : sessionDetail ? (
              <CheckinTranscriptMessageList
                transcript={sessionDetail.transcript}
                legacyResponses={sessionDetail.legacy_responses}
                icDisplayName={sessionDetail.display_name}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not load the conversation.
              </p>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a session to view details.
        </p>
      )}
    </div>
  );
}
