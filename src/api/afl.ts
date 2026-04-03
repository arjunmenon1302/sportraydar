import type { Match, Standing } from "./types";

const BASE_URL = "https://api.squiggle.com.au";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentYear(): number {
  return new Date().getFullYear();
}

// TODO: Verify exact status values returned by Squiggle API
function normaliseStatus(raw: Record<string, unknown>): Match["status"] {
  const isFinal = raw["is_final"];
  const complete = raw["complete"];

  if (isFinal === 1 || complete === 100) return "finished";

  // TODO: Verify how in-progress games are indicated — may use 'complete' between 1-99
  if (typeof complete === "number" && complete > 0 && complete < 100)
    return "live";

  return "scheduled";
}

// TODO: Verify exact field names — based on Squiggle docs: hteam, ateam, hscore, ascore
function normaliseMatch(raw: Record<string, unknown>): Match {
  return {
    id: String(raw["id"]),
    sport: "afl",
    homeTeam: {
      id: String(raw["hteamid"] ?? raw["hteam"] ?? ""),
      name: String(raw["hteam"] ?? ""),
      // TODO: Squiggle may not provide crest URLs — verify
      crest: undefined,
      score: raw["hscore"] != null ? Number(raw["hscore"]) : null,
    },
    awayTeam: {
      id: String(raw["ateamid"] ?? raw["ateam"] ?? ""),
      name: String(raw["ateam"] ?? ""),
      crest: undefined,
      score: raw["ascore"] != null ? Number(raw["ascore"]) : null,
    },
    status: normaliseStatus(raw),
    // TODO: Verify date field name — may be 'date' or 'localtime'
    startTime:
      typeof raw["date"] === "string" ? raw["date"] : new Date().toISOString(),
    // TODO: Verify competition/round field names
    competition: `AFL ${currentYear()} Round ${raw["round"] ?? ""}`.trim(),
    venue: typeof raw["venue"] === "string" ? raw["venue"] : undefined,
  };
}

export async function getTodaysMatches(): Promise<Match[]> {
  // TODO: Squiggle doesn't support date filtering directly — fetch by round and filter
  // This fetches the current year's games and filters by today's date
  const res = await fetch(
    `${BASE_URL}/?q=games;year=${currentYear()};complete=!100`,
    {
      headers: { "User-Agent": "Sportraydar/1.0" },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch AFL matches: ${res.statusText}`);
  }

  // TODO: Verify top-level key — likely { games: [...] }
  const json = (await res.json()) as Record<string, unknown>;
  const games = Array.isArray(json["games"])
    ? (json["games"] as Record<string, unknown>[])
    : [];

  const todayStr = today();
  return games
    .filter(
      (g) => typeof g["date"] === "string" && g["date"].startsWith(todayStr),
    )
    .map(normaliseMatch);
}

export async function getMatchDetail(id: string): Promise<Match> {
  const res = await fetch(`${BASE_URL}/?q=games;game=${id}`, {
    headers: { "User-Agent": "Sportraydar/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch AFL match detail: ${res.statusText}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const games = Array.isArray(json["games"])
    ? (json["games"] as Record<string, unknown>[])
    : [];

  if (games.length === 0) {
    throw new Error(`AFL match ${id} not found`);
  }

  return normaliseMatch(games[0]!);
}

export async function getStandings(): Promise<Standing[]> {
  const res = await fetch(`${BASE_URL}/?q=standings;year=${currentYear()}`, {
    headers: { "User-Agent": "Sportraydar/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch AFL standings: ${res.statusText}`);
  }

  // TODO: Verify shape — likely { standings: [...] }
  const json = (await res.json()) as Record<string, unknown>;
  const standings = Array.isArray(json["standings"])
    ? (json["standings"] as Record<string, unknown>[])
    : [];

  return standings.map((row, index) => ({
    position: Number(row["rank"] ?? index + 1),
    teamId: String(row["teamid"] ?? row["team"] ?? ""),
    teamName: String(row["name"] ?? row["team"] ?? ""),
    played: Number(row["played"] ?? 0),
    won: Number(row["wins"] ?? 0),
    // TODO: AFL doesn't have draws — confirm field name for losses
    lost: Number(row["losses"] ?? 0),
    points: Number(row["pts"] ?? 0),
  }));
}

export async function searchTeams(
  query: string,
): Promise<Array<{ id: string; name: string; crest?: string }>> {
  // Squiggle only has 18 teams — fetch all and filter client-side
  const res = await fetch(`${BASE_URL}/?q=teams`, {
    headers: { "User-Agent": "Sportraydar/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch AFL teams: ${res.statusText}`);
  }

  // TODO: Verify top-level key — likely { teams: [...] }
  const json = (await res.json()) as Record<string, unknown>;
  const teams = Array.isArray(json["teams"])
    ? (json["teams"] as Record<string, unknown>[])
    : [];

  const lower = query.toLowerCase();
  return teams
    .filter((t) =>
      String(t["name"] ?? "")
        .toLowerCase()
        .includes(lower),
    )
    .map((t) => ({
      id: String(t["id"]),
      name: String(t["name"]),
      // TODO: Verify if Squiggle provides logo URLs
      crest: typeof t["logo"] === "string" ? t["logo"] : undefined,
    }));
}
