"use client";

import {
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useStatsigClient } from "@statsig/react-bindings";
import { useState } from "react";

import {
  commitSetupPlan,
  sendSetupMessage,
} from "@/actions/conversation-setup";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ConversationSetupProposal } from "@/components/settings/conversation-setup-proposal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ConversationSetupPlan, SetupChatMessage } from "@/lib/api/types";

const suggestions = [
  {
    label: "Mon & Thu sprint check-in",
    icon: CalendarDays,
    prompt:
      "Mon and Thu at 9am — ask about sprint progress, what they shipped, and blockers.",
  },
  {
    label: "Friday team pulse",
    icon: TrendingUp,
    prompt:
      "Friday at 4pm — quick team energy pulse and anything to flag before the weekend.",
  },
  {
    label: "Daily standup topics",
    icon: MessageCircleQuestion,
    prompt:
      "Every weekday at 9am — short standup: priorities today, progress since yesterday, blockers.",
  },
];

interface EmployeeChatPromptProps {
  workspaceId: string;
  canEdit?: boolean;
}

export function EmployeeChatPrompt({
  workspaceId,
  canEdit = true,
}: EmployeeChatPromptProps) {
  const { client } = useStatsigClient();

  const [messages, setMessages] = useState<SetupChatMessage[]>([]);
  const [proposal, setProposal] = useState<ConversationSetupPlan | null>(null);
  const [input, setInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [publishPending, setPublishPending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const hasMessages = messages.length > 0 || chatPending;
  const isEmptyState = !hasMessages && !proposal && !chatError;

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (!trimmed || chatPending || !canEdit) {
      return;
    }

    client.logEvent("employee_chat_submit");

    const nextMessages: SetupChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setChatPending(true);
    setChatError(null);
    setPublishSuccess(false);

    const result = await sendSetupMessage(workspaceId, nextMessages);

    setChatPending(false);

    if (result.error) {
      setChatError(result.error);
      return;
    }

    if (result.assistant_message) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: result.assistant_message },
      ]);
    }

    if (result.proposal) {
      setProposal(result.proposal);
    }
  }

  async function handlePublish() {
    if (!proposal) {
      return;
    }

    setPublishPending(true);
    setPublishError(null);
    setPublishSuccess(false);

    const result = await commitSetupPlan(workspaceId, proposal);

    setPublishPending(false);

    if (result.error) {
      setPublishError(result.error);
      return;
    }

    setPublishSuccess(true);
  }

  function handleNewChat() {
    setMessages([]);
    setProposal(null);
    setInput("");
    setChatError(null);
    setPublishError(null);
    setPublishSuccess(false);
    client.logEvent("employee_chat_refresh_click");
  }

  const promptForm = (
    <form
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend(input);
      }}
    >
      <Textarea
        variant="chat"
        placeholder="Describe your check-in schedule and questions…"
        rows={3}
        value={input}
        disabled={chatPending}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSend(input);
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
          type="submit"
          variant="default"
          size="icon-sm"
          className="rounded-full"
          disabled={!input.trim() || chatPending}
          aria-label="Send message"
        >
          {chatPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ArrowUp />
          )}
        </Button>
      </div>
    </form>
  );

  const suggestionChips = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {suggestions.map(({ label, icon: Icon, prompt }) => (
        <Badge
          key={label}
          variant="outline"
          className="h-8 cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition-colors hover:bg-muted"
          onClick={() => {
            client.logEvent("employee_chat_suggestion_click", label);
            void handleSend(prompt);
          }}
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
        aria-label="Start new conversation"
        onClick={handleNewChat}
      >
        <RefreshCw />
      </Button>
    </div>
  );

  if (!canEdit) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Check-in schedules are managed by your workspace admin. View the
          current schedule in{" "}
          <Link
            href="/settings/conversations"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Settings
          </Link>
          .
        </p>
      </div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="flex w-full flex-1 flex-col justify-center gap-4">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What can I do for you?
        </h1>
        {promptForm}
        {suggestionChips}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      {hasMessages ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
          <ChatMessageList messages={messages} pending={chatPending} />
        </div>
      ) : null}

      {chatError ? (
        <Alert variant="destructive">
          <AlertDescription>{chatError}</AlertDescription>
        </Alert>
      ) : null}

      {proposal ? (
        <ConversationSetupProposal
          proposal={proposal}
          onPublish={handlePublish}
          publishing={publishPending}
          publishError={publishError}
          publishSuccess={publishSuccess}
        />
      ) : null}

      {publishSuccess ? (
        <p className="text-center text-sm text-muted-foreground">
          Schedule published.{" "}
          <Link
            href="/settings/conversations"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            View in Settings
          </Link>
        </p>
      ) : null}

      {promptForm}
      {suggestionChips}
    </div>
  );
}
