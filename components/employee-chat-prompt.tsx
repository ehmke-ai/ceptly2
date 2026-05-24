"use client";

import {
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Loader2,
  MessageCircle,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useStatsigClient } from "@statsig/react-bindings";
import { useMemo, useState } from "react";

import {
  abandonActiveCheckinAction,
  commitAdhocConversationAction,
} from "@/actions/adhoc-conversation";
import { ACTIVE_CHECKIN_IN_PROGRESS_ERROR } from "@/lib/api/adhoc-conversation";
import { commitSetupPlan } from "@/actions/conversation-setup";
import { AdhocConversationProposalCard } from "@/components/chat/adhoc-conversation-proposal";
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
  AdhocConversationProposal,
  ChatAgentId,
  ConversationSetupPlan,
  SetupChatMessage,
} from "@/lib/api/types";
import {
  createInitialActivity,
  streamChatWorkspace,
  type AgentActivityState,
} from "@/lib/api/workspace-chat-stream";

const setupSuggestions = [
  {
    label: "Mon & Thu sprint check-in",
    icon: CalendarDays,
    agent: "conversation_setup" as const,
    prompt:
      "Mon and Thu at 9am — ask about sprint progress, what they shipped, and blockers.",
  },
  {
    label: "Friday team pulse",
    icon: TrendingUp,
    agent: "conversation_setup" as const,
    prompt:
      "Friday at 4pm — quick team energy pulse and anything to flag before the weekend.",
  },
  {
    label: "Daily standup topics",
    icon: MessageCircleQuestion,
    agent: "conversation_setup" as const,
    prompt:
      "Every weekday at 9am — short standup: priorities today, progress since yesterday, blockers.",
  },
];

const adhocSuggestions = [
  {
    label: "Ask about a blocker",
    icon: MessageCircle,
    agent: "adhoc_conversation" as const,
    prompt: "Have a conversation with Michael about his blocker.",
  },
];

const teamSuggestions = [
  {
    label: "Who's blocked?",
    icon: Users,
    agent: "team_qa" as const,
    prompt: "Is anyone blocked right now?",
  },
  {
    label: "Team pulse summary",
    icon: TrendingUp,
    agent: "team_qa" as const,
    prompt: "What did the team share in their most recent check-ins?",
  },
  {
    label: "Recurring blockers",
    icon: MessageCircleQuestion,
    agent: "team_qa" as const,
    prompt: "Are there any recurring blockers across the team?",
  },
];

const linearTeamSuggestions = [
  {
    label: "What is the team working on?",
    icon: TrendingUp,
    agent: "team_qa" as const,
    prompt: "What is each team member working on based on Linear and check-ins?",
  },
  {
    label: "Open Linear issues",
    icon: MessageCircleQuestion,
    agent: "team_qa" as const,
    prompt: "What open Linear issues are assigned to the team?",
  },
];

const slackTeamSuggestions = [
  {
    label: "Slack team discussion",
    icon: MessageCircle,
    agent: "team_qa" as const,
    prompt: "What did the team discuss in Slack this week?",
  },
];

const AGENT_LABELS: Record<ChatAgentId, string> = {
  conversation_setup: "Scheduling",
  team_qa: "Team insights",
  adhoc_conversation: "Reach out",
};

const AGENT_MENU_LABELS: Record<ChatAgentId | "auto", string> = {
  auto: "Auto",
  conversation_setup: "Scheduling",
  team_qa: "Team insights",
  adhoc_conversation: "Reach out",
};

