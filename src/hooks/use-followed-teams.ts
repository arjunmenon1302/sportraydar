import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { followedTeams } from "../../db/schema";
import { auth } from "#/lib/auth";
import type { Sport } from "#/api/types";

// ─── Validators ───────────────────────────────────────────────────────────────

const sportSchema = z.enum(["football", "afl", "nba", "tennis"]);

// ─── Server functions ─────────────────────────────────────────────────────────

type FollowedTeam = typeof followedTeams.$inferSelect;

const getFollowedTeamsServerFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sport: sportSchema.optional() }))
  .handler(async ({ data }): Promise<FollowedTeam[]> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return [];

    if (data.sport) {
      return db.query.followedTeams.findMany({
        where: and(
          eq(followedTeams.userId, session.user.id),
          eq(followedTeams.sport, data.sport),
        ),
      });
    }

    return db.query.followedTeams.findMany({
      where: eq(followedTeams.userId, session.user.id),
    });
  });

const toggleFollowTeamServerFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sport: sportSchema,
      teamId: z.string().min(1),
      teamName: z.string().min(1),
      teamCrest: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error("Not authenticated");

    const existing = await db.query.followedTeams.findFirst({
      where: and(
        eq(followedTeams.userId, session.user.id),
        eq(followedTeams.sport, data.sport),
        eq(followedTeams.teamId, data.teamId),
      ),
    });

    if (existing) {
      await db
        .delete(followedTeams)
        .where(
          and(
            eq(followedTeams.userId, session.user.id),
            eq(followedTeams.sport, data.sport),
            eq(followedTeams.teamId, data.teamId),
          ),
        );
      return { action: "unfollowed" as const };
    }

    await db.insert(followedTeams).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      sport: data.sport,
      teamId: data.teamId,
      teamName: data.teamName,
      teamCrest: data.teamCrest,
    });

    return { action: "followed" as const };
  });

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useFollowedTeams(sport?: Sport) {
  return useQuery({
    queryKey: ["followedTeams", sport],
    queryFn: () => getFollowedTeamsServerFn({ data: { sport } }),
  });
}

export function useToggleFollowTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (team: {
      sport: Sport;
      teamId: string;
      teamName: string;
      teamCrest?: string;
    }) => toggleFollowTeamServerFn({ data: team }),

    onMutate: async (team) => {
      await queryClient.cancelQueries({ queryKey: ["followedTeams"] });

      const previousAll = queryClient.getQueryData<FollowedTeam[]>([
        "followedTeams",
        undefined,
      ]);
      const previousBySport = queryClient.getQueryData<FollowedTeam[]>([
        "followedTeams",
        team.sport,
      ]);

      const isFollowed = previousBySport?.some((t) => t.teamId === team.teamId);

      const updateCache = (
        current: FollowedTeam[] | undefined,
      ): FollowedTeam[] | undefined => {
        if (!current) return current;
        if (isFollowed) {
          return current.filter(
            (t) => !(t.teamId === team.teamId && t.sport === team.sport),
          );
        }
        const optimistic: FollowedTeam = {
          id: `optimistic-${team.teamId}`,
          userId: "",
          sport: team.sport,
          teamId: team.teamId,
          teamName: team.teamName,
          teamCrest: team.teamCrest ?? null,
        };
        return [...current, optimistic];
      };

      queryClient.setQueryData<FollowedTeam[]>(
        ["followedTeams", undefined],
        updateCache,
      );
      queryClient.setQueryData<FollowedTeam[]>(
        ["followedTeams", team.sport],
        updateCache,
      );

      return { previousAll, previousBySport };
    },

    onError: (_err, team, context) => {
      if (context?.previousAll !== undefined) {
        queryClient.setQueryData(
          ["followedTeams", undefined],
          context.previousAll,
        );
      }
      if (context?.previousBySport !== undefined) {
        queryClient.setQueryData(
          ["followedTeams", team.sport],
          context.previousBySport,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["followedTeams"] });
    },
  });
}
