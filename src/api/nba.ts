import type { Match, Standing } from "./types";

const BASE_URL = "https://api.balldontlie.io/v1";

function authHeaders(): HeadersInit | null {
  const key = process.env["VITE_NBA_API_KEY"];
  if (!key) return null;
  return { Authorization: key };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// TODO: Verify exact status strings — balldontlie may use 'Final', 'In Progress', or period-based
function normaliseStatus(raw: Record<string, unknown>): Match["status"] {
  const status = String(raw["status"] ?? "");
  if (status === "Final") return "finished";
  // TODO: Confirm what in-progress games look like — may be a period string like '4th Qtr'
  if (/qtr|half|OT/i.test(status)) return "live";
  return "scheduled";
}

// TODO: Verify exact field names — based on balldontlie v1 docs
function normaliseMatch(raw: Record<string, unknown>): Match {
  const home = raw["home_team"] as Record<string, unknown> | undefined;
  const away = raw["visitor_team"] as Record<string, unknown> | undefined;

  return {
    id: String(raw["id"]),
    sport: "nba",
    homeTeam: {
      id: String(home?.["id"] ?? ""),
      name: String(home?.["full_name"] ?? home?.["name"] ?? ""),
      // TODO: balldontlie free tier may not provide logo URLs
      crest: undefined,
      score:
        raw["home_team_score"] != null ? Number(raw["home_team_score"]) : null,
    },
    awayTeam: {
      id: String(away?.["id"] ?? ""),
      name: String(away?.["full_name"] ?? away?.["name"] ?? ""),
      crest: undefined,
      score:
        raw["visitor_team_score"] != null
          ? Number(raw["visitor_team_score"])
          : null,
    },
    status: normaliseStatus(raw),
    // TODO: Verify date field name — may be 'date' (YYYY-MM-DD) without time component
    startTime:
      typeof raw["date"] === "string" ? raw["date"] : new Date().toISOString(),
    competition: "NBA",
    // TODO: Verify if venue/arena info is included in the game object
    venue: undefined,
  };
}

export async function getTodaysMatches(): Promise<Match[]> {
  const headers = authHeaders();
  if (!headers) return [];
  const date = today();
  const res = await fetch(`${BASE_URL}/games?dates[]=${date}`, { headers });

  if (res.status === 429) return [];

  if (!res.ok) {
    throw new Error(`Failed to fetch NBA matches: ${res.statusText}`);
  }

  // TODO: Verify top-level key — likely { data: [...], meta: {...} }
  const json = (await res.json()) as Record<string, unknown>;
  const games = Array.isArray(json["data"])
    ? (json["data"] as Record<string, unknown>[])
    : [];

  return games.map(normaliseMatch);
}

export async function getMatchDetail(id: string): Promise<Match> {
  const headers = authHeaders();
  if (!headers) throw new Error("VITE_NBA_API_KEY is not configured");
  const res = await fetch(`${BASE_URL}/games/${id}`, { headers });

  if (res.status === 429) {
    throw new Error("Rate limited — try again shortly");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch NBA match detail: ${res.statusText}`);
  }

  // TODO: Verify if single game is wrapped in { data: {...} } or returned directly
  const json = (await res.json()) as Record<string, unknown>;
  const game =
    json["data"] != null ? (json["data"] as Record<string, unknown>) : json;

  return normaliseMatch(game);
}

export async function getStandings(): Promise<Standing[]> {
  const headers = authHeaders();
  if (!headers) return [];
  // TODO: balldontlie v1 free tier may not have a dedicated standings endpoint
  // Falling back to team list — standings would need to be computed from season records
  const res = await fetch(`${BASE_URL}/teams`, { headers });

  if (res.status === 429) return [];

  if (!res.ok) {
    throw new Error(`Failed to fetch NBA teams: ${res.statusText}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const teams = Array.isArray(json["data"])
    ? (json["data"] as Record<string, unknown>[])
    : [];

  // Return teams as standings with unknown records — real standings require a paid endpoint
  return teams.map((t, index) => ({
    position: index + 1,
    teamId: String(t["id"]),
    teamName: String(t["full_name"] ?? t["name"] ?? ""),
    played: 0,
    won: 0,
    lost: 0,
    // TODO: Populate with real win/loss data once standings endpoint is confirmed
  }));
}

// Uses TheSportsDB free search — no API key required, covers NBA teams
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

  // Filter to basketball teams only
  return teams
    .filter((t) => {
      const sport = String(t["strSport"] ?? "").toLowerCase();
      return sport === "basketball";
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
