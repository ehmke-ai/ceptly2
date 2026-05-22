"use client";

import {
  CalendarDays,
  ChevronDown,
  MessageCircleQuestion,
  Mic,
  RefreshCw,
  TrendingUp,
  UserX,
} from "lucide-react";
import { useStatsigClient } from "@statsig/react-bindings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const suggestions = [
  { label: "Who is blocked?", icon: UserX },
  { label: "Team morale trend", icon: TrendingUp },
  { label: "Sprint progress", icon: CalendarDays },
  { label: "Open questions", icon: MessageCircleQuestion },
];

export function EmployeeChatPrompt() {
  const { client } = useStatsigClient();

  return (
    <div className="flex w-full flex-col gap-4">
      <form
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20"
        onSubmit={(event) => {
          event.preventDefault();
          client.logEvent("employee_chat_submit");
        }}
      >
        <Textarea
          variant="chat"
          placeholder="Ask about your team..."
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-muted-foreground"
            tabIndex={-1}
            aria-hidden
          >
            Ceptly AI
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon-sm"
            className="rounded-full"
            tabIndex={-1}
            aria-hidden
            onClick={() => client.logEvent("employee_chat_mic_click")}
          >
            <Mic />
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.map(({ label, icon: Icon }) => (
          <Badge
            key={label}
            variant="outline"
            className="h-8 cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal"
            onClick={() =>
              client.logEvent("employee_chat_suggestion_click", label)
            }
          >
            <Icon />
            {label}
          </Badge>
        ))}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-full"
          tabIndex={-1}
          aria-hidden
          onClick={() => client.logEvent("employee_chat_refresh_click")}
        >
          <RefreshCw />
        </Button>
      </div>
    </div>
  );
}
