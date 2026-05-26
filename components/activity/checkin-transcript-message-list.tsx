"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type {
  ConversationRunLegacyResponse,
  ConversationRunTranscriptMessage,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface CheckinTranscriptMessageListProps {
  transcript?: ConversationRunTranscriptMessage[];
  legacyResponses?: ConversationRunLegacyResponse[];
  icDisplayName: string;
  className?: string;
}

function icFirstName(displayName: string): string {
  return displayName.split(/\s+/)[0] ?? displayName;
}

export function CheckinTranscriptMessageList({
  transcript = [],
  legacyResponses = [],
  icDisplayName,
  className,
}: CheckinTranscriptMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const icLabel = icFirstName(icDisplayName);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, legacyResponses]);

  if (transcript.length === 0 && legacyResponses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No messages yet. The conversation will appear here once Ceptly sends the
        opening message in Slack.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {transcript.map((message, index) => {
        const isIc = message.role === "user";

        return (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "flex gap-2.5",
              isIc ? "flex-row-reverse" : "flex-row",
            )}
          >
            {!isIc ? (
              <Avatar size="sm" className="mt-0.5">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Sparkles className="size-3.5" />
                </AvatarFallback>
              </Avatar>
            ) : null}

            <div
              className={cn(
                "flex max-w-[min(85%,32rem)] flex-col gap-2",
                isIc ? "items-end" : "items-start",
              )}
            >
              <span className="px-1 text-xs font-medium text-muted-foreground">
                {isIc ? icLabel : "Ceptly"}
              </span>

              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  isIc
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card text-card-foreground",
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        );
      })}

      {legacyResponses.map((response, index) => (
        <div key={`legacy-${index}`} className="flex flex-col gap-4">
          <div className="flex gap-2.5">
            <Avatar size="sm" className="mt-0.5">
              <AvatarFallback className="bg-primary/10 text-primary">
                <Sparkles className="size-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex max-w-[min(85%,32rem)] flex-col items-start gap-2">
              <span className="px-1 text-xs font-medium text-muted-foreground">
                Ceptly
              </span>
              <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground shadow-sm">
                <p className="whitespace-pre-wrap">
                  {response.question_prompt}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-row-reverse gap-2.5">
            <div className="flex max-w-[min(85%,32rem)] flex-col items-end gap-2">
              <span className="px-1 text-xs font-medium text-muted-foreground">
                {icLabel}
              </span>
              <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
                <p className="whitespace-pre-wrap">{response.answer_text}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
