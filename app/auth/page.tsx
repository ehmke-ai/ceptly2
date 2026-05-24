"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";

import { signIn, signUp } from "@/actions/auth";
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

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
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
  const initialMode = searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  const prefilledEmail = searchParams.get("email") ?? "";

  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [signInState, signInAction] = useActionState(signIn, undefined);
  const [signUpState, signUpAction] = useActionState(signUp, undefined);

  useEffect(() => {
    if (searchParams.get("mode") === "sign-up") {
      setMode("sign-up");
    }
  }, [searchParams]);

  const isSignUp = mode === "sign-up";
  const formState = isSignUp ? signUpState : signInState;

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
            {formState?.errors?._form && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.errors._form[0]}</AlertDescription>
              </Alert>
            )}

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
                onClick={() =>
                  setMode(isSignUp ? "sign-in" : "sign-up")
                }
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
