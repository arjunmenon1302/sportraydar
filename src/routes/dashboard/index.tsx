import { createFileRoute } from "@tanstack/react-router";
import { SportTab } from "#/components/sport-tab";
import { useSportContext } from "../dashboard";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { activeSport } = useSportContext();
  return <SportTab sport={activeSport} />;
}
