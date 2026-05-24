"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { AgentActivityFeed } from "@/components/chat/agent-activity-feed";
import { ScheduleDaysPicker } from "@/components/settings/schedule-days-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AgentActivityState } from "@/lib/api/workspace-chat-stream";
import type { SetupChatMessage } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ChatMessageListProps {
  messages: SetupChatMessage[];
  pending?: boolean;
  pendingActivity?: AgentActivityState | null;
  className?: string;
  onDaysChange?: (messageIndex: number, days: number[]) => void;
  onMembersChange?: (messageIndex: number, memberIds: string[]) => void;
  interactiveDisabled?: boolean;
}

export function ChatMessageList({
  messages,
  pending = false,
  pendingActivity = null,
  className,
  onDaysChange,
  onMembersChange,
  interactiveDisabled = false,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, pendingActivity]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const dayPicker =
          !isUser && message.ui_component?.type === "day_picker"
            ? message.ui_component
            : null;
        const memberPicker =
          !isUser && message.ui_component?.type === "member_picker"
            ? message.ui_component
            : null;

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
                "flex max-w-[min(85%,32rem)] flex-col gap-2",
                isUser ? "items-end" : "items-start",
              )}
            >
              <span className="px-1 text-xs font-medium text-muted-foreground">
                {isUser ? "You" : "Ceptly"}
              </span>

              {!isUser && message.activity ? (
                <AgentActivityFeed activity={message.activity} />
              ) : null}

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

              {dayPicker ? (
                <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/20">
                  <ScheduleDaysPicker
                    daysOfWeek={dayPicker.days_of_week}
                    onChange={(days) => onDaysChange?.(index, days)}
                    disabled={interactiveDisabled}
                    showLabel={false}
                  />
                </div>
              ) : null}

              {memberPicker ? (
                <div className="w-full space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/20">
                  <p className="text-sm font-medium">Confirm who to message</p>
                  <div className="flex flex-col gap-2">
                    {memberPicker.members.map((member) => {
                      const selected = memberPicker.selected_member_ids.includes(
                        member.id,
                      );

                      return (
                        <button
                          key={member.id}
                          type="button"
                          disabled={interactiveDisabled}
                          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            const nextIds = selected
                              ? memberPicker.selected_member_ids.filter(
                                  (id) => id !== member.id,
                                )
                              : [
                                  ...new Set([
                                    ...memberPicker.selected_member_ids,
                                    member.id,
                                  ]),
                                ];
                            onMembersChange?.(index, nextIds);
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {member.display_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                          <Badge variant={selected ? "default" : "outline"}>
                            {selected ? "Selected" : "Select"}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {pending && pendingActivity ? (
        <div className="flex gap-2.5">
          <Avatar size="sm" className="mt-0.5">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex max-w-[min(85%,32rem)] flex-col gap-1">
            <span className="px-1 text-xs font-medium text-muted-foreground">
              Ceptly
            </span>
            <AgentActivityFeed activity={pendingActivity} />
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
