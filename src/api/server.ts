import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as footballApi from "./football";
import * as aflApi from "./afl";
import * as nbaApi from "./nba";
import * as tennisApi from "./tennis";

const sportSchema = z.enum(["football", "afl", "nba", "tennis"]);

export const getMatchesBySport = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sport: sportSchema }))
  .handler(async ({ data }) => {
    switch (data.sport) {
      case "football":
        return footballApi.getTodaysMatches();
      case "afl":
        return aflApi.getTodaysMatches();
      case "nba":
        return nbaApi.getTodaysMatches();
      case "tennis":
        return tennisApi.getTodaysMatches();
    }
  });

export const getMatchDetailBySport = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sport: sportSchema, id: z.string().min(1) }))
  .handler(async ({ data }) => {
    switch (data.sport) {
      case "football":
        return footballApi.getMatchDetail(data.id);
      case "afl":
        return aflApi.getMatchDetail(data.id);
      case "nba":
        return nbaApi.getMatchDetail(data.id);
      case "tennis":
        return tennisApi.getMatchDetail(data.id);
    }
  });

export const getStandingsBySport = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      sport: sportSchema,
      competitionCode: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    switch (data.sport) {
      case "football":
        return footballApi.getStandings(data.competitionCode);
      case "afl":
        return aflApi.getStandings();
      case "nba":
        return nbaApi.getStandings();
      case "tennis":
        return tennisApi.getStandings();
    }
  });

export const searchTeamsBySport = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sport: sportSchema, query: z.string().min(1) }))
  .handler(async ({ data }) => {
    switch (data.sport) {
      case "football":
        return footballApi.searchTeams(data.query);
      case "afl":
        return aflApi.searchTeams(data.query);
      case "nba":
        return nbaApi.searchTeams(data.query);
      case "tennis":
        return tennisApi.searchPlayers(data.query);
    }
  });
