import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthSession } from "#/lib/auth-guard";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw redirect({ to: "/dashboard" as any });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw redirect({ to: "/login" as any });
  },
  component: () => null,
});
