import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLiveScores } from "#/hooks/use-live-scores";
import { useFollowedTeams } from "#/hooks/use-followed-teams";
import { useStandings } from "#/hooks/use-standings";
import { Scorecard } from "#/components/scorecard";
import { Standings } from "#/components/standings";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import type { Sport } from "#/api/types";

// ─── Sport emoji map ──────────────────────────────────────────────────────────

const SPORT_EMOJI: Record<Sport, string> = {
  football: "⚽",
  afl: "🏈",
  nba: "🏀",
  tennis: "🎾",
};

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card
      className="border-[var(--border)]"
      style={{ backgroundColor: "var(--card)" }}
    >
      <div
        className="border-b px-4 py-2"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="h-3 w-32 animate-pulse rounded bg-[var(--muted)]" />
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--muted)]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted)]" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded bg-[var(--muted)]" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--muted)]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--muted)]" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded bg-[var(--muted)]" />
        </div>
      </div>
    </Card>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
      {children}
    </h2>
  );
}

// ─── SportTab ─────────────────────────────────────────────────────────────────

interface SportTabProps {
  sport: Sport;
}

export function SportTab({ sport }: SportTabProps) {
  const navigate = useNavigate();

  const { data: matches, isLoading, isError, refetch } = useLiveScores(sport);

  const { data: followedTeams = [] } = useFollowedTeams(sport);
  const { data: standings = [], isLoading: standingsLoading } =
    useStandings(sport);

  const followedTeamIds = followedTeams.map((t) => t.teamId);

  const handleMatchClick = (matchId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: `/dashboard/match/${sport}/${matchId}` as any });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <SectionHeading>Today's Matches</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Could not load matches. Check your connection and try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-[var(--border)]"
        >
          Retry
        </Button>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <span className="text-5xl" role="img" aria-label={sport}>
          {SPORT_EMOJI[sport]}
        </span>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          No matches today.
        </p>
      </div>
    );
  }

  // ── Your matches (followed teams only) ────────────────────────────────────
  const yourMatches =
    followedTeamIds.length > 0
      ? matches.filter(
          (m) =>
            followedTeamIds.includes(m.homeTeam.id) ||
            followedTeamIds.includes(m.awayTeam.id),
        )
      : [];

  return (
    <div className="space-y-8 p-4">
      {/* Your Matches */}
      {yourMatches.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Your Matches</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {yourMatches.map((match) => (
              <Scorecard
                key={match.id}
                match={match}
                followedTeamIds={followedTeamIds}
                onClick={() => handleMatchClick(match.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's Matches */}
      <section className="space-y-3">
        <SectionHeading>Today's Matches</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Scorecard
              key={match.id}
              match={match}
              followedTeamIds={followedTeamIds}
              onClick={() => handleMatchClick(match.id)}
            />
          ))}
        </div>
      </section>

      {/* Standings */}
      <section className="space-y-3">
        <SectionHeading>Standings</SectionHeading>
        <Standings
          standings={standings}
          followedTeamIds={followedTeamIds}
          sport={sport}
          loading={standingsLoading}
        />
      </section>
    </div>
  );
}
