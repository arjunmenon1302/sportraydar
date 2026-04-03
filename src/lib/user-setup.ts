import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { notificationSettings, preferences } from "../../db/schema";
import { auth } from "./auth";

/** Inserts default preferences + notification_settings for the authenticated user. */
export const initUserData = createServerFn({ method: "POST" }).handler(
  async () => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error("Not authenticated");

    const userId = session.user.id;

    await db
      .insert(preferences)
      .values({ id: crypto.randomUUID(), userId })
      .onConflictDoNothing();

    await db
      .insert(notificationSettings)
      .values({ id: crypto.randomUUID(), userId })
      .onConflictDoNothing();
  },
);

/** Returns the preferences row for the authenticated user, or null. */
export const getUserPreferences = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return null;

    return (
      (await db.query.preferences.findFirst({
        where: eq(preferences.userId, session.user.id),
      })) ?? null
    );
  },
);
