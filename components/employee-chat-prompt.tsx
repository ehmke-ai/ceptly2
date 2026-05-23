"use client";

import {
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useStatsigClient } from "@statsig/react-bindings";
import { useMemo, useState } from "react";

import { commitSetupPlan } from "@/actions/conversation-setup";
import { sendChatMessage } from "@/actions/workspace-chat";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type {
  ChatAgentId,
  ConversationSetupPlan,
  SetupChatMessage,
} from "@/lib/api/types";

const setupSuggestions = [
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

const teamSuggestions = [
  {
    label: "Who's blocked?",
    icon: Users,
    prompt: "Is anyone blocked right now?",
  },
  {
    label: "Team pulse summary",
    icon: TrendingUp,
    prompt: "What did the team share in their most recent check-ins?",
  },
  {
    label: "Recurring blockers",
    icon: MessageCircleQuestion,
    prompt: "Are there any recurring blockers across the team?",
  },
];

const linearTeamSuggestions = [
  {
    label: "What is the team working on?",
    icon: TrendingUp,
    prompt: "What is each team member working on based on Linear and check-ins?",
  },
  {
    label: "Open Linear issues",
    icon: MessageCircleQuestion,
    prompt: "What open Linear issues are assigned to the team?",
  },
];

const AGENT_LABELS: Record<ChatAgentId, string> = {
  conversation_setup: "Scheduling",
  team_qa: "Team insights",
};

const AGENT_MENU_LABELS: Record<ChatAgentId | "auto", string> = {
  auto: "Auto",
  conversation_setup: "Scheduling",
  team_qa: "Team insights",
};

interface EmployeeChatPromptProps {
  workspaceId: string;
  canEdit?: boolean;
  linearConnected?: boolean;
}

function getEditableConversationIndex(plan: ConversationSetupPlan): number {
  const newIndex = plan.conversations.findIndex(
    (conversation) => !conversation.unchanged_from_existing,
  );
  if (newIndex >= 0) {
    return newIndex;
  }
  return Math.max(plan.conversations.length - 1, 0);
}

function updateProposalDays(
  plan: ConversationSetupPlan,
  days: number[],
): ConversationSetupPlan {
  const index = getEditableConversationIndex(plan);

  return {
    ...plan,
    conversations: plan.conversations.map((conversation, conversationIndex) =>
      conversationIndex === index
        ? {
            ...conversation,
            schedule: {
              ...conversation.schedule,
              frequency: "specific_days",
              days_of_week: days,
            },
          }
        : conversation,
    ),
  };
}

function getProposalDays(
  plan: ConversationSetupPlan,
  pickerDays?: number[],
): number[] {
  if (pickerDays && pickerDays.length > 0) {
    return pickerDays;
  }

  const conversation = plan.conversations[getEditableConversationIndex(plan)];
  return conversation?.schedule.days_of_week ?? [];
}

export function EmployeeChatPrompt({
  workspaceId,
  canEdit = true,
  linearConnected = false,
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
  const [activeAgent, setActiveAgent] = useState<ChatAgentId | null>(null);
  const [agentPreference, setAgentPreference] = useState<
    ChatAgentId | "auto"
  >("auto");

  const hasMessages = messages.length > 0 || chatPending;
  const isEmptyState = !hasMessages && !chatError;
  const chatDisabled = chatPending || publishPending || !canEdit;
  const isSetupAgent =
    activeAgent === "conversation_setup" || activeAgent === null;

  const pickerDays = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (
        message?.role === "assistant" &&
        message.ui_component?.type === "day_picker"
      ) {
        return message.ui_component.days_of_week;
      }
    }
    return undefined;
  }, [messages]);

  const publishDisabled = useMemo(() => {
    if (!proposal || publishPending || chatPending || activeAgent !== "conversation_setup") {
      return true;
    }

    return getProposalDays(proposal, pickerDays).length === 0;
  }, [proposal, publishPending, chatPending, pickerDays, activeAgent]);

  const suggestions = useMemo(() => {
    const linearAwareTeamSuggestions = linearConnected
      ? [...linearTeamSuggestions, ...teamSuggestions]
      : teamSuggestions;

    if (activeAgent === "team_qa") {
      return linearAwareTeamSuggestions;
    }
    if (activeAgent === "conversation_setup") {
      return setupSuggestions;
    }
    return [...setupSuggestions, ...linearAwareTeamSuggestions];
  }, [activeAgent, linearConnected]);

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
    setProposal(null);
    setPublishError(null);

    const agentToSend =
      agentPreference !== "auto"
        ? agentPreference
        : activeAgent ?? undefined;

    const result = await sendChatMessage(
      workspaceId,
      nextMessages,
      agentToSend,
    );

    setChatPending(false);

    if (result.error) {
      setChatError(result.error);
      return;
    }

    if (result.agent) {
      setActiveAgent(result.agent);
    }

    if (result.assistant_message) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: result.assistant_message,
          ui_component: result.ui_component ?? undefined,
        },
      ]);
    }

    if (result.agent === "conversation_setup" && result.proposal) {
      const daysFromPicker =
        result.ui_component?.type === "day_picker"
          ? result.ui_component.days_of_week
          : undefined;
      setProposal(
        daysFromPicker
          ? updateProposalDays(result.proposal, daysFromPicker)
          : result.proposal,
      );
    }
  }

  function handleDaysChange(messageIndex: number, days: number[]) {
    if (!proposal || interactiveDisabled()) {
      return;
    }

    const updatedProposal = updateProposalDays(proposal, days);
    setProposal(updatedProposal);
    setMessages((current) =>
      current.map((message, index) =>
        index === messageIndex && message.ui_component?.type === "day_picker"
          ? {
              ...message,
              ui_component: {
                ...message.ui_component,
                days_of_week: days,
              },
            }
          : message,
      ),
    );
  }

  function interactiveDisabled() {
    return chatDisabled || publishSuccess;
  }

  async function handlePublish() {
    if (!proposal || publishDisabled) {
      return;
    }

    const planToPublish = pickerDays
      ? updateProposalDays(proposal, pickerDays)
      : proposal;

    setPublishPending(true);
    setPublishError(null);
    setPublishSuccess(false);

    const result = await commitSetupPlan(workspaceId, planToPublish);

    setPublishPending(false);

    if (result.error) {
      setPublishError(result.error);
      return;
    }

    setProposal(null);
    setPublishSuccess(true);
  }

  function handleNewChat() {
    setMessages([]);
    setProposal(null);
    setInput("");
    setChatError(null);
    setPublishError(null);
    setPublishSuccess(false);
    setActiveAgent(null);
    setAgentPreference("auto");
    client.logEvent("employee_chat_refresh_click");
  }

  const agentBadgeLabel = activeAgent ? AGENT_LABELS[activeAgent] : null;

  const promptForm = (
    <form
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend(input);
      }}
    >
      {agentBadgeLabel ? (
        <div className="border-b border-border px-3 py-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {agentBadgeLabel}
          </Badge>
        </div>
      ) : null}
      <Textarea
        variant="chat"
        placeholder={
          linearConnected
            ? "Ask about your team, Linear issues, or describe a check-in schedule…"
            : "Ask about your team or describe a check-in schedule…"
        }
        rows={3}
        value={input}
        disabled={chatDisabled}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSend(input);
          }
        }}
      />
      <div className="flex items-center justify-between px-3 pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-muted-foreground"
                disabled={chatDisabled}
              />
            }
          >
            {AGENT_MENU_LABELS[agentPreference]}
            <ChevronDown className="size-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={agentPreference}
              onValueChange={(value) =>
                setAgentPreference(value as ChatAgentId | "auto")
              }
            >
              <DropdownMenuRadioItem value="auto">Auto</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="conversation_setup">
                Scheduling
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="team_qa">
                Team insights
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="submit"
          variant="default"
          size="icon-sm"
          className="rounded-full"
          disabled={!input.trim() || chatDisabled}
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
          <ChatMessageList
            messages={messages}
            pending={chatPending}
            onDaysChange={handleDaysChange}
            interactiveDisabled={interactiveDisabled()}
          />
        </div>
      ) : null}

      {chatError ? (
        <Alert variant="destructive">
          <AlertDescription>{chatError}</AlertDescription>
        </Alert>
      ) : null}

      {publishError ? (
        <Alert variant="destructive">
          <AlertDescription>{publishError}</AlertDescription>
        </Alert>
      ) : null}

      {proposal && !publishSuccess && isSetupAgent ? (
        <div className="flex flex-wrap items-center gap-3 px-1">
          <Button onClick={handlePublish} disabled={publishDisabled}>
            {publishPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Publishing…
              </>
            ) : (
              "Publish schedule"
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Or reply in chat if something needs to change.
          </p>
        </div>
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
