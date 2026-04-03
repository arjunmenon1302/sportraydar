import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  // Phase 9 will replace this with <SportTab /> components
  return (
    <div className="p-4 text-[var(--muted-foreground)]">
      Loading sport data…
    </div>
  );
}
