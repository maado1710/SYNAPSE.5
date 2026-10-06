import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { reviewQuestions } from "@/lib/progress";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PlayFrame } from "@/components/shell";
import { QuestionCard } from "@/components/question-card";

const SECONDS = 14;

export function FlashGame() {
  const navigate = useNavigate();
  const awardXp = useApp((s) => s.awardXp);
  const reviewConcept = useApp((s) => s.reviewConcept);
  const [deck] = useState(() => reviewQuestions(10));
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);
  const comboRef = useRef(0);
  const iRef = useRef(0);
  const doneRef = useRef(false);

  const current = deck[i];

  function advance(correct: boolean) {
    if (doneRef.current) return;
    const currentItem = deck[iRef.current];
    if (!currentItem) return;
    reviewConcept(currentItem.track.id, currentItem.question.concept, correct);
    if (correct) {
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      setBest((b) => Math.max(b, nextCombo));
      setHits((h) => h + 1);
      setScore((s) => s + 8 + Math.min(5, nextCombo) * 2);
    } else {
      comboRef.current = 0;
      setCombo(0);
    }
    if (iRef.current >= deck.length - 1) {
      doneRef.current = true;
      setDone(true);
      return;
    }
    iRef.current += 1;
    setI(iRef.current);
    setLeft(SECONDS);
  }

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          advance(false);
          return SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, done]);

  useEffect(() => {
    if (done) awardXp(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <PlayFrame
      title="Flash strike"
      onClose={() => navigate({ to: "/lab" })}
      trailing={
        <span className="text-xs tabular-nums text-muted">
          {Math.min(i + 1, deck.length)}/{deck.length}
        </span>
      }
    >
      {!done && current ? (
        <>
          <div className="mb-1 flex items-center justify-between text-xs tabular-nums text-muted">
            <span>
              {left}s · combo {combo}
            </span>
            <span>{current.track.name}</span>
          </div>
          <div className="mb-5 h-1 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full bg-accent transition-[width] duration-1000 ease-linear"
              style={{ width: `${(left / SECONDS) * 100}%` }}
            />
          </div>
          <QuestionCard
            key={current.question.id}
            question={current.question}
            onResolved={(ok) => advance(ok)}
          />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Round over</p>
          <h2 className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{score} XP</h2>
          <p className="mt-2 text-sm text-muted">
            {hits}/{deck.length} correct · best combo {best}
          </p>
          <Button className="mt-8 w-full" size="lg" onClick={() => navigate({ to: "/lab" })}>
            Back to Lab
          </Button>
        </div>
      )}
    </PlayFrame>
  );
}
