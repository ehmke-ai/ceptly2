"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { SetupChatMessage } from "@/lib/api/types";

interface ChatMessageListProps {
  messages: SetupChatMessage[];
  pending?: boolean;
  className?: string;
}

export function ChatMessageList({
  messages,
  pending = false,
  className,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {messages.map((message, index) => {
        const isUser = message.role === "user";

        return (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "flex gap-2.5",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            {!isUser ? (
              <Avatar size="sm" className="mt-0.5">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Sparkles className="size-3.5" />
                </AvatarFallback>
              </Avatar>
            ) : null}

            <div
              className={cn(
                "flex max-w-[min(85%,32rem)] flex-col gap-1",
                isUser ? "items-end" : "items-start",
              )}
            >
              <span className="px-1 text-xs font-medium text-muted-foreground">
                {isUser ? "You" : "Ceptly"}
              </span>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  isUser
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

      {pending ? (
        <div className="flex gap-2.5">
          <Avatar size="sm" className="mt-0.5">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="px-1 text-xs font-medium text-muted-foreground">
              Ceptly
            </span>
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              Thinking…
            </div>
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
