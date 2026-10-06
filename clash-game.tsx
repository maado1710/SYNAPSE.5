import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Chapter, Track } from "@/lib/curriculum";
import { chapterQuestions, tapQuestions } from "@/lib/curriculum";
import { useApp } from "@/lib/store";
import { shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlayFrame } from "@/components/shell";
import { QuestionCard } from "@/components/question-card";

export function ClashGame({
  track,
  chapter,
  practice = false,
}: {
  track: Track;
  chapter?: Chapter;
  practice?: boolean;
}) {
  const navigate = useNavigate();
  const winClash = useApp((s) => s.winClash);
  const awardRepeatXp = useApp((s) => s.awardRepeatXp);
  const reviewConcept = useApp((s) => s.reviewConcept);
  const deck = useMemo(() => {
    const qs = chapter
      ? chapterQuestions(chapter)
      : track.chapters.flatMap((c) => chapterQuestions(c));
    // Typing questions don't suit a timed, pressure game.
    return shuffle(tapQuestions(qs)).slice(0, 8);
  }, [track, chapter]);

  const [i, setI] = useState(0);
  const [hp, setHp] = useState(8);
  const [hearts, setHearts] = useState(3);
  const [combo, setCombo] = useState(0);
  const [end, setEnd] = useState<"win" | "lose" | null>(null);
  const q = deck[i];
  const maxHp = 8;

  function onResolved(correct: boolean) {
    if (!q || end) return;
    reviewConcept(track.id, q.concept, correct);
    if (correct) {
      const nextCombo = combo + 1;
      const dmg = nextCombo >= 3 ? 2 : 1;
      const nextHp = Math.max(0, hp - dmg);
      setCombo(nextCombo);
      setHp(nextHp);
      if (nextHp <= 0) {
        if (!practice && chapter) winClash(track.id, chapter.id);
        else awardRepeatXp(25);
        setEnd("win");
        return;
      }
      if (i >= deck.length - 1) {
        setEnd("lose");
        return;
      }
    } else {
      const nextHearts = hearts - 1;
      setCombo(0);
      setHearts(nextHearts);
      if (nextHearts <= 0) {
        setEnd("lose");
        return;
      }
      if (i >= deck.length - 1) {
        setEnd("lose");
        return;
      }
    }
    setI((n) => n + 1);
  }

  const title = chapter ? chapter.clash.name : "Recall clash";
  const nextChapter = chapter
    ? track.chapters[track.chapters.findIndex((c) => c.id === chapter.id) + 1]
    : undefined;

  return (
    <PlayFrame
      title={title}
      onClose={() => {
        if (practice) navigate({ to: "/lab" });
        else navigate({ to: "/learn/$langId", params: { langId: track.id } });
      }}
      trailing={
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, n) => (
            <Heart
              key={n}
              className="size-4"
              fill={n < hearts ? "var(--color-fg)" : "transparent"}
              stroke="var(--color-fg)"
              opacity={n < hearts ? 1 : 0.25}
            />
          ))}
        </div>
      }
    >
      <div className="mb-2 flex items-center justify-between text-xs tabular-nums text-muted">
        <span>{chapter?.clash.blurb ?? "Answer to drain the glitch."}</span>
        <span>combo {combo}</span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full bg-fg transition-[width] duration-200 ease-out"
          style={{ width: `${(hp / maxHp) * 100}%` }}
        />
      </div>

      {end === null && q ? (
        <QuestionCard key={q.id} question={q} onResolved={onResolved} />
      ) : null}

      {end === "win" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Cleared</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title} is gone</h2>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Retrieval under pressure is how a concept stops being a guess.
          </p>
          <div className="mt-8 flex w-full flex-col gap-2">
            {nextChapter ? (
              <Button
                size="lg"
                className="w-full"
                onClick={() =>
                  navigate({
                    to: "/lesson/$langId/$chapterId/$lessonId",
                    params: {
                      langId: track.id,
                      chapterId: nextChapter.id,
                      lessonId: nextChapter.lessons[0]?.id ?? "1",
                    },
                  })
                }
              >
                Next chapter
              </Button>
            ) : (
              <Button size="lg" className="w-full" onClick={() => navigate({ to: "/learn" })}>
                All tracks
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/lab" })}>
              To the Lab
            </Button>
          </div>
        </div>
      ) : null}

      {end === "lose" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
          <h2 className="text-2xl font-semibold tracking-tight">The glitch held</h2>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Missed recall is a map, not a verdict. Run the chapter again, then rematch.
          </p>
          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={() => {
              setI(0);
              setHp(8);
              setHearts(3);
              setCombo(0);
              setEnd(null);
            }}
          >
            Rematch
          </Button>
        </div>
      ) : null}
    </PlayFrame>
  );
}
