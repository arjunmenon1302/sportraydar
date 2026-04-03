import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./auth";

/** Returns the current session or null. Safe to call in loaders. */
export const getAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    return auth.api.getSession({ headers: request.headers });
  },
);

/** Returns the session or throws a redirect to /login. Use in protected route loaders. */
export const requireAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session) throw redirect({ to: "/login" as any });
    return session;
  },
);
