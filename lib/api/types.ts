export type ScheduleFrequency = "daily" | "specific_days";

export interface WorkspaceSchedule {
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
}

export interface ConversationQuestion {
  id: string;
  sort_order: number;
  prompt_text: string;
  enabled: boolean;
}

export interface ScheduledConversation {
  id: string;
  name: string;
  summary?: string | null;
  template_id?: string | null;
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
  sort_order: number;
  questions?: ConversationQuestion[];
  roster_member_ids?: string[];
  context_integrations?: string[];
}

export interface ConversationTemplate {
  id: string;
  name: string;
  summary: string;
  schedule: {
    frequency: ScheduleFrequency;
    days_of_week: number[];
    time_local: string;
    enabled: boolean;
  };
  questions: string[];
  suggested_context_integrations?: string[];
}

export interface AppContextOption {
  id: string;
  label: string;
  description: string;
  coming_soon?: boolean;
  connected: boolean;
  selectable: boolean;
}

export interface ConversationRunSummary {
  run_id: string;
  fired_at: string;
  expected_count: number;
  responded_count: number;
  not_responded_count: number;
}

export interface ConversationRunMemberRef {
  roster_member_id: string;
  display_name: string;
  email: string;
}

export interface ConversationRunTranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationRunLegacyResponse {
  question_prompt: string;
  answer_text: string;
}

export interface ConversationRunRespondedMember {
  roster_member_id: string;
  display_name: string;
  email: string;
  session_id: string;
  status: "completed" | "in_progress" | "abandoned";
  transcript?: ConversationRunTranscriptMessage[];
  legacy_responses?: ConversationRunLegacyResponse[];
}

export interface ConversationRunDetail {
  run_id: string;
  fired_at: string;
  expected_members: ConversationRunMemberRef[];
  responded: ConversationRunRespondedMember[];
  not_responded: ConversationRunMemberRef[];
}

export interface ConversationPreview {
  opener: string;
  bullets: string[];
}

export interface ProposedSchedule {
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
}

export interface ProposedConversation {
  name: string;
  purpose: string;
  schedule: ProposedSchedule;
  questions: string[];
  /** Present on chat proposals when this entry matches an existing saved conversation. */
  unchanged_from_existing?: boolean;
}

export interface ConversationSetupPlan {
  conversations: ProposedConversation[];
  summary: string;
}

export interface DayPickerUiComponent {
  type: "day_picker";
  days_of_week: number[];
  resolved?: boolean;
}

export interface MemberPickerUiComponent {
  type: "member_picker";
  members: {
    id: string;
    display_name: string;
    email: string;
  }[];
  selected_member_ids: string[];
}

export type SetupChatUiComponent = DayPickerUiComponent | MemberPickerUiComponent;

export interface AdhocConversationMember {
  id: string;
  display_name: string;
  email: string;
}

export interface AdhocConversationProposal {
  roster_member_ids: string[];
  members: AdhocConversationMember[];
  intent: "gather" | "inform";
  topic: string;
  summary: string;
  conversation_name: string;
  delivery_facts?: string;
}

export interface SetupChatMessage {
  role: "user" | "assistant";
  content: string;
  ui_component?: SetupChatUiComponent;
  activity?: import("./workspace-chat-stream").AgentActivityState;
}

export type ChatAgentId =
  | "conversation_setup"
  | "team_qa"
  | "adhoc_conversation";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt?: string;
  onboardingCompleted?: boolean;
  workspaces?: WorkspaceMembership[];
}

export interface WorkspaceMembership {
  id: string;
  name: string;
  role: "founder" | "admin" | "lead" | "ic";
  subscriptionStatus?:
    | "none"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete";
  hasActiveSubscription?: boolean;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  token: string;
  role: WorkspaceMembership["role"];
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitePreview {
  workspaceName: string;
  invitedEmail: string;
  inviterName: string;
  expiresAt: string;
  status: "pending" | "expired" | "accepted";
}

export interface WorkspaceMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: WorkspaceMembership["role"];
  joined_at: string;
}

export interface AuthMeResponse {
  success: boolean;
  data?: {
    user: AuthUser;
  };
  error?: string;
}

export interface AuthSessionResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
  error?: string;
}
