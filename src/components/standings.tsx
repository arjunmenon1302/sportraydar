import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { Standing, Sport } from "#/api/types";
import { cn } from "#/lib/utils";

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      <td className="py-2 pr-3">
        <div className="h-3 w-4 animate-pulse rounded bg-[var(--muted)]" />
      </td>
      <td className="py-2 pr-3">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted)]" />
      </td>
      <td className="py-2 pr-3">
        <div className="h-3 w-6 animate-pulse rounded bg-[var(--muted)]" />
      </td>
      <td className="py-2 pr-3">
        <div className="h-3 w-6 animate-pulse rounded bg-[var(--muted)]" />
      </td>
      <td className="py-2">
        <div className="h-3 w-8 animate-pulse rounded bg-[var(--muted)]" />
      </td>
    </tr>
  );
}

// ─── Tennis "recent results" ──────────────────────────────────────────────────

function TennisResults({
  standings,
  followedTeamIds,
}: {
  standings: Standing[];
  followedTeamIds: string[];
}) {
  return (
    <div className="space-y-2">
      {standings.map((s) => {
        const isFollowed = followedTeamIds.includes(s.teamId);
        return (
          <div
            key={s.teamId}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2",
              isFollowed
                ? "bg-[var(--sport-accent)]/10"
                : "bg-[var(--muted)]/30",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-right text-xs text-[var(--muted-foreground)]">
                {s.position}
              </span>
              <span className="text-sm font-medium">{s.teamName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span>W: {s.won}</span>
              <span>L: {s.lost}</span>
              {s.points !== undefined && (
                <Badge variant="secondary">{s.points} pts</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Standings ────────────────────────────────────────────────────────────────

interface StandingsProps {
  standings: Standing[];
  followedTeamIds: string[];
  sport: Sport;
  loading?: boolean;
}

const DEFAULT_VISIBLE = 8;

export function Standings({
  standings,
  followedTeamIds,
  sport,
  loading = false,
}: StandingsProps) {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
        No standings available.
      </p>
    );
  }

  // Tennis: show "recent results" list instead of table
  if (sport === "tennis") {
    const visible = showAll ? standings : standings.slice(0, DEFAULT_VISIBLE);
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Recent Results
        </h3>
        <TennisResults standings={visible} followedTeamIds={followedTeamIds} />
        {standings.length > DEFAULT_VISIBLE && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-[var(--muted-foreground)]"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show less" : `Show all ${standings.length}`}
          </Button>
        )}
      </div>
    );
  }

  const visible = showAll ? standings : standings.slice(0, DEFAULT_VISIBLE);
  const hasPts = standings.some((s) => s.points !== undefined);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-left text-xs text-[var(--muted-foreground)]"
              style={{ borderColor: "var(--border)" }}
            >
              <th className="pb-2 pr-3 font-medium">#</th>
              <th className="pb-2 pr-3 font-medium">Team</th>
              <th className="pb-2 pr-3 text-right font-medium">P</th>
              <th className="pb-2 pr-3 text-right font-medium">W</th>
              {hasPts && <th className="pb-2 text-right font-medium">Pts</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const isFollowed = followedTeamIds.includes(s.teamId);
              return (
                <tr
                  key={s.teamId}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isFollowed
                      ? "bg-[var(--sport-accent)]/10"
                      : "hover:bg-[var(--muted)]/20",
                  )}
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="py-2 pr-3 text-xs text-[var(--muted-foreground)]">
                    {s.position}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={cn(
                        "font-medium",
                        isFollowed && "text-[var(--sport-accent)]",
                      )}
                    >
                      {s.teamName}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-[var(--muted-foreground)]">
                    {s.played}
                  </td>
                  <td className="py-2 pr-3 text-right text-[var(--muted-foreground)]">
                    {s.won}
                  </td>
                  {hasPts && (
                    <td className="py-2 text-right font-semibold">
                      {s.points ?? "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {standings.length > DEFAULT_VISIBLE && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-[var(--muted-foreground)]"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show less" : `Show all ${standings.length}`}
        </Button>
      )}
    </div>
  );
}
