import type { ConversationQuestion } from "@/lib/api/types";

export function formatConversationOpener(
  name: string,
  questions: ConversationQuestion[],
): { opener: string; bullets: string[] } {
  const enabled = questions.filter((q) => q.enabled);
  const bullets = enabled.map((q) => q.prompt_text);

  const opener = `Hey! Time for your ${name}.`;

  return { opener, bullets };
}

export function formatConversationPreviewMessage(
  name: string,
  questions: ConversationQuestion[],
): string {
  const { opener, bullets } = formatConversationOpener(name, questions);
  const bulletBlock =
    bullets.length > 0
      ? `\n\nHere's what I'd like to cover:\n${bullets.map((b) => `• ${b}`).join("\n")}`
      : "";

  return `${opener}${bulletBlock}\n\nReply whenever you're ready — we'll go through these one at a time.`;
}
