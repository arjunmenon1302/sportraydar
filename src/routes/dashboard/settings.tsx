import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { signOut } from "#/lib/auth-client";
import {
  getPreferences,
  updatePreferences,
  getNotificationSettings,
  updateNotificationSettings,
} from "#/lib/preferences";
import { TeamSearch } from "#/components/team-search";
import {
  NotificationToggle,
  type NotificationSettings,
} from "#/components/notification-toggle";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import type { Sport } from "#/api/types";

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        {title}
      </h2>
      <div
        className="rounded-xl border p-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

// ── Sports config ─────────────────────────────────────────────────────────────

const SPORTS: { value: Sport; label: string }[] = [
  { value: "football", label: "⚽ Football" },
  { value: "afl", label: "🏈 AFL" },
  { value: "nba", label: "🏀 NBA" },
  { value: "tennis", label: "🎾 Tennis" },
];

// ── Settings page ─────────────────────────────────────────────────────────────

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Context provides session from dashboard beforeLoad
  const { session } = Route.useRouteContext() as {
    session: { user: { email: string } };
  };

  // ── Data loading ───────────────────────────────────────────────────────────

  const { data: prefs } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => getPreferences(),
  });

  const { data: notifSettings } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => getNotificationSettings(),
  });

  // Local state — initialised from loaded prefs
  const [defaultSport, setDefaultSport] = useState<Sport>("football");
  const [isDark, setIsDark] = useState(true);
  const [notifState, setNotifState] = useState<NotificationSettings>({
    preGame: true,
    goingLive: true,
    scoreUpdate: false,
  });

  useEffect(() => {
    if (prefs?.defaultSport) setDefaultSport(prefs.defaultSport as Sport);
    if (prefs?.theme) setIsDark(prefs.theme === "dark");
  }, [prefs]);

  useEffect(() => {
    if (notifSettings) {
      setNotifState({
        preGame: notifSettings.preGame ?? true,
        goingLive: notifSettings.goingLive ?? true,
        scoreUpdate: notifSettings.scoreUpdate ?? false,
      });
    }
  }, [notifSettings]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const prefsMutation = useMutation({
    mutationFn: (data: Parameters<typeof updatePreferences>[0]["data"]) =>
      updatePreferences({ data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  const notifMutation = useMutation({
    mutationFn: (
      data: Parameters<typeof updateNotificationSettings>[0]["data"],
    ) => updateNotificationSettings({ data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notification-settings"],
      });
    },
    onError: () => toast.error("Failed to save"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSportChange = (sport: Sport) => {
    setDefaultSport(sport);
    prefsMutation.mutate({ defaultSport: sport });
  };

  const handleThemeToggle = (dark: boolean) => {
    setIsDark(dark);
    const theme = dark ? "dark" : "light";
    document.documentElement.dataset["theme"] = theme;
    prefsMutation.mutate({ theme });
  };

  const handleNotifUpdate = (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    const updated = { ...notifState, [key]: value };
    setNotifState(updated);
    notifMutation.mutate({ [key]: value });
  };

  const handleSignOut = async () => {
    await signOut();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void navigate({ to: "/login" as any });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="page-wrap rise-in space-y-8 py-6">
      <h1
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--foreground)",
        }}
      >
        Settings
      </h1>

      {/* Default Sport */}
      <Section title="Default Sport">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm">Default sport on dashboard</p>
          <Select
            value={defaultSport}
            onValueChange={(v) => handleSportChange(v as Sport)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Appearance">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Toggle dark / light theme
            </p>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={handleThemeToggle}
            aria-label="Toggle dark mode"
          />
        </div>
      </Section>

      {/* Followed Teams */}
      <Section title="Followed Teams">
        <div className="space-y-6">
          {SPORTS.map(({ value, label }) => (
            <div key={value} className="space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {label}
              </p>
              <TeamSearch sport={value} />
              <Separator />
            </div>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <NotificationToggle
          settings={notifState}
          onUpdate={handleNotifUpdate}
          loading={notifMutation.isPending}
        />
      </Section>

      {/* Account */}
      <Section title="Account">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Email</span>
            <span>{session?.user?.email}</span>
          </div>
          <Separator />
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </Section>
    </div>
  );
}
