import { useQuery } from "@tanstack/react-query";
import { getMatchDetailBySport } from "#/api/server";
import type { Sport } from "#/api/types";

export function useMatchDetail(sport: Sport, matchId: string) {
  return useQuery({
    queryKey: ["match", sport, matchId],
    queryFn: () => getMatchDetailBySport({ data: { sport, id: matchId } }),
    refetchInterval: (query) =>
      query.state.data?.status === "live" ? 30_000 : false,
  });
}
