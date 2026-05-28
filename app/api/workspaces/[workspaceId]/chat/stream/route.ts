import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolveApiBaseUrl } from "@/lib/api/auth";

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const base = await resolveApiBaseUrl();
  const upstream = await fetch(
    `${base}/api/workspaces/${workspaceId}/chat/stream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return new NextResponse(text || "Upstream chat stream failed", {
      status: upstream.status,
    });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ??
        "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
