import type { RosterMember } from "@/lib/api/roster";

/** Bright mention text on dark backgrounds (dark mode composer, user bubbles). */
export const MENTION_TEXT_COLOR = "#56FF3C";
/** Darker mention text for readability on light backgrounds. */
export const MENTION_TEXT_COLOR_LIGHT = "#69C35B";
/** 50% opacity highlight for mention picker selection */
export const MENTION_HIGHLIGHT_COLOR = "rgba(86, 255, 60, 0.5)";

export const MENTION_TEXT_CLASS = "text-[#1B7A14] dark:text-[#56FF3C]";

export interface ActiveMentionState {
  query: string;
  start: number;
}

export function getActiveRosterMembers(
  members: RosterMember[],
): RosterMember[] {
  return members.filter((member) => !member.paused);
}

function isCursorAfterCompletedMention(
  value: string,
  atIndex: number,
  cursor: number,
  members: RosterMember[],
): boolean {
  const activeMembers = [...getActiveRosterMembers(members)].sort(
    (left, right) => right.display_name.length - left.display_name.length,
  );

  for (const member of activeMembers) {
    const mentionText = `@${member.display_name}`;
    if (!value.slice(atIndex).startsWith(mentionText)) {
      continue;
    }

    const mentionEnd = atIndex + mentionText.length;
    const nextChar = value[mentionEnd] ?? "";
    const hasMentionTerminator = !nextChar || /[\s.,!?;:]/.test(nextChar);
    if (!hasMentionTerminator) {
      continue;
    }

    if (cursor > mentionEnd) {
      return true;
    }
  }

  return false;
}

export function findActiveMention(
  value: string,
  cursor: number,
  members: RosterMember[] = [],
): ActiveMentionState | null {
  const beforeCursor = value.slice(0, cursor);
  const atIndex = beforeCursor.lastIndexOf("@");
  if (atIndex === -1) {
    return null;
  }

  const charBeforeAt = atIndex > 0 ? beforeCursor[atIndex - 1] : "";
  if (charBeforeAt && !/\s/.test(charBeforeAt)) {
    return null;
  }

  if (isCursorAfterCompletedMention(value, atIndex, cursor, members)) {
    return null;
  }

  const query = beforeCursor.slice(atIndex + 1);
  if (query.includes("\n")) {
    return null;
  }

  return { query, start: atIndex };
}

export function filterMembersForMentionQuery(
  members: RosterMember[],
  query: string,
): RosterMember[] {
  const activeMembers = getActiveRosterMembers(members);
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return activeMembers;
  }

  return activeMembers.filter((member) => {
    const displayName = member.display_name.toLowerCase();
    const emailLocal = member.email.split("@")[0]?.toLowerCase() ?? "";
    return (
      displayName.includes(normalizedQuery) ||
      emailLocal.includes(normalizedQuery)
    );
  });
}

export function insertMention(
  value: string,
  cursor: number,
  mention: ActiveMentionState,
  member: RosterMember,
): { value: string; cursor: number } {
  const before = value.slice(0, mention.start);
  const after = value.slice(cursor);
  const insertion = `@${member.display_name} `;
  const nextValue = `${before}${insertion}${after}`;
  return {
    value: nextValue,
    cursor: mention.start + insertion.length,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type MentionTextSegment =
  | { type: "text"; content: string }
  | { type: "mention"; content: string; displayName: string };

interface MentionRange {
  start: number;
  end: number;
  displayName: string;
}

function findMentionRanges(
  text: string,
  members: RosterMember[],
): MentionRange[] {
  const activeMembers = getActiveRosterMembers(members);
  const sortedMembers = [...activeMembers].sort(
    (left, right) => right.display_name.length - left.display_name.length,
  );
  const ranges: MentionRange[] = [];

  for (const member of sortedMembers) {
    const pattern = new RegExp(
      `@${escapeRegExp(member.display_name)}(?=\\s|$|[.,!?;:\\n])`,
      "g",
    );
    let match = pattern.exec(text);
    while (match) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
        displayName: member.display_name,
      });
      match = pattern.exec(text);
    }
  }

  return ranges.sort((left, right) => left.start - right.start);
}

/** Split plain text into normal spans and completed @mentions for rich display. */
export function splitTextWithMentionSegments(
  text: string,
  members: RosterMember[],
): MentionTextSegment[] {
  if (!text) {
    return [];
  }

  const mergedRanges: MentionRange[] = [];
  for (const range of findMentionRanges(text, members)) {
    const previous = mergedRanges[mergedRanges.length - 1];
    if (previous && range.start < previous.end) {
      continue;
    }
    mergedRanges.push(range);
  }

  const segments: MentionTextSegment[] = [];
  let cursor = 0;

  for (const range of mergedRanges) {
    if (range.start > cursor) {
      segments.push({
        type: "text",
        content: text.slice(cursor, range.start),
      });
    }
    segments.push({
      type: "mention",
      content: text.slice(range.start, range.end),
      displayName: range.displayName,
    });
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
}

export function resolveMentionedMembers(
  content: string,
  members: RosterMember[],
): RosterMember[] {
  const activeMembers = getActiveRosterMembers(members);
  const sortedMembers = [...activeMembers].sort(
    (left, right) => right.display_name.length - left.display_name.length,
  );
  const mentioned: RosterMember[] = [];
  const mentionedIds = new Set<string>();

  for (const member of sortedMembers) {
    const pattern = new RegExp(
      `@${escapeRegExp(member.display_name)}(?=\\s|$|[.,!?;:])`,
      "i",
    );
    if (pattern.test(content) && !mentionedIds.has(member.id)) {
      mentioned.push(member);
      mentionedIds.add(member.id);
    }
  }

  return mentioned;
}

/** Append roster ids so agents can resolve @mentions reliably. */
export function formatMessageWithMentionContext(
  content: string,
  members: RosterMember[],
): string {
  const mentioned = resolveMentionedMembers(content, members);
  if (mentioned.length === 0) {
    return content;
  }

  const references = mentioned
    .map((member) => `${member.display_name} (roster id: ${member.id})`)
    .join(", ");

  return `${content}\n\n[Referenced team members: ${references}]`;
}
