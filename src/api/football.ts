import type { Match, MatchEvent, Standing } from "./types";

const BASE_URL = "https://api.football-data.org/v4";

function authHeaders(): HeadersInit | null {
  const key = process.env["VITE_FOOTBALL_API_KEY"];
  if (!key) return null;
  return { "X-Auth-Token": key };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// TODO: Verify exact shape of /matches response — assuming { matches: [...] }
function normaliseMatchStatus(status: string): Match["status"] {
  switch (status) {
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
      return "finished";
    case "POSTPONED":
    case "CANCELLED":
    case "SUSPENDED":
      return "postponed";
    default:
      return "scheduled";
  }
}

// TODO: Verify exact event type strings returned by the API
function normaliseEvent(raw: Record<string, unknown>): MatchEvent {
  return {
    minute: typeof raw["minute"] === "number" ? raw["minute"] : undefined,
    type: String(raw["type"] ?? "unknown"),
    team: String((raw["team"] as Record<string, unknown>)?.["name"] ?? ""),
    player:
      String((raw["player"] as Record<string, unknown>)?.["name"] ?? "") ||
      undefined,
    detail: typeof raw["detail"] === "string" ? raw["detail"] : undefined,
  };
}

// TODO: Verify exact shape of match object — assuming homeTeam/awayTeam have id, name, crest
function normaliseMatch(
  raw: Record<string, unknown>,
  sport: Match["sport"] = "football",
): Match {
  const home = raw["homeTeam"] as Record<string, unknown>;
  const away = raw["awayTeam"] as Record<string, unknown>;
  const score = raw["score"] as Record<string, unknown> | undefined;
  const fullTime = score?.["fullTime"] as Record<string, unknown> | undefined;
  const competition = raw["competition"] as Record<string, unknown> | undefined;

  const events = Array.isArray(raw["goals"])
    ? (raw["goals"] as Record<string, unknown>[]).map(normaliseEvent)
    : undefined;

  return {
    id: String(raw["id"]),
    sport,
    homeTeam: {
      id: String(home?.["id"] ?? ""),
      name: String(home?.["name"] ?? ""),
      crest: typeof home?.["crest"] === "string" ? home["crest"] : undefined,
      score: typeof fullTime?.["home"] === "number" ? fullTime["home"] : null,
    },
    awayTeam: {
      id: String(away?.["id"] ?? ""),
      name: String(away?.["name"] ?? ""),
      crest: typeof away?.["crest"] === "string" ? away["crest"] : undefined,
      score: typeof fullTime?.["away"] === "number" ? fullTime["away"] : null,
    },
    status: normaliseMatchStatus(String(raw["status"] ?? "")),
    startTime: String(raw["utcDate"] ?? new Date().toISOString()),
    competition: String(competition?.["name"] ?? ""),
    venue: typeof raw["venue"] === "string" ? raw["venue"] : undefined,
    events,
  };
}

export async function getTodaysMatches(): Promise<Match[]> {
  const headers = authHeaders();
  if (!headers) return [];
  const date = today();
  const res = await fetch(
    `${BASE_URL}/matches?dateFrom=${date}&dateTo=${date}`,
    { headers },
  );

  if (res.status === 429) return [];

  if (!res.ok) {
    throw new Error(`Failed to fetch football matches: ${res.statusText}`);
  }

  // TODO: Verify the top-level key — may be 'matches' or 'resultSet'
  const json = (await res.json()) as Record<string, unknown>;
  const matches = Array.isArray(json["matches"])
    ? (json["matches"] as Record<string, unknown>[])
    : [];

  return matches.map((m) => normaliseMatch(m));
}

export async function getMatchDetail(id: string): Promise<Match> {
  const headers = authHeaders();
  if (!headers) throw new Error("VITE_FOOTBALL_API_KEY is not configured");
  const res = await fetch(`${BASE_URL}/matches/${id}`, { headers });

  if (res.status === 429) {
    throw new Error("Rate limited — try again shortly");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch match detail: ${res.statusText}`);
  }

  // TODO: Detail endpoint may wrap in { match: {...} } — verify
  const json = (await res.json()) as Record<string, unknown>;
  return normaliseMatch(json);
}

export async function getStandings(
  competitionCode = "PL",
): Promise<Standing[]> {
  const headers = authHeaders();
  if (!headers) return [];
  const res = await fetch(
    `${BASE_URL}/competitions/${competitionCode}/standings`,
    { headers },
  );

  if (res.status === 429) return [];

  if (!res.ok) {
    throw new Error(`Failed to fetch standings: ${res.statusText}`);
  }

  // TODO: Verify shape — assuming { standings: [{ type: 'TOTAL', table: [...] }] }
  const json = (await res.json()) as Record<string, unknown>;
  const standings = json["standings"] as
    | Array<Record<string, unknown>>
    | undefined;
  const totalTable = standings?.find((s) => s["type"] === "TOTAL");
  const table = Array.isArray(totalTable?.["table"])
    ? (totalTable["table"] as Record<string, unknown>[])
    : [];

  return table.map((row) => {
    const team = row["team"] as Record<string, unknown> | undefined;
    return {
      position: Number(row["position"] ?? 0),
      teamId: String(team?.["id"] ?? ""),
      teamName: String(team?.["name"] ?? ""),
      played: Number(row["playedGames"] ?? 0),
      won: Number(row["won"] ?? 0),
      drawn: Number(row["draw"] ?? 0),
      lost: Number(row["lost"] ?? 0),
      points: Number(row["points"] ?? 0),
    };
  });
}

// Uses TheSportsDB free search — no API key required, covers football teams globally
export async function searchTeams(
  query: string,
): Promise<Array<{ id: string; name: string; crest?: string }>> {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`,
  );

  if (!res.ok) return [];

  const json = (await res.json()) as Record<string, unknown>;
  const teams = Array.isArray(json["teams"])
    ? (json["teams"] as Record<string, unknown>[])
    : [];

  // Filter to soccer/football teams only
  return teams
    .filter((t) => {
      const sport = String(t["strSport"] ?? "").toLowerCase();
      return sport === "soccer";
    })
    .map((t) => ({
      id: String(t["idTeam"]),
      name: String(t["strTeam"]),
      crest:
        typeof t["strBadge"] === "string" && t["strBadge"]
          ? String(t["strBadge"])
          : undefined,
    }));
}
