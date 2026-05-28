"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  X,
} from "lucide-react";

import { completeOnboarding } from "@/actions/onboarding";
import { fetchSlackInstallUrl } from "@/actions/slack";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { OptionSelector } from "@/components/ui/option-selector";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import type { AuthUser } from "@/lib/api/types";
import {
  ONBOARDING_ROLE_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  TOOL_OPTIONS,
  type OnboardingFormData,
  type OnboardingRole,
  type OnboardingTool,
  type ReferralSource,
} from "@/lib/onboarding-schemas";

const ONBOARDING_DRAFT_KEY = "ceptly-onboarding-draft";

interface OnboardingWizardProps {
  user: AuthUser;
  initialOrganizationName?: string;
}

function getStepTitle(step: number, slackSelected: boolean): string {
  switch (step) {
    case 1:
      return "What is your role?";
    case 2:
      return "How did you hear about us?";
    case 3:
      return "Invite people to your workspace";
    case 4:
      return "Which tools does your team use?";
    case 5:
      return "What's your organization name?";
    case 6:
      return slackSelected ? "Connect Ceptly to Slack" : "";
    default:
      return "";
  }
}

function getStepDescription(step: number, slackSelected: boolean): string {
  switch (step) {
    case 1:
      return "This helps us tailor Ceptly to how you work.";
    case 2:
      return "We'd love to know where you discovered Ceptly.";
    case 3:
      return "Add teammates by email. You can always invite more later.";
    case 4:
      return "Select all that apply. We'll prioritize integrations accordingly.";
    case 5:
      return "This is how your workspace will appear in Ceptly.";
    case 6:
      return slackSelected
        ? "Check-ins run in Slack DMs. Connect your workspace now or skip and set this up later in Settings."
        : "";
    default:
      return "";
  }
}

