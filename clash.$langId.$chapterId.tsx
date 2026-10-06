import { createFileRoute, Link } from "@tanstack/react-router";
import { ClashGame } from "@/components/clash-game";
import { getChapter, getTrack } from "@/lib/curriculum";

export const Route = createFileRoute("/clash/$langId/$chapterId")({
  component: ClashRoute,
});

function ClashRoute() {
  const { langId, chapterId } = Route.useParams();
  const track = getTrack(langId);
  const chapter = getChapter(langId, chapterId);
  if (!track || !chapter) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-fg">
        <p className="text-sm text-muted">That clash is missing.</p>
        <Link to="/learn" className="mt-4 text-sm">
          Back to Learn
        </Link>
      </div>
    );
  }
  return <ClashGame key={`${langId}:${chapterId}`} track={track} chapter={chapter} />;
}
