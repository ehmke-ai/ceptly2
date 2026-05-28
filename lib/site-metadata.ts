import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://app.ceptly.ai";

export const SITE_NAME = "Ceptly";

export const DEFAULT_TITLE = "Ceptly — AI Chief of Staff";

export const DEFAULT_DESCRIPTION =
  "Sign in to Ceptly — your team's AI chief of staff for async Slack check-ins, team roster management, and on-demand org intelligence.";

export const KEYWORDS = [
  "Ceptly",
  "AI chief of staff",
  "Slack check-ins",
  "team roster",
  "async standups",
  "team management",
];

export function createSiteMetadata(overrides: Metadata = {}): Metadata {
  const description =
    typeof overrides.description === "string"
      ? overrides.description
      : DEFAULT_DESCRIPTION;

  return {
    metadataBase: new URL(SITE_URL),
    title:
      overrides.title !== undefined
        ? overrides.title
        : {
            default: DEFAULT_TITLE,
            template: `%s — ${SITE_NAME}`,
          },
    description,
    keywords: KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: "https://ceptly.ai" }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: DEFAULT_TITLE,
      description,
      ...overrides.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description,
      ...overrides.twitter,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
