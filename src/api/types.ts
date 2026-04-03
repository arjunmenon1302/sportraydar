export type Sport = "football" | "afl" | "nba" | "tennis";

export interface Match {
  id: string;
  sport: Sport;
  homeTeam: { id: string; name: string; crest?: string; score: number | null };
  awayTeam: { id: string; name: string; crest?: string; score: number | null };
  status: "scheduled" | "live" | "finished" | "postponed";
  startTime: string; // ISO 8601
  competition: string;
  venue?: string;
  events?: MatchEvent[];
}

export interface MatchEvent {
  minute?: number;
  type: string; // 'goal', 'card', 'substitution', etc.
  team: string;
  player?: string;
  detail?: string;
}

export interface Standing {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn?: number;
  lost: number;
  points?: number;
}
