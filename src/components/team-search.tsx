import { useState, useEffect, useRef } from "react";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { searchTeamsBySport } from "#/api/server";
import {
  useFollowedTeams,
  useToggleFollowTeam,
} from "#/hooks/use-followed-teams";
import type { Sport } from "#/api/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamResult {
  id: string;
  name: string;
  crest?: string;
}

// ─── Team initials avatar ──────────────────────────────────────────────────────

function TeamAvatar({ name, crest }: { name: string; crest?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (crest) {
    return (
      <img
        src={crest}
        alt={name}
        width={32}
        height={32}
        className="rounded-sm object-contain"
        style={{ width: 32, height: 32, flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-bold"
      aria-hidden
    >
      {initials}
    </div>
  );
}

// ─── Team row ─────────────────────────────────────────────────────────────────

interface TeamRowProps {
  team: TeamResult;
  isFollowed: boolean;
  onToggle: () => void;
  isPending: boolean;
}

function TeamRow({ team, isFollowed, onToggle, isPending }: TeamRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--muted)]/30">
      <div className="flex min-w-0 items-center gap-3">
        <TeamAvatar name={team.name} crest={team.crest} />
        <span className="truncate text-sm font-medium">{team.name}</span>
      </div>
      <Button
        size="sm"
        variant={isFollowed ? "secondary" : "default"}
        onClick={onToggle}
        disabled={isPending}
        className="shrink-0 text-xs"
        style={
          !isFollowed
            ? {
                backgroundColor: "var(--sport-accent)",
                color: "var(--background)",
              }
            : undefined
        }
      >
        {isFollowed ? "Unfollow" : "Follow"}
      </Button>
    </div>
  );
}

// ─── TeamSearch ───────────────────────────────────────────────────────────────

interface TeamSearchProps {
  sport: Sport;
  onToggle?: (team: TeamResult) => void;
}

export function TeamSearch({ sport, onToggle }: TeamSearchProps) {
  const isTennis = sport === "tennis";
  const placeholder = isTennis ? "Search players…" : "Search teams…";
  const emptyLabel = isTennis
    ? "Search for players to follow"
    : "Search for teams to follow";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeamResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: followedTeams = [] } = useFollowedTeams(sport);
  const { mutate: toggleFollow, isPending } = useToggleFollowTeam();

  const followedIds = new Set(followedTeams.map((t) => t.teamId));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const raw = await searchTeamsBySport({
          data: { sport, query: query.trim() },
        });
        // Normalise — server returns different shapes per sport API
        const normalised: TeamResult[] = (raw as TeamResult[]).map((r) => ({
          id: r.id,
          name: r.name,
          crest: r.crest,
        }));
        setResults(normalised);
      } catch {
        setError("Could not load results. Try again.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sport]);

  const handleToggle = (team: TeamResult) => {
    toggleFollow({
      sport,
      teamId: team.id,
      teamName: team.name,
      teamCrest: team.crest,
    });
    onToggle?.(team);
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-[var(--border)] bg-[var(--muted)] focus:border-[var(--sport-accent)]"
      />

      {searching && (
        <div className="space-y-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-[var(--muted)]"
            />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      {!searching && results.length === 0 && !error && (
        <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
          {query.trim() ? "No results found." : emptyLabel}
        </p>
      )}

      {!searching && results.length > 0 && (
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {results.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              isFollowed={followedIds.has(team.id)}
              onToggle={() => handleToggle(team)}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
