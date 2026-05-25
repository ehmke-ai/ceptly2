import type { ConversationTemplate } from "@/lib/api/types";

/** Mirrors backend CONVERSATION_TEMPLATES — used when the API cannot load templates. */
export const DEFAULT_CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  {
    id: "daily_standup",
    name: "Daily standup",
    summary: "Async standup — no timezone sync meeting",
    schedule: {
      frequency: "specific_days",
      days_of_week: [1, 2, 3, 4, 5],
      time_local: "09:00",
      enabled: true,
    },
    questions: [
      "What did you work on since last check-in?",
      "What are you focused on today?",
      "What is the status on your in-progress Linear issues?",
      "Any blockers?",
    ],
    suggested_context_integrations: ["linear"],
  },
];
