import { createFileRoute, Link } from "@tanstack/react-router";
import { MatchDetail } from "#/components/match-detail";
import type { Sport } from "#/api/types";

export const Route = createFileRoute("/dashboard/match/$sport/$id")({
  component: MatchDetailPage,
});

function MatchDetailPage() {
  const { sport, id } = Route.useParams();

  return (
    <div className="page-wrap py-6 rise-in">
      <Link
        to="/dashboard"
        className="nav-link mb-4 inline-flex items-center gap-1 text-sm"
      >
        ← Back
      </Link>

      <MatchDetail sport={sport as Sport} matchId={id} />
    </div>
  );
}
