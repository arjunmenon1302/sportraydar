import { useEffect, useRef } from "react";
import { useLiveScores } from "#/hooks/use-live-scores";
import { useFollowedTeams } from "#/hooks/use-followed-teams";
import { useNotifications } from "#/hooks/use-notifications";
import type { Match, Sport } from "#/api/types";

interface NotificationSettings {
  preGame: boolean;
  goingLive: boolean;
  scoreUpdate: boolean;
}

const PRE_GAME_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function useScoreNotifications(
  sport: Sport,
  settings: NotificationSettings | null,
) {
  const { data: matches } = useLiveScores(sport);
  const { data: followedTeams } = useFollowedTeams(sport);
  const { sendNotification } = useNotifications();

  // Keyed by match id for O(1) lookup on each refetch
  const prevMatchesRef = useRef<Map<string, Match>>(new Map());

  useEffect(() => {
    if (
      !matches ||
      !followedTeams ||
      !settings ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const followedTeamIds = new Set(followedTeams.map((t) => t.teamId));

    const isFollowed = (match: Match) =>
      followedTeamIds.has(match.homeTeam.id) ||
      followedTeamIds.has(match.awayTeam.id);

    const matchLabel = (match: Match) =>
      `${match.homeTeam.name} vs ${match.awayTeam.name}`;

    const scoreLabel = (match: Match) =>
      `${match.homeTeam.name} ${match.homeTeam.score ?? 0}–${match.awayTeam.score ?? 0} ${match.awayTeam.name}`;

    const now = Date.now();
    const prev = prevMatchesRef.current;

    for (const match of matches) {
      if (!isFollowed(match)) continue;

      const previous = prev.get(match.id);
      const matchUrl = `/dashboard/match/${sport}/${match.id}`;

      // 1. Match went live
      if (
        settings.goingLive &&
        match.status === "live" &&
        previous?.status !== "live"
      ) {
        sendNotification("Starting now", matchLabel(match), { url: matchUrl });
      }

      // 2. Score changed
      if (settings.scoreUpdate && previous) {
        const homeChanged =
          match.homeTeam.score !== null &&
          match.homeTeam.score !== previous.homeTeam.score;
        const awayChanged =
          match.awayTeam.score !== null &&
          match.awayTeam.score !== previous.awayTeam.score;

        if (homeChanged || awayChanged) {
          sendNotification("Goal!", scoreLabel(match), { url: matchUrl });
        }
      }

      // 3. Pre-game alert — scheduled and starting within 15 min
      if (settings.preGame && match.status === "scheduled") {
        const kickoff = new Date(match.startTime).getTime();
        const msUntilKickoff = kickoff - now;
        const alreadyNotified = previous?.status === "scheduled";

        if (
          msUntilKickoff > 0 &&
          msUntilKickoff <= PRE_GAME_WINDOW_MS &&
          !alreadyNotified
        ) {
          sendNotification("Starting soon", `${matchLabel(match)} (15 min)`, {
            url: matchUrl,
          });
        }
      }
    }

    // Snapshot current matches for next comparison
    prevMatchesRef.current = new Map(matches.map((m) => [m.id, m]));
  }, [matches, followedTeams, settings, sendNotification, sport]);
}
