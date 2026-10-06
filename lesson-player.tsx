import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { Chapter, Lesson, Track } from "@/lib/curriculum";
import { beginQuestions, isFinished, resolveQuestion, startFlow } from "@/lib/lesson-flow";
import { preloadPython } from "@/lib/pyrunner";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { PlayFrame } from "@/components/shell";
import { QuestionCard } from "@/components/question-card";

export function LessonPlayer({
  track,
  chapter,
  lesson,
}: {
  track: Track;
  chapter: Chapter;
  lesson: Lesson;
}) {
  const navigate = useNavigate();
  const completeLesson = useApp((s) => s.completeLesson);
  const [flow, setFlow] = useState(() => startFlow(lesson.questions));

  const { step, queue } = flow;
  const total = 1 + queue.length;
  const done = isFinished(flow);
  const question = step >= 1 ? (queue[step - 1] ?? null) : null;
  const firstTryCorrect = flow.firstTry.filter((r) => r.correct).length;

  useEffect(() => {
    if (lesson.questions.some((q) => q.kind === "code")) preloadPython();
  }, [lesson]);

  function advance(next: typeof flow) {
    setFlow(next);
    if (isFinished(next)) completeLesson(track.id, chapter.id, lesson.id, next.firstTry);
  }

  const lessonIdx = chapter.lessons.findIndex((l) => l.id === lesson.id);
  const nextInChapter = chapter.lessons[lessonIdx + 1];
  const nextChapter = track.chapters[track.chapters.findIndex((c) => c.id === chapter.id) + 1];

  function goLesson(chapterId: string, lessonId: string) {
    navigate({
      to: "/lesson/$langId/$chapterId/$lessonId",
      params: { langId: track.id, chapterId, lessonId },
    });
  }

  return (
    <PlayFrame
      title={`${track.name} · ${lesson.title}`}
      onClose={() => navigate({ to: "/learn/$langId", params: { langId: track.id } })}
      trailing={
        <span className="text-xs tabular-nums text-muted">
          {Math.min(step + 1, total)}/{total}
        </span>
      }
    >
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${(Math.min(step, total) / total) * 100}%` }}
        />
      </div>

      {step === 0 ? (
        <div className="flex flex-1 flex-col animate-fade-up">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Concept</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{lesson.teach.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{lesson.teach.body}</p>
          {lesson.teach.code ? <CodeBlock className="mt-5" code={lesson.teach.code} /> : null}
          {lesson.teach.note ? (
            <p className="mt-4 text-sm leading-relaxed text-faint">{lesson.teach.note}</p>
          ) : null}
          <div className="mt-auto pt-8">
            <Button className="w-full" size="lg" onClick={() => advance(beginQuestions(flow))}>
              Got it
            </Button>
          </div>
        </div>
      ) : null}

      {question ? (
        <QuestionCard
          // step is in the key so a retried question gets a fresh card even
          // when it is asked twice in a row.
          key={`${question.id}:${step}`}
          question={question}
          holdOnWrong
          onResolved={(correct, meta) =>
            advance(resolveQuestion(flow, question, correct, meta?.skipped))
          }
        />
      ) : null}

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
          <div className="flex size-16 items-center justify-center rounded-xl bg-elevated shadow-[var(--shadow-border)]">
            <Check className="size-7 text-good" strokeWidth={2.2} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Lesson complete</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            {flow.firstTry.length > 0
              ? `${firstTryCorrect}/${flow.firstTry.length} right on the first try. `
              : ""}
            Those ideas will come back in the Lab before they fade.
          </p>
          <div className="mt-8 flex w-full flex-col gap-2">
            {nextInChapter ? (
              <Button size="lg" className="w-full" onClick={() => goLesson(chapter.id, nextInChapter.id)}>
                Continue
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    navigate({
                      to: "/clash/$langId/$chapterId",
                      params: { langId: track.id, chapterId: chapter.id },
                    })
                  }
                >
                  Play {chapter.clash.name}
                </Button>
                {nextChapter?.lessons[0] ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full"
                    onClick={() => goLesson(nextChapter.id, (nextChapter.lessons[0] as Lesson).id)}
                  >
                    Skip to next chapter
                  </Button>
                ) : null}
              </>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate({ to: "/learn/$langId", params: { langId: track.id } })}
            >
              Back to {track.name}
            </Button>
          </div>
        </div>
      ) : null}
    </PlayFrame>
  );
}
