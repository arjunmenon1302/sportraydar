import { useRef, useEffect, useState } from "react";
import { useMatchDetail } from "#/hooks/use-match-detail";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import type { Sport, MatchEvent } from "#/api/types";
import { cn } from "#/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function eventEmoji(type: string): string {
  switch (type) {
    case "goal":
      return "⚽";
    case "yellowCard":
      return "🟨";
    case "redCard":
      return "🟥";
    case "substitution":
      return "🔄";
    default:
      return "•";
  }
}

// ─── Team crest ───────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function TeamCrest({ name, crest }: { name: string; crest?: string }) {
  if (crest) {
    return (
      <img
        src={crest}
        alt={name}
        className="h-16 w-16 rounded-md object-contain"
      />
    );
  }
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)] text-xl font-bold">
      {initials(name)}
    </div>
  );
}

// ─── Score with flash ─────────────────────────────────────────────────────────

function ScoreDisplay({ score }: { score: number | null }) {
  const [flash, setFlash] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (prevScore.current !== score && prevScore.current !== null) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      prevScore.current = score;
      return () => clearTimeout(t);
    }
    prevScore.current = score;
  }, [score]);

  return (
    <span
      className={cn(
        "rounded px-2 text-6xl font-bold leading-none",
        flash && "score-flash",
      )}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {score ?? "—"}
    </span>
  );
}

// ─── Match event ──────────────────────────────────────────────────────────────

function EventRow({ event }: { event: MatchEvent }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-10 shrink-0 text-right text-xs text-[var(--muted-foreground)]">
        {event.minute !== undefined ? `${event.minute}'` : "—"}
      </span>
      <span>{eventEmoji(event.type)}</span>
      <div className="min-w-0">
        <span className="font-medium">{event.player ?? event.team}</span>
        {event.player && (
          <span className="ml-1 text-[var(--muted-foreground)]">
            ({event.team})
          </span>
        )}
        {event.detail && (
          <span className="ml-1 text-xs text-[var(--muted-foreground)]">
            — {event.detail}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function MatchDetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Score area */}
      <div className="flex items-center justify-center gap-8 py-8">
        <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
        <div className="h-14 w-32 animate-pulse rounded bg-[var(--muted)]" />
        <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
      </div>
      {/* Events */}
      <div className="space-y-2">
        {(["60%", "45%", "72%", "50%", "65%"] as const).map((w, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-4 w-10 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-4 w-4 animate-pulse rounded bg-[var(--muted)]" />
            <div
              className="h-4 animate-pulse rounded bg-[var(--muted)]"
              style={{ width: w }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MatchDetail ──────────────────────────────────────────────────────────────

interface MatchDetailProps {
  sport: Sport;
  matchId: string;
}

export function MatchDetail({ sport, matchId }: MatchDetailProps) {
  const {
    data: match,
    isLoading,
    isError,
    refetch,
  } = useMatchDetail(sport, matchId);

  if (isLoading) return <MatchDetailSkeleton />;

  if (isError || !match) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Could not load match details.
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm text-[var(--sport-accent)] underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const isLive = match.status === "live";
  const events = match.events ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      {/* Competition */}
      <p className="text-center text-xs tracking-wider text-[var(--muted-foreground)] uppercase">
        {match.competition}
      </p>

      {/* Score hero */}
      <Card
        className="border-[var(--border)]"
        style={{ backgroundColor: "var(--card)" }}
      >
        <CardContent className="px-4 py-6">
          <div className="flex items-center justify-center gap-4">
            {/* Home */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <TeamCrest
                name={match.homeTeam.name}
                crest={match.homeTeam.crest}
              />
              <span className="text-center text-sm font-medium leading-tight">
                {match.homeTeam.name}
              </span>
            </div>

            {/* Scores */}
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <ScoreDisplay score={match.homeTeam.score} />
                <span
                  className="text-3xl text-[var(--muted-foreground)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  —
                </span>
                <ScoreDisplay score={match.awayTeam.score} />
              </div>

              {/* Status */}
              {isLive && (
                <div className="flex items-center gap-1">
                  <span
                    className="live-dot h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#ef4444" }}
                  />
                  <Badge
                    className="text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--sport-accent)",
                      color: "var(--background)",
                      border: "none",
                    }}
                  >
                    LIVE
                  </Badge>
                </div>
              )}
              {match.status === "finished" && (
                <Badge variant="secondary">Full Time</Badge>
              )}
              {match.status === "scheduled" && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatKickoff(match.startTime)}
                </span>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <TeamCrest
                name={match.awayTeam.name}
                crest={match.awayTeam.crest}
              />
              <span className="text-center text-sm font-medium leading-tight">
                {match.awayTeam.name}
              </span>
            </div>
          </div>

          {/* Live poll note */}
          {isLive && (
            <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
              Live — updates every 30s
            </p>
          )}
        </CardContent>
      </Card>

      {/* Match events */}
      <Card
        className="border-[var(--border)]"
        style={{ backgroundColor: "var(--card)" }}
      >
        <CardContent className="px-4 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Match Events
          </h2>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
              No events recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event, idx) => (
                <EventRow key={idx} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match info */}
      {(match.venue || match.startTime) && (
        <Card
          className="border-[var(--border)]"
          style={{ backgroundColor: "var(--card)" }}
        >
          <CardContent className="px-4 py-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Match Info
            </h2>
            <div className="space-y-1 text-sm">
              {match.venue && (
                <div className="flex gap-2">
                  <span className="text-[var(--muted-foreground)]">Venue</span>
                  <span>{match.venue}</span>
                </div>
              )}
              {match.startTime && (
                <div className="flex gap-2">
                  <span className="text-[var(--muted-foreground)]">
                    Kickoff
                  </span>
                  <span>{formatKickoff(match.startTime)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
