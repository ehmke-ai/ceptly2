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
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
  sort_order: number;
  questions?: ConversationQuestion[];
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
}

export interface ConversationSetupPlan {
  conversations: ProposedConversation[];
  summary: string;
}

export interface SetupChatMessage {
  role: "user" | "assistant";
  content: string;
}

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
