import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { Shell } from "@/components/shell";
import { getTrack } from "@/lib/curriculum";
import { chapterDone, chapterUnlocked, trackProgress } from "@/lib/progress";
import { chapterKey, lessonKey } from "@/lib/utils";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/learn/$langId")({ component: TrackPage });

function TrackPage() {
  const { langId } = Route.useParams();
  const track = getTrack(langId);
  const completed = useApp((s) => s.completed);
  const clashWon = useApp((s) => s.clashWon);
  if (!track) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Track not found</h1>
        <Link to="/learn" className="mt-4 text-sm text-muted">
          Back to Learn
        </Link>
      </Shell>
    );
  }
  const p = trackProgress(track.id);

  return (
    <Shell>
      <p className="font-mono text-xs text-muted">{track.short}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{track.name}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{track.blurb}</p>
      <p className="mt-3 text-xs tabular-nums text-muted">
        {p.done}/{p.total} lessons
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {track.chapters.map((ch, i) => {
          const open = chapterUnlocked(track.id, ch.id);
          const lessonsDone = chapterDone(track.id, ch.id);
          const won = Boolean(clashWon[chapterKey(track.id, ch.id)]);
          return (
            <section key={ch.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-medium">
                  <span className="text-muted">0{i + 1}</span> {ch.title}
                </h2>
                {!open ? <Lock className="size-3.5 text-faint" /> : null}
              </div>
              <p className="mt-1 text-sm text-muted">{ch.summary}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                {ch.lessons.map((les) => {
                  const key = lessonKey(track.id, ch.id, les.id);
                  const done = Boolean(completed[key]);
                  const inner = (
                    <>
                      <span className="flex size-7 items-center justify-center rounded-xs bg-elevated">
                        {done ? (
                          <Check className="size-3.5 text-good" />
                        ) : (
                          <span className="text-[11px] tabular-nums text-muted">{les.id}</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{les.title}</span>
                        <span className="block text-xs text-muted">{les.minutes} min</span>
                      </span>
                    </>
                  );
                  if (!open) {
                    return (
                      <div
                        key={les.id}
                        className="flex items-center gap-3 rounded-md px-3 py-3 text-faint"
                      >
                        {inner}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={les.id}
                      to="/lesson/$langId/$chapterId/$lessonId"
                      params={{ langId: track.id, chapterId: ch.id, lessonId: les.id }}
                      className="flex items-center gap-3 rounded-md bg-surface px-3 py-3 shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.98]"
                    >
                      {inner}
                    </Link>
                  );
                })}
                {open && lessonsDone ? (
                  <Link
                    to="/clash/$langId/$chapterId"
                    params={{ langId: track.id, chapterId: ch.id }}
                    className="flex items-center gap-3 rounded-md bg-elevated px-3 py-3 transition-transform duration-150 active:scale-[0.98]"
                  >
                    <span className="flex size-7 items-center justify-center rounded-xs bg-bg font-mono text-[11px] text-accent">
                      Vs
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{ch.clash.name}</span>
                      <span className="block text-xs text-muted">
                        {won ? "Cleared · rematch" : "Chapter clash"}
                      </span>
                    </span>
                  </Link>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </Shell>
  );
}
