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

export type ConversationResultDestination =
  | {
      type: "slack_channel";
      channel_id: string;
      name?: string;
    }
  | {
      type: "roster_dm";
      roster_member_id: string;
    }
  | {
      type: "workspace_digest";
    };

export interface ScheduledConversation {
  id: string;
  name: string;
  summary?: string | null;
  template_id?: string | null;
  kind?: "scheduled" | "adhoc";
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
  sort_order: number;
  questions?: ConversationQuestion[];
  roster_member_ids?: string[];
  context_integrations?: string[];
  result_destinations?: ConversationResultDestination[];
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
  created_at: string;
}

export interface ConversationRunLegacyResponse {
  question_prompt: string;
  answer_text: string;
  question_at: string;
  answered_at: string;
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

export type ActivityAttentionItem =
  | {
      type: "missing_responses";
      conversation_id: string;
      conversation_name: string;
      run_id: string;
      missing_count: number;
      missing_names: string[];
    }
  | {
      type: "blocker";
      conversation_id: string;
      session_id: string;
      member_name: string;
      conversation_name: string;
      excerpt: string;
      occurred_at: string;
    }
  | {
      type: "awaiting_reply";
      conversation_id: string;
      session_id: string;
      member_name: string;
      topic: string;
      started_at: string;
    }
  | {
      type: "roster_tracker_mismatch";
      roster_member_id: string;
      member_name: string;
      member_email: string;
      missing_trackers: ("linear" | "jira")[];
    };

export interface ActivityScheduledConversation {
  id: string;
  name: string;
  summary: string | null;
  template_id: string | null;
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
  latest_run: ConversationRunSummary | null;
  missing_members: ConversationRunMemberRef[];
}

export interface ActivityAdhocSession {
  conversation_id: string;
  session_id: string;
  member_name: string;
  status: "completed" | "in_progress" | "abandoned";
  started_at: string;
  completed_at: string | null;
  intent: "gather" | "inform";
  intent_label: string;
  topic: string | null;
  delivery_facts: string | null;
  agent_prompt: string | null;
}

export type StandupStyle = "broadcast" | "sequential";

export interface StandupSchedule {
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
}

export interface StandupMember {
  roster_member_id: string;
  display_name: string;
  email: string;
  sort_order: number;
}

export interface Standup {
  id: string;
  name: string;
  slack_channel_id: string;
  slack_channel_name?: string;
  style: StandupStyle;
  custom_instructions: string;
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
  context_integrations?: string[];
  result_destinations?: ConversationResultDestination[];
  members: StandupMember[];
  created_at: string;
  updated_at: string;
}

export interface ChannelStandupProposal {
  name: string;
  slack_channel_id: string;
  slack_channel_name?: string;
  roster_member_ids: string[];
  members: StandupMember[];
  style: StandupStyle;
  custom_instructions: string;
  schedule: StandupSchedule;
  summary: string;
  standup_id?: string;
}

export interface StandupSessionSummary {
  session_id: string;
  scheduled_fire_at: string;
  status: "active" | "completed" | "cancelled";
  participant_count: number;
  responded_count: number;
  summary_preview?: string;
}

export interface StandupSessionMessage {
  role: "agent" | "ic";
  display_name?: string;
  content: string;
  created_at: string;
}

export interface StandupSessionDetail {
  session_id: string;
  standup_id: string;
  standup_name: string;
  slack_channel_id: string;
  slack_channel_name?: string;
  style: StandupStyle;
  status: "active" | "completed" | "cancelled";
  scheduled_fire_at: string;
  completed_at?: string;
  summary_text?: string;
  summary_generated_at?: string;
  participants: { roster_member_id: string; display_name: string }[];
  messages: StandupSessionMessage[];
}

export interface ActivityChannelStandup {
  standup_id: string;
  name: string;
  slack_channel_id: string;
  slack_channel_name?: string;
  style: StandupStyle;
  latest_session: StandupSessionSummary | null;
}

export interface WorkspaceActivity {
  attention_count: number;
  attention_items: ActivityAttentionItem[];
  scheduled_conversations: ActivityScheduledConversation[];
  adhoc_sessions: ActivityAdhocSession[];
  channel_standups: ActivityChannelStandup[];
}

export interface ConversationSessionSummary {
  session_id: string;
  roster_member_id: string | null;
  display_name: string;
  email: string;
  status: "completed" | "in_progress" | "abandoned";
  started_at: string;
  completed_at: string | null;
  intent: "gather" | "inform";
  intent_label: string;
  topic: string | null;
  delivery_facts: string | null;
  agent_prompt: string | null;
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
  template_id?: string | null;
  roster_member_ids?: string[];
  context_integrations?: string[];
  result_destinations?: ConversationResultDestination[];
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

export interface SetupRecapUiComponent {
  type: "setup_recap";
  days_of_week: number[];
  members: {
    id: string;
    display_name: string;
    email: string;
  }[];
  selected_member_ids: string[];
  selected_context_integrations: string[];
  selected_channel_ids: string[];
  selected_roster_dm_ids: string[];
}

export type SetupChatUiComponent =
  | DayPickerUiComponent
  | MemberPickerUiComponent
  | SetupRecapUiComponent;

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
  | "adhoc_conversation"
  | "channel_standup";

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
  role: "owner" | "admin" | "member";
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
