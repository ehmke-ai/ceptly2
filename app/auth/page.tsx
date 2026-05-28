"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";

import { signIn, signUp } from "@/actions/auth";
import { getGoogleAuthUrl, resolveGoogleAuthError } from "@/lib/auth/google";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? undefined;
  const initialMode =
    searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  const prefilledEmail = searchParams.get("email") ?? "";
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const googleAuthError = resolveGoogleAuthError(searchParams.get("error"));

  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [signInState, signInAction] = useActionState(signIn, undefined);
  const [signUpState, signUpAction] = useActionState(signUp, undefined);

  useEffect(() => {
    if (searchParams.get("mode") === "sign-up") {
      setMode("sign-up");
    }
    if (searchParams.get("checkout") === "success") {
      setMode("sign-up");
    }
  }, [searchParams]);

  const isSignUp = mode === "sign-up";
  const formState = isSignUp ? signUpState : signInState;
  const googleAuthUrl = getGoogleAuthUrl(
    inviteToken ? { inviteToken } : undefined,
  );

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
              {isSignUp ? "Create your Ceptly account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {inviteToken
                ? isSignUp
                  ? "Create an account to accept your workspace invite"
                  : "Sign in to accept your workspace invite"
                : isSignUp
                  ? "Sign up with your email and password"
                  : "Sign in to your Ceptly account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {checkoutSuccess && isSignUp ? (
              <Alert>
                <AlertDescription>
                  Payment successful. Create your account with the same email
                  you used in Stripe to unlock your workspace.
                </AlertDescription>
              </Alert>
            ) : null}

            {googleAuthError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{googleAuthError}</AlertDescription>
              </Alert>
            ) : null}

            {formState?.errors?._form && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.errors._form[0]}</AlertDescription>
              </Alert>
            )}

            <Button variant="outline" className="w-full" render={<a href={googleAuthUrl} />}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {isSignUp ? (
              <form action={signUpAction} className="space-y-4">
                {inviteToken ? (
                  <input type="hidden" name="inviteToken" value={inviteToken} />
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      defaultValue={prefilledEmail}
                      required
                    />
                  </div>
                  {signUpState?.errors?.email && (
                    <p className="text-sm text-destructive">
                      {signUpState.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="John Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                  {signUpState?.errors?.fullName && (
                    <p className="text-sm text-destructive">
                      {signUpState.errors.fullName[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                  {signUpState?.errors?.password && (
                    <p className="text-sm text-destructive">
                      {signUpState.errors.password[0]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with a letter and a number
                  </p>
                </div>

                <SubmitButton
                  label="Create account"
                  pendingLabel="Creating account..."
                />
              </form>
            ) : (
              <form action={signInAction} className="space-y-4">
                {inviteToken ? (
                  <input type="hidden" name="inviteToken" value={inviteToken} />
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    defaultValue={prefilledEmail}
                    required
                  />
                  {signInState?.errors?.email && (
                    <p className="text-sm text-destructive">
                      {signInState.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                  {signInState?.errors?.password && (
                    <p className="text-sm text-destructive">
                      {signInState.errors.password[0]}
                    </p>
                  )}
                </div>

                <SubmitButton label="Sign In" pendingLabel="Signing In..." />
              </form>
            )}

            <div className="text-center text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")}
                className="font-medium text-primary hover:underline"
              >
                {isSignUp ? "Sign in" : "Create account"}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our terms of service and privacy
              policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
