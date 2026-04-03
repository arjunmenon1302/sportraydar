import type { Match, Standing } from "./types";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// TODO: Verify exact status/progress values from TheSportsDB
function normaliseStatus(raw: Record<string, unknown>): Match["status"] {
  const progress = raw["strProgress"];
  const status = String(raw["strStatus"] ?? "");

  if (status === "Match Finished" || progress === "100") return "finished";
  // TODO: Confirm how live/in-progress events are represented
  if (
    status === "In Progress" ||
    (typeof progress === "string" && Number(progress) > 0)
  ) {
    return "live";
  }
  return "scheduled";
}

// TODO: Verify exact field names — based on TheSportsDB event schema
// Tennis uses players as "home/away" rather than teams
function normaliseMatch(raw: Record<string, unknown>): Match {
  return {
    id: String(raw["idEvent"]),
    sport: "tennis",
    homeTeam: {
      // In tennis, "home" = first player listed
      id: String(raw["idHomeTeam"] ?? raw["idEvent"] ?? ""),
      name: String(raw["strHomeTeam"] ?? ""),
      // TODO: TheSportsDB may provide player badge/thumb via strHomeTeamBadge
      crest:
        typeof raw["strHomeTeamBadge"] === "string"
          ? raw["strHomeTeamBadge"]
          : undefined,
      score: raw["intHomeScore"] != null ? Number(raw["intHomeScore"]) : null,
    },
    awayTeam: {
      id: String(raw["idAwayTeam"] ?? ""),
      name: String(raw["strAwayTeam"] ?? ""),
      crest:
        typeof raw["strAwayTeamBadge"] === "string"
          ? raw["strAwayTeamBadge"]
          : undefined,
      score: raw["intAwayScore"] != null ? Number(raw["intAwayScore"]) : null,
    },
    status: normaliseStatus(raw),
    // TODO: Verify date/time field — may be 'dateEvent' + 'strTime' or 'strTimestamp'
    startTime:
      typeof raw["strTimestamp"] === "string"
        ? raw["strTimestamp"]
        : typeof raw["dateEvent"] === "string"
          ? raw["dateEvent"]
          : new Date().toISOString(),
    // TODO: Verify league/competition field name
    competition: String(raw["strLeague"] ?? "Tennis"),
    venue: typeof raw["strVenue"] === "string" ? raw["strVenue"] : undefined,
  };
}

export async function getTodaysMatches(): Promise<Match[]> {
  const date = today();
  const res = await fetch(`${BASE_URL}/eventsday.php?d=${date}&s=Tennis`);

  if (!res.ok) {
    throw new Error(`Failed to fetch tennis matches: ${res.statusText}`);
  }

  // TODO: Verify top-level key — TheSportsDB typically uses { events: [...] } or null when empty
  const json = (await res.json()) as Record<string, unknown>;
  const events = Array.isArray(json["events"])
    ? (json["events"] as Record<string, unknown>[])
    : [];

  return events.map(normaliseMatch);
}

export async function getMatchDetail(id: string): Promise<Match> {
  const res = await fetch(`${BASE_URL}/lookupevent.php?id=${id}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch tennis match detail: ${res.statusText}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const events = Array.isArray(json["events"])
    ? (json["events"] as Record<string, unknown>[])
    : [];

  if (events.length === 0) {
    throw new Error(`Tennis match ${id} not found`);
  }

  return normaliseMatch(events[0]!);
}

// Tennis doesn't have traditional standings — return recent results as a standings-like list
export async function getStandings(): Promise<Standing[]> {
  // Fetch recent events (last 7 days) as a proxy for "standings"
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const res = await fetch(`${BASE_URL}/eventsday.php?d=${pastDate}&s=Tennis`);

  if (!res.ok) {
    // Non-fatal — standings aren't critical for tennis
    return [];
  }

  const json = (await res.json()) as Record<string, unknown>;
  const events = Array.isArray(json["events"])
    ? (json["events"] as Record<string, unknown>[])
    : [];

  // Map finished matches to a standings-like format showing recent winners
  return events
    .filter((e) => String(e["strStatus"] ?? "") === "Match Finished")
    .map((e, index) => ({
      position: index + 1,
      // Use the winning player as the "team"
      teamId: String(e["idHomeTeam"] ?? e["idEvent"] ?? ""),
      teamName: String(e["strHomeTeam"] ?? ""),
      played: 1,
      won:
        Number(e["intHomeScore"] ?? 0) > Number(e["intAwayScore"] ?? 0) ? 1 : 0,
      lost:
        Number(e["intHomeScore"] ?? 0) < Number(e["intAwayScore"] ?? 0) ? 1 : 0,
    }));
}

// For tennis, search is by player name rather than team name
export async function searchPlayers(
  query: string,
): Promise<Array<{ id: string; name: string; crest?: string }>> {
  const res = await fetch(
    `${BASE_URL}/searchplayers.php?p=${encodeURIComponent(query)}&s=Tennis`,
  );

  if (!res.ok) {
    throw new Error(`Failed to search tennis players: ${res.statusText}`);
  }

  // TODO: Verify top-level key — likely { player: [...] } or { players: [...] }
  const json = (await res.json()) as Record<string, unknown>;
  const players = Array.isArray(json["player"])
    ? (json["player"] as Record<string, unknown>[])
    : Array.isArray(json["players"])
      ? (json["players"] as Record<string, unknown>[])
      : [];

  return players.map((p) => ({
    id: String(p["idPlayer"]),
    name: String(p["strPlayer"]),
    // TODO: Verify player thumb field name
    crest: typeof p["strThumb"] === "string" ? p["strThumb"] : undefined,
  }));
}
