import Image from "next/image";
import Link from "next/link";

import { InviteAcceptForm } from "@/components/invite/invite-accept-form";
import { InviteSwitchAccountForm } from "@/components/invite/invite-switch-account-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchInvitePreview } from "@/lib/api/invites";
import { getCurrentUser } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const previewResult = await fetchInvitePreview(token);
  const user = await getCurrentUser();

  const preview = previewResult.data?.preview;
  const authInviteUrl = `/auth?invite=${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Image
            src="/parallax-gradient.png"
            alt="Ceptly Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        </div>

        <Card className="w-full dark:border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {!previewResult.success || !preview
                ? "Invite not found"
                : preview.status === "accepted"
                  ? "Invite already accepted"
                  : preview.status === "expired"
                    ? "Invite expired"
                    : "You're invited"}
            </CardTitle>
            <CardDescription>
              {!previewResult.success || !preview ? (
                previewResult.error ?? "This invite link is invalid."
              ) : preview.status === "accepted" ? (
                "This invite has already been used."
              ) : preview.status === "expired" ? (
                "Ask your teammate to send a new invite."
              ) : (
                <>
                  {preview.inviterName} invited you to join{" "}
                  <span className="font-medium text-foreground">
                    {preview.workspaceName}
                  </span>
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {preview?.status === "pending" ? (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Sign up or sign in with{" "}
                  <span className="font-medium text-foreground">
                    {preview.invitedEmail}
                  </span>{" "}
                  to join this workspace.
                </p>

                {user ? (
                  user.email.toLowerCase() ===
                  preview.invitedEmail.toLowerCase() ? (
                    <InviteAcceptForm token={token} />
                  ) : (
                    <div className="space-y-3 text-center">
                      <p className="text-sm text-destructive">
                        You&apos;re signed in as {user.email}. Sign in with the
                        invited email to accept.
                      </p>
                      <InviteSwitchAccountForm inviteToken={token} />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`${authInviteUrl}&mode=sign-up&email=${encodeURIComponent(preview.invitedEmail)}`}
                      className={cn(buttonVariants(), "w-full")}
                    >
                      Create account
                    </Link>
                    <Link
                      href={authInviteUrl}
                      className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                    >
                      Sign in
                    </Link>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
