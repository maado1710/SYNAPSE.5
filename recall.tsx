import { createFileRoute } from "@tanstack/react-router";
import { ClashGame } from "@/components/clash-game";
import { TRACKS } from "@/lib/curriculum";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/recall")({ component: RecallRoute });

function RecallRoute() {
  const selected = useApp((s) => s.selectedTracks);
  const track = TRACKS.find((t) => selected.includes(t.id)) ?? TRACKS[0];
  if (!track) return null;
  return <ClashGame track={track} practice />;
}
