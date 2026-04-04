import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireAuthSession } from "#/lib/auth-guard";
import { updatePreferences } from "#/lib/preferences";
import { TeamSearch } from "#/components/team-search";
import {
  NotificationToggle,
  type NotificationSettings,
} from "#/components/notification-toggle";
import { Button } from "#/components/ui/button";

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const session = await requireAuthSession();
    return { session };
  },
  component: OnboardingPage,
});

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full transition-colors"
          style={{
            backgroundColor:
              i + 1 === current ? "var(--lagoon)" : "var(--muted)",
          }}
        />
      ))}
    </div>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="space-y-2">
        <p
          className="island-kicker"
          style={{ color: "var(--lagoon)", textTransform: "uppercase" }}
        >
          Let's get you set up
        </p>
        <h1 className="display-title" style={{ color: "var(--sea-ink)" }}>
          Welcome to Sportraydar
        </h1>
      </div>
      <p
        className="max-w-sm text-sm leading-relaxed"
        style={{ color: "var(--muted-foreground)" }}
      >
        Follow your favourite teams, get live scores, and stay ahead of every
        match — all in one place. Let's personalise your experience in a few
        quick steps.
      </p>
      <Button
        size="lg"
        className="mt-2 w-full"
        style={{
          backgroundColor: "var(--lagoon)",
          color: "var(--background)",
        }}
        onClick={onNext}
      >
        Get Started
      </Button>
    </div>
  );
}

// ── Sport section header ──────────────────────────────────────────────────────

function SportSection({
  emoji,
  label,
  sport,
}: {
  emoji: string;
  label: string;
  sport: "football" | "afl" | "nba" | "tennis";
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>
        {emoji} {label}
      </p>
      <TeamSearch sport={sport} />
    </div>
  );
}

// ── Step 2: Follow teams ──────────────────────────────────────────────────────

function StepTeams({
  onSkip,
  onNext,
}: {
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <p
          className="island-kicker"
          style={{ color: "var(--lagoon)", textTransform: "uppercase" }}
        >
          Step 2 of 3
        </p>
        <h2 className="text-xl font-bold" style={{ color: "var(--sea-ink)" }}>
          Follow your teams
        </h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Search and follow teams or players across any sport.
        </p>
      </div>

      <div className="max-h-[420px] space-y-6 overflow-y-auto pr-1">
        <SportSection emoji="⚽" label="Football" sport="football" />
        <SportSection emoji="🏈" label="AFL" sport="afl" />
        <SportSection emoji="🏀" label="NBA" sport="nba" />
        <SportSection emoji="🎾" label="Tennis" sport="tennis" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          className="flex-1"
          style={{ color: "var(--muted-foreground)" }}
          onClick={onSkip}
        >
          Skip
        </Button>
        <Button
          className="flex-1"
          style={{
            backgroundColor: "var(--lagoon)",
            color: "var(--background)",
          }}
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Notifications ─────────────────────────────────────────────────────

function StepNotifications({
  onSkip,
  onFinish,
}: {
  onSkip: () => void;
  onFinish: () => void;
}) {
  const [settings, setSettings] = useState<NotificationSettings>({
    preGame: true,
    goingLive: true,
    scoreUpdate: false,
  });
  const [saving, setSaving] = useState(false);

  const handleUpdate = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleEnable = async () => {
    if ("Notification" in window) {
      await Notification.requestPermission();
    }
    onFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updatePreferences({ data: { onboardingComplete: true } });
    } finally {
      setSaving(false);
      onFinish();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <p
          className="island-kicker"
          style={{ color: "var(--lagoon)", textTransform: "uppercase" }}
        >
          Step 3 of 3
        </p>
        <h2 className="text-xl font-bold" style={{ color: "var(--sea-ink)" }}>
          Notifications
        </h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Choose what you'd like to be alerted about.
        </p>
      </div>

      <NotificationToggle settings={settings} onUpdate={handleUpdate} />

      <Button
        className="w-full"
        style={{
          backgroundColor: "var(--lagoon)",
          color: "var(--background)",
        }}
        onClick={handleEnable}
        disabled={saving}
      >
        Enable Notifications
      </Button>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          style={{ color: "var(--muted-foreground)" }}
          onClick={onSkip}
          disabled={saving}
        >
          Skip
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleFinish}
          disabled={saving}
        >
          {saving ? "Saving…" : "Finish"}
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const goTo = (s: 1 | 2 | 3) => setStep(s);

  const finish = async () => {
    try {
      await updatePreferences({ data: { onboardingComplete: true } });
    } finally {
      void navigate({ to: "/dashboard" });
    }
  };

  return (
    <div
      className="rise-in flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="island-shell w-full max-w-xl space-y-6 rounded-2xl p-8"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <StepDots current={step} total={3} />

        {step === 1 && <StepWelcome onNext={() => goTo(2)} />}

        {step === 2 && (
          <StepTeams onSkip={() => goTo(3)} onNext={() => goTo(3)} />
        )}

        {step === 3 && <StepNotifications onSkip={finish} onFinish={finish} />}
      </div>
    </div>
  );
}
