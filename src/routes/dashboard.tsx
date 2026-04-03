import { createContext, useContext, useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { requireAuthSession } from "#/lib/auth-guard";
import { signOut } from "#/lib/auth-client";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";

// ── Sport context ────────────────────────────────────────────────────────────

type Sport = "football" | "afl" | "nba" | "tennis";

interface SportContextValue {
  activeSport: Sport;
  setActiveSport: (sport: Sport) => void;
}

const SportContext = createContext<SportContextValue | null>(null);

export function useSportContext(): SportContextValue {
  const ctx = useContext(SportContext);
  if (!ctx)
    throw new Error("useSportContext must be used within dashboard layout");
  return ctx;
}

// ── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await requireAuthSession();
    return { session };
  },
  component: DashboardLayout,
});

// ── Sports config ─────────────────────────────────────────────────────────────

const SPORTS: { value: Sport; label: string }[] = [
  { value: "football", label: "⚽ Football" },
  { value: "afl", label: "🏈 AFL" },
  { value: "nba", label: "🏀 NBA" },
  { value: "tennis", label: "🎾 Tennis" },
];

// ── Layout component ──────────────────────────────────────────────────────────

function DashboardLayout() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();

  const [activeSport, setActiveSport] = useState<Sport>("football");

  const userInitial = session.user.email?.[0]?.toUpperCase() ?? "?";

  const handleSignOut = async () => {
    await signOut();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: "/login" as any });
  };

  return (
    <SportContext.Provider value={{ activeSport, setActiveSport }}>
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        {/* Header */}
        <header
          className="flex items-center justify-between border-b px-4 py-3"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <span
            className="text-xl font-bold tracking-widest text-[var(--sport-accent)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SPORTRAYDAR
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              <Avatar>
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
              <DropdownMenuItem
                onSelect={() =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  navigate({ to: "/dashboard/settings" as any })
                }
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Sport tabs */}
        <div
          className="border-b px-4 py-2"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <Tabs
            value={activeSport}
            onValueChange={(val) => setActiveSport(val as Sport)}
          >
            <TabsList className="w-full justify-start bg-transparent p-0">
              {SPORTS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className="flex-none">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div data-sport={activeSport} className="flex-1">
          <Outlet />
        </div>
      </div>
    </SportContext.Provider>
  );
}
