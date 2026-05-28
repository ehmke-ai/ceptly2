"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdhocReachOutSummary } from "@/components/activity/adhoc-reach-out-summary";
import { CheckinTranscriptMessageList } from "@/components/activity/checkin-transcript-message-list";
import {
  abandonConversationSessionAction,
  fetchConversationSessionDetail,
} from "@/actions/conversation-sessions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  sessions: initialSessions,
  initialSession = null,
}: ConversationSessionsClientProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSessionId, setSelectedSessionId] = useState(
    initialSession?.session_id ?? initialSessions[0]?.session_id ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(
    initialSession?.session_id ?? null,
  );
  const [sessionDetail, setSessionDetail] =
    useState<ConversationRunRespondedMember | null>(initialSession);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [abandonError, setAbandonError] = useState<string | null>(null);
  const [isAbandoning, startAbandonTransition] = useTransition();

  const handleSessionChange = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setConfirmAbandon(false);
    setAbandonError(null);
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

  const handleAbandon = () => {
    if (!selectedSummary || selectedSummary.status !== "in_progress") {
      return;
    }

    if (!confirmAbandon) {
      setConfirmAbandon(true);
      setAbandonError(null);
      return;
    }

    setAbandonError(null);
    startAbandonTransition(async () => {
      const result = await abandonConversationSessionAction({
        workspaceId,
        conversationId,
        sessionId: selectedSummary.session_id,
      });

      if (result.error) {
        setAbandonError(result.error);
        setConfirmAbandon(false);
        return;
      }

      setSessions((current) =>
        current.map((session) =>
          session.session_id === selectedSummary.session_id
            ? { ...session, status: "abandoned" as const }
            : session,
        ),
      );
      setSessionDetail((current) =>
        current && current.session_id === selectedSummary.session_id
          ? { ...current, status: "abandoned" }
          : current,
      );
      setConfirmAbandon(false);
      router.refresh();
    });
  };

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
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{selectedSummary.status}</Badge>
                {selectedSummary.status === "in_progress" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAbandon}
                    disabled={isAbandoning}
                  >
                    {isAbandoning ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    Abandon
                  </Button>
                ) : null}
              </div>
            </div>

            {confirmAbandon ? (
              <Alert variant="destructive">
                <AlertDescription className="space-y-3">
                  <p>
                    Abandon this check-in? Ceptly will stop following up in
                    Slack.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleAbandon}
                      disabled={isAbandoning}
                    >
                      {isAbandoning ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Abandoning...
                        </>
                      ) : (
                        "Yes, abandon"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmAbandon(false)}
                      disabled={isAbandoning}
                    >
                      Cancel
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            {abandonError ? (
              <Alert variant="destructive">
                <AlertDescription>{abandonError}</AlertDescription>
              </Alert>
            ) : null}

            <AdhocReachOutSummary
              intentLabel={selectedSummary.intent_label}
              topic={selectedSummary.topic}
              deliveryFacts={selectedSummary.delivery_facts}
              agentPrompt={selectedSummary.agent_prompt}
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
