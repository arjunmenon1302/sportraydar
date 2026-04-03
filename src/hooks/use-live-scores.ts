import { useQuery } from "@tanstack/react-query";
import { getMatchesBySport } from "#/api/server";
import type { Sport } from "#/api/types";

export function useLiveScores(sport: Sport) {
  return useQuery({
    queryKey: ["scores", sport, "today"],
    queryFn: () => getMatchesBySport({ data: { sport } }),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });
}
