import { createFileRoute, Link } from "@tanstack/react-router";
import { LessonPlayer } from "@/components/lesson-player";
import { getLesson, getTrack, getChapter } from "@/lib/curriculum";

export const Route = createFileRoute("/lesson/$langId/$chapterId/$lessonId")({
  component: LessonRoute,
});

function LessonRoute() {
  const { langId, chapterId, lessonId } = Route.useParams();
  const track = getTrack(langId);
  const chapter = getChapter(langId, chapterId);
  const lesson = getLesson(langId, chapterId, lessonId);
  if (!track || !chapter || !lesson) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-fg">
        <p className="text-sm text-muted">That lesson is missing.</p>
        <Link to="/learn" className="mt-4 text-sm">
          Back to Learn
        </Link>
      </div>
    );
  }
  // key: tapping Continue changes the params but keeps this route mounted, so
  // without it the next lesson inherited the previous lesson's finished state.
  return (
    <LessonPlayer
      key={`${langId}:${chapterId}:${lessonId}`}
      track={track}
      chapter={chapter}
      lesson={lesson}
    />
  );
}
