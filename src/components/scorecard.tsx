import { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import type { Match } from "#/api/types";
import { cn } from "#/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Deterministic colour from team name so it's stable between renders
function teamColour(name: string): string {
  const palette = [
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f59e0b",
    "#8b5cf6",
    "#3b82f6",
    "#ef4444",
    "#10b981",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

// ─── Team crest ───────────────────────────────────────────────────────────────

function TeamCrest({
  name,
  crest,
  size = 28,
}: {
  name: string;
  crest?: string;
  size?: number;
}) {
  if (crest) {
    return (
      <img
        src={crest}
        alt={name}
        width={size}
        height={size}
        className="rounded-sm object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full text-xs font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: teamColour(name),
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Score cell with flash on change ─────────────────────────────────────────

function ScoreCell({ score }: { score: number | null }) {
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
      key={score ?? "null"}
      className={cn(
        "min-w-[2.5rem] rounded px-1 text-center text-4xl font-bold leading-none",
        flash && "score-flash",
      )}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {score ?? "—"}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  startTime,
}: Pick<Match, "status" | "startTime">) {
  if (status === "live") {
    return (
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
    );
  }
  if (status === "finished") {
    return <Badge variant="secondary">FT</Badge>;
  }
  if (status === "postponed") {
    return (
      <Badge variant="outline" className="text-[var(--muted-foreground)]">
        PPD
      </Badge>
    );
  }
  // scheduled
  return (
    <span className="text-xs text-[var(--muted-foreground)]">
      {formatTime(startTime)}
    </span>
  );
}

// ─── Scorecard ────────────────────────────────────────────────────────────────

interface ScorecardProps {
  match: Match;
  followedTeamIds: string[];
  onClick?: () => void;
}

export function Scorecard({ match, followedTeamIds, onClick }: ScorecardProps) {
  const isFollowed =
    followedTeamIds.includes(match.homeTeam.id) ||
    followedTeamIds.includes(match.awayTeam.id);

  return (
    <Card
      className={cn(
        "cursor-pointer border transition-colors hover:bg-[#1a1a1a]",
        isFollowed ? "border-[var(--sport-accent)]" : "border-[var(--border)]",
      )}
      style={{ backgroundColor: "var(--card)" }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {/* Competition + time header */}
      <div
        className="flex items-center justify-between border-b px-4 py-1.5"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="truncate text-xs text-[var(--muted-foreground)]">
          {match.competition}
        </span>
        <StatusBadge status={match.status} startTime={match.startTime} />
      </div>

      <CardContent className="px-4 py-3">
        {/* Home team row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamCrest
              name={match.homeTeam.name}
              crest={match.homeTeam.crest}
            />
            <span className="truncate text-sm font-medium">
              {match.homeTeam.name}
            </span>
          </div>
          <ScoreCell score={match.homeTeam.score} />
        </div>

        {/* Away team row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamCrest
              name={match.awayTeam.name}
              crest={match.awayTeam.crest}
            />
            <span className="truncate text-sm font-medium">
              {match.awayTeam.name}
            </span>
          </div>
          <ScoreCell score={match.awayTeam.score} />
        </div>
      </CardContent>
    </Card>
  );
}
