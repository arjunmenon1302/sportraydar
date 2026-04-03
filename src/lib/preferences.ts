import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db";
import {
  followedTeams,
  notificationSettings,
  preferences,
} from "../../db/schema";
import { auth } from "./auth";

const sportSchema = z.enum(["football", "afl", "nba", "tennis"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Not authenticated");
  return session;
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export const getPreferences = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireSession();
    return (
      (await db.query.preferences.findFirst({
        where: eq(preferences.userId, session.user.id),
      })) ?? null
    );
  },
);

export const updatePreferences = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      defaultSport: sportSchema.optional(),
      theme: z.string().optional(),
      onboardingComplete: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;

    const set: Partial<{
      defaultSport: string;
      theme: string;
      onboardingComplete: boolean;
    }> = {};
    if (data.defaultSport !== undefined) set.defaultSport = data.defaultSport;
    if (data.theme !== undefined) set.theme = data.theme;
    if (data.onboardingComplete !== undefined)
      set.onboardingComplete = data.onboardingComplete;

    await db
      .insert(preferences)
      .values({ id: crypto.randomUUID(), userId, ...set })
      .onConflictDoUpdate({ target: preferences.userId, set });

    const row = await db.query.preferences.findFirst({
      where: eq(preferences.userId, userId),
    });
    if (!row) throw new Error("Failed to upsert preferences");
    return row;
  });

// ─── Followed Teams ───────────────────────────────────────────────────────────

export const getFollowedTeams = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sport: sportSchema.optional() }))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;

    if (data.sport !== undefined) {
      return db.query.followedTeams.findMany({
        where: and(
          eq(followedTeams.userId, userId),
          eq(followedTeams.sport, data.sport),
        ),
      });
    }

    return db.query.followedTeams.findMany({
      where: eq(followedTeams.userId, userId),
    });
  });

export const addFollowedTeam = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sport: sportSchema,
      teamId: z.string(),
      teamName: z.string(),
      teamCrest: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;

    await db
      .insert(followedTeams)
      .values({
        id: crypto.randomUUID(),
        userId,
        sport: data.sport,
        teamId: data.teamId,
        teamName: data.teamName,
        teamCrest: data.teamCrest,
      })
      .onConflictDoNothing();

    const row = await db.query.followedTeams.findFirst({
      where: and(
        eq(followedTeams.userId, userId),
        eq(followedTeams.sport, data.sport),
        eq(followedTeams.teamId, data.teamId),
      ),
    });
    if (!row) throw new Error("Failed to add followed team");
    return row;
  });

export const removeFollowedTeam = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sport: sportSchema,
      teamId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;

    await db
      .delete(followedTeams)
      .where(
        and(
          eq(followedTeams.userId, userId),
          eq(followedTeams.sport, data.sport),
          eq(followedTeams.teamId, data.teamId),
        ),
      );
  });

// ─── Notification Settings ────────────────────────────────────────────────────

export const getNotificationSettings = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await requireSession();
  return (
    (await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.userId, session.user.id),
    })) ?? null
  );
});

export const updateNotificationSettings = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      preGame: z.boolean().optional(),
      goingLive: z.boolean().optional(),
      scoreUpdate: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;

    const set: Partial<{
      preGame: boolean;
      goingLive: boolean;
      scoreUpdate: boolean;
    }> = {};
    if (data.preGame !== undefined) set.preGame = data.preGame;
    if (data.goingLive !== undefined) set.goingLive = data.goingLive;
    if (data.scoreUpdate !== undefined) set.scoreUpdate = data.scoreUpdate;

    await db
      .insert(notificationSettings)
      .values({ id: crypto.randomUUID(), userId, ...set })
      .onConflictDoUpdate({ target: notificationSettings.userId, set });

    const row = await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.userId, userId),
    });
    if (!row) throw new Error("Failed to upsert notification settings");
    return row;
  });