export function OnboardingWizard({
  user,
  initialOrganizationName = "",
}: OnboardingWizardProps) {
  const searchParams = useSearchParams();
  const slackConnectedFromOAuth = searchParams.get("slack") === "connected";

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [slackConnectError, setSlackConnectError] = useState<string | null>(
    null,
  );
  const [inviteInput, setInviteInput] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSlackPending, startSlackTransition] = useTransition();

  const [formData, setFormData] = useState<OnboardingFormData>(() => {
    if (typeof window === "undefined") {
      return {
        role: null,
        referralSource: null,
        referralSourceOther: "",
        inviteEmails: [],
        toolsUsed: [],
        organizationName: initialOrganizationName,
      };
    }

    try {
      const saved = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingFormData;
        return {
          ...parsed,
          organizationName: parsed.organizationName || initialOrganizationName,
        };
      }
    } catch {
      // ignore invalid draft
    }

    return {
      role: null,
      referralSource: null,
      referralSourceOther: "",
      inviteEmails: [],
      toolsUsed: [],
      organizationName: initialOrganizationName,
    };
  });

  const slackSelected =
    formData.toolsUsed.includes("slack") ||
    slackConnectedFromOAuth ||
    searchParams.get("step") === "6";
  const totalSteps = slackSelected ? 6 : 5;
  const progressValue = (step / totalSteps) * 100;
  const workspaceId = user.workspaces?.[0]?.id;

  useEffect(() => {
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    const parsedStep = stepParam ? Number.parseInt(stepParam, 10) : NaN;
    if (Number.isInteger(parsedStep) && parsedStep >= 1 && parsedStep <= 6) {
      setStep(parsedStep);
    }
  }, [searchParams]);

  const updateForm = (patch: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!formData.role) {
          setError("Please select your role.");
          return false;
        }
        return true;
      case 2:
        if (!formData.referralSource) {
          setError("Please select how you heard about us.");
          return false;
        }
        if (
          formData.referralSource === "other" &&
          !formData.referralSourceOther.trim()
        ) {
          setError("Please specify how you heard about us.");
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        if (!formData.organizationName.trim()) {
          setError("Organization name is required.");
          return false;
        }
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const finishOnboarding = () => {
    if (!formData.role || !formData.referralSource) {
      return;
    }

    startTransition(async () => {
      const payload: Parameters<typeof completeOnboarding>[1] = {
        role: formData.role as OnboardingRole,
        referralSource: formData.referralSource as ReferralSource,
        organizationName: formData.organizationName.trim(),
      };

      if (formData.referralSource === "other") {
        payload.referralSourceOther = formData.referralSourceOther.trim();
      }

      if (formData.inviteEmails.length > 0) {
        payload.inviteEmails = formData.inviteEmails;
      }

      if (formData.toolsUsed.length > 0) {
        payload.toolsUsed = formData.toolsUsed;
      }

      const result = await completeOnboarding({}, payload);

      if (result?.error) {
        setError(result.error);
        return;
      }

      sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
    });
  };

  const handleContinue = () => {
    if (!validateStep()) {
      return;
    }

    if (step < totalSteps) {
      setStep((s) => s + 1);
      setError(null);
      return;
    }

    finishOnboarding();
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      setError(null);
    }
  };

  const handleSkipInvites = () => {
    setStep(4);
    setError(null);
  };

  const handleConnectSlack = () => {
    if (!workspaceId) {
      setSlackConnectError("No workspace found. Please try again.");
      return;
    }

    setSlackConnectError(null);
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(formData));
    startSlackTransition(async () => {
      const result = await fetchSlackInstallUrl(
        workspaceId,
        "/onboarding?step=6",
      );
      if (result.error || !result.url) {
        setSlackConnectError(result.error ?? "Failed to start Slack install.");
        return;
      }
      window.location.href = result.url;
    });
  };

  const addInviteEmail = () => {
    const email = inviteInput.trim().toLowerCase();
    if (!email) {
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setInviteError("Please enter a valid email address.");
      return;
    }

    if (email === user.email.toLowerCase()) {
      setInviteError("You can't invite yourself.");
      return;
    }

    if (formData.inviteEmails.includes(email)) {
      setInviteError("This email is already on your invite list.");
      return;
    }

    updateForm({ inviteEmails: [...formData.inviteEmails, email] });
    setInviteInput("");
    setInviteError(null);
  };

  const removeInviteEmail = (email: string) => {
    updateForm({
      inviteEmails: formData.inviteEmails.filter((e) => e !== email),
    });
  };

  const isLastStep = step === totalSteps;
  const continueLabel =
    step === 5 && slackSelected
      ? "Continue"
      : isLastStep
        ? "Finish setup"
        : "Continue";

  return (
    <Card className="w-full dark:border-white/20">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
          <Progress value={progressValue}>
            <ProgressTrack className="h-1.5">
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        </div>
        <div className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {getStepTitle(step, slackSelected)}
          </CardTitle>
          <CardDescription>
            {getStepDescription(step, slackSelected)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === 1 ? (
          <OptionSelector
            mode="single"
            options={ONBOARDING_ROLE_OPTIONS}
            value={formData.role}
            onChange={(value) => updateForm({ role: value as OnboardingRole })}
          />
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <OptionSelector
              mode="single"
              options={REFERRAL_SOURCE_OPTIONS}
              value={formData.referralSource}
              onChange={(value) =>
                updateForm({ referralSource: value as ReferralSource })
              }
            />
            {formData.referralSource === "other" ? (
              <div className="space-y-2">
                <Label htmlFor="referral-other">Please specify</Label>
                <Input
                  id="referral-other"
                  value={formData.referralSourceOther}
                  onChange={(e) =>
                    updateForm({ referralSourceOther: e.target.value })
                  }
                  placeholder="Tell us where you heard about Ceptly"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={inviteInput}
                  onChange={(e) => {
                    setInviteInput(e.target.value);
                    setInviteError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInviteEmail();
                    }
                  }}
                  placeholder="teammate@company.com"
                  className="pl-10"
                />
              </div>
              <Button type="button" variant="outline" onClick={addInviteEmail}>
                Add
              </Button>
            </div>
            {inviteError ? (
              <p className="text-sm text-destructive">{inviteError}</p>
            ) : null}
            {formData.inviteEmails.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.inviteEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeInviteEmail(email)}
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No invites added yet. You can skip this step.
              </p>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <OptionSelector
            mode="multiple"
            options={TOOL_OPTIONS}
            value={formData.toolsUsed}
            onChange={(value) =>
              updateForm({ toolsUsed: value as OnboardingTool[] })
            }
          />
        ) : null}

        {step === 5 ? (
          <div className="space-y-2">
            <Label htmlFor="organization-name">Organization name</Label>
            <Input
              id="organization-name"
              value={formData.organizationName}
              onChange={(e) => updateForm({ organizationName: e.target.value })}
              placeholder="Acme Inc."
              required
            />
          </div>
        ) : null}

        {step === 6 && slackSelected ? (
          <div className="space-y-4">
            {slackConnectedFromOAuth ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Slack connected successfully. You can add team members from
                  Settings after setup.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-4 dark:border-white/10">
                  <MessageSquare className="h-8 w-8 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Install Ceptly in your Slack workspace so scheduled
                    check-ins reach your team in DMs.
                  </p>
                </div>

                {slackConnectError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{slackConnectError}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="button"
                  onClick={handleConnectSlack}
                  disabled={isSlackPending || !workspaceId}
                >
                  {isSlackPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Add to Slack"
                  )}
                </Button>
              </>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isPending}
            >
              Back
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {step === 3 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipInvites}
                disabled={isPending}
              >
                Skip
              </Button>
            ) : null}
            {step === 6 && slackSelected && !slackConnectedFromOAuth ? (
              <Button
                type="button"
                variant="ghost"
                onClick={finishOnboarding}
                disabled={isPending}
              >
                Skip for now
              </Button>
            ) : null}
            <Button type="button" onClick={handleContinue} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finishing...
                </>
              ) : (
                continueLabel
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
