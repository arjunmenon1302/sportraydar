import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      // Delegate all HTTP methods to Better Auth's handler
      ANY: ({ request }) => auth.handler(request),
    },
  },
  // This route is API-only; it never renders a UI
  component: () => null,
});
