import { useQuery } from "@tanstack/react-query";
import { getStandingsBySport } from "#/api/server";
import type { Sport } from "#/api/types";

export function useStandings(sport: Sport, competitionCode?: string) {
  return useQuery({
    queryKey: ["standings", sport, competitionCode],
    queryFn: () => getStandingsBySport({ data: { sport, competitionCode } }),
    staleTime: 5 * 60_000, // standings don't change as fast as scores
  });
}