interface EmployeeChatPromptProps {
  workspaceId: string;
  canEdit?: boolean;
  linearConnected?: boolean;
  slackSearchEnabled?: boolean;
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

function updateAdhocProposalMembers(
  proposal: AdhocConversationProposal,
  memberIds: string[],
  candidateMembers: AdhocConversationProposal["members"],
): AdhocConversationProposal {
  const rosterById = new Map(
    candidateMembers.map((member) => [member.id, member]),
  );

  return {
    ...proposal,
    roster_member_ids: memberIds,
    members: memberIds
      .map((id) => rosterById.get(id))
      .filter((member): member is AdhocConversationProposal["members"][number] =>
        Boolean(member),
      ),
  };
}

export function EmployeeChatPrompt({
  workspaceId,
  canEdit = true,
  linearConnected = false,
  slackSearchEnabled = false,
}: EmployeeChatPromptProps) {
  const { client } = useStatsigClient();

  const [messages, setMessages] = useState<SetupChatMessage[]>([]);
  const [proposal, setProposal] = useState<ConversationSetupPlan | null>(null);
  const [adhocProposal, setAdhocProposal] =
    useState<AdhocConversationProposal | null>(null);
  const [input, setInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [pendingActivity, setPendingActivity] =
    useState<AgentActivityState | null>(null);
  const [publishPending, setPublishPending] = useState(false);
  const [adhocPending, setAdhocPending] = useState(false);
  const [adhocAbandonPending, setAdhocAbandonPending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [adhocError, setAdhocError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [adhocSuccess, setAdhocSuccess] = useState(false);
  const [activeAgent, setActiveAgent] = useState<ChatAgentId | null>(null);
  const [agentPreference, setAgentPreference] = useState<
    ChatAgentId | "auto"
  >("auto");

  const hasMessages = messages.length > 0 || chatPending;
  const isEmptyState = !hasMessages && !chatError;
  const chatDisabled =
    chatPending || publishPending || adhocPending || adhocAbandonPending || !canEdit;
  const isSetupAgent =
    activeAgent === "conversation_setup" || activeAgent === null;
  const isAdhocAgent = activeAgent === "adhoc_conversation";

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

  const memberPickerSelection = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (
        message?.role === "assistant" &&
        message.ui_component?.type === "member_picker"
      ) {
        return message.ui_component;
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

  const adhocStartDisabled = useMemo(() => {
    if (!adhocProposal || adhocPending || chatPending || !isAdhocAgent) {
      return true;
    }

    return adhocProposal.roster_member_ids.length === 0;
  }, [adhocProposal, adhocPending, chatPending, isAdhocAgent]);

  const suggestions = useMemo(() => {
    const linearAwareTeamSuggestions = linearConnected
      ? [...linearTeamSuggestions, ...teamSuggestions]
      : teamSuggestions;
    const contextAwareTeamSuggestions = slackSearchEnabled
      ? [...slackTeamSuggestions, ...linearAwareTeamSuggestions]
      : linearAwareTeamSuggestions;

    if (activeAgent === "team_qa") {
      return contextAwareTeamSuggestions;
    }
    if (activeAgent === "conversation_setup") {
      return setupSuggestions;
    }
    if (activeAgent === "adhoc_conversation") {
      return adhocSuggestions;
    }
    return [
      ...setupSuggestions,
      ...adhocSuggestions,
      ...contextAwareTeamSuggestions,
    ];
  }, [activeAgent, linearConnected, slackSearchEnabled]);

  async function handleSend(content: string, agentOverride?: ChatAgentId) {
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
    const initialActivity = createInitialActivity();
    setPendingActivity(initialActivity);
    setChatError(null);
    setPublishSuccess(false);
    setAdhocSuccess(false);
    setProposal(null);
    setAdhocProposal(null);
    setPublishError(null);
    setAdhocError(null);

    const agentToSend =
      agentOverride ??
      (agentPreference !== "auto"
        ? agentPreference
        : activeAgent ?? undefined);

    let completedActivity: AgentActivityState = initialActivity;

    const streamResult = await streamChatWorkspace(
      workspaceId,
      nextMessages,
      agentToSend,
      {
        onActivity: (activity) => {
          completedActivity = activity;
          setPendingActivity(activity);
        },
      },
    );

    setChatPending(false);
    setPendingActivity(null);

    if (streamResult.error) {
      setChatError(streamResult.error);
      return;
    }

    const result = streamResult.result;
    if (!result) {
      setChatError("Failed to send message.");
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
          activity: completedActivity,
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

    if (result.agent === "adhoc_conversation" && result.adhoc_proposal) {
      setAdhocProposal(result.adhoc_proposal);
    }
  }

  function handleMembersChange(messageIndex: number, memberIds: string[]) {
    if (!adhocProposal || interactiveDisabled()) {
      return;
    }

    const candidates =
      memberPickerSelection?.members ?? adhocProposal.members;
    const updatedProposal = updateAdhocProposalMembers(
      adhocProposal,
      memberIds,
      candidates,
    );
    setAdhocProposal(updatedProposal);
    setMessages((current) =>
      current.map((message, index) =>
        index === messageIndex && message.ui_component?.type === "member_picker"
          ? {
              ...message,
              ui_component: {
                ...message.ui_component,
                selected_member_ids: memberIds,
              },
            }
          : message,
      ),
    );
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
    return chatDisabled || publishSuccess || adhocSuccess;
  }

  async function handleStartAdhocConversation() {
    if (!adhocProposal || adhocStartDisabled) {
      return;
    }

    setAdhocPending(true);
    setAdhocError(null);
    setAdhocSuccess(false);

    const result = await commitAdhocConversationAction(workspaceId, {
      roster_member_ids: adhocProposal.roster_member_ids,
      intent: adhocProposal.intent,
      topic: adhocProposal.topic,
      conversation_name: adhocProposal.conversation_name,
      delivery_facts: adhocProposal.delivery_facts,
    });

    setAdhocPending(false);

    if (result.error) {
      setAdhocError(result.error);
      return;
    }

    setAdhocProposal(null);
    setAdhocSuccess(true);
  }

  async function handleAbandonActiveCheckinAndRetry() {
    if (!adhocProposal || adhocAbandonPending || adhocPending) {
      return;
    }

    setAdhocAbandonPending(true);
    setAdhocError(null);

    const abandonResult = await abandonActiveCheckinAction(
      workspaceId,
      adhocProposal.roster_member_ids,
    );

    if (abandonResult.error) {
      setAdhocAbandonPending(false);
      setAdhocError(abandonResult.error);
      return;
    }

    setAdhocAbandonPending(false);
    await handleStartAdhocConversation();
  }

  const showAbandonActiveCheckinAction =
    adhocError === ACTIVE_CHECKIN_IN_PROGRESS_ERROR && Boolean(adhocProposal);

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
    setAdhocProposal(null);
    setInput("");
    setChatPending(false);
    setPendingActivity(null);
    setChatError(null);
    setPublishError(null);
    setAdhocError(null);
    setPublishSuccess(false);
    setAdhocSuccess(false);
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
            ? "Ask about your team, reach out in Slack, or describe a check-in schedule…"
            : "Ask about your team, reach out in Slack, or describe a check-in schedule…"
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
              <DropdownMenuRadioItem value="adhoc_conversation">
                Reach out
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
      {suggestions.map(({ label, icon: Icon, prompt, agent }) => (
        <Badge
          key={label}
          variant="outline"
          className="h-8 cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition-colors hover:bg-muted"
          onClick={() => {
            client.logEvent("employee_chat_suggestion_click", label);
            void handleSend(prompt, agent);
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
            pendingActivity={pendingActivity}
            onDaysChange={handleDaysChange}
            onMembersChange={handleMembersChange}
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

      {adhocError ? (
        <Alert variant="destructive">
          <AlertDescription className="space-y-3">
            <p>{adhocError}</p>
            {showAbandonActiveCheckinAction ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={adhocAbandonPending || adhocPending}
                onClick={() => void handleAbandonActiveCheckinAndRetry()}
              >
                {adhocAbandonPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Ending check-in…
                  </>
                ) : (
                  "End active check-in and retry"
                )}
              </Button>
            ) : null}
          </AlertDescription>
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

      {adhocProposal && !adhocSuccess && isAdhocAgent ? (
        <div className="px-1">
          <AdhocConversationProposalCard
            proposal={adhocProposal}
            onStart={() => void handleStartAdhocConversation()}
            pending={adhocPending}
            disabled={adhocStartDisabled}
          />
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

      {adhocSuccess ? (
        <p className="text-center text-sm text-muted-foreground">
          Conversation started in Slack. Replies will show up in Team insights
          once your teammate responds.
        </p>
      ) : null}

      {promptForm}
      {suggestionChips}
    </div>
  );
}
