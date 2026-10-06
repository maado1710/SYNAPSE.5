import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "@/lib/curriculum";
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { CodeQuestion } from "@/components/code-question";

export type ResolveMeta = {
  /** The learner couldn't attempt it (e.g. the Python runner is offline). Not a wrong answer. */
  skipped?: boolean;
};

/** Shuffle the lines, but never hand back the already-solved order. */
function shuffledNotSolved(lines: string[]) {
  if (new Set(lines).size < 2) return shuffle(lines);
  for (let n = 0; n < 8; n++) {
    const next = shuffle(lines);
    if (next.some((line, i) => line !== lines[i])) return next;
  }
  return [...lines.slice(1), lines[0] as string];
}

export function QuestionCard({
  question,
  onResolved,
  holdOnWrong = false,
}: {
  question: Question;
  onResolved: (correct: boolean, meta?: ResolveMeta) => void;
  /**
   * When true, a wrong answer stays on screen (explanation + Continue button)
   * until the learner taps, instead of auto-advancing. Use it in lessons; leave
   * it off for timed games.
   */
  holdOnWrong?: boolean;
}) {
  const [choicePick, setChoicePick] = useState<number | null>(null);
  const [boolPick, setBoolPick] = useState<boolean | null>(null);
  const [fillPick, setFillPick] = useState<string | null>(null);
  const [orderPick, setOrderPick] = useState<number[]>([]); // indexes into orderPool
  const [locked, setLocked] = useState(false);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const lockedRef = useRef(false);
  const proceededRef = useRef(false);
  const timers = useRef<number[]>([]);

  const orderPool = useMemo(
    () => (question.kind === "order" ? shuffledNotSolved(question.choices ?? []) : []),
    [question],
  );

  // If the card unmounts mid-countdown (timer ran out, learner left), don't
  // fire onResolved afterwards - that used to double-advance the timed games.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function settle(ok: boolean, opts?: { skipped?: boolean; note?: string | null }) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    setVerdict(ok);
    setNote(opts?.note ?? null);
    const wasSkipped = Boolean(opts?.skipped);
    setSkipped(wasSkipped);
    if (!ok && !wasSkipped) {
      setShake(true);
      later(() => setShake(false), 280);
    }
    if (wasSkipped) {
      later(() => onResolved(false, { skipped: true }), 0);
    } else if (ok) {
      later(() => onResolved(true), 720);
    } else if (!holdOnWrong) {
      later(() => onResolved(false), 1200); // long enough to read the explanation
    }
  }

  function checkFill() {
    if (fillPick === null) return;
    settle(fillPick === question.answer);
  }

  function checkOrder() {
    const given = orderPick.map((i) => orderPool[i]);
    const want = question.choices ?? [];
    if (given.length !== want.length) return;
    settle(given.every((line, i) => line === want[i]));
  }

  const showExpected = question.kind === "code" && verdict === false && !skipped;

  return (
    <div className={cn("flex flex-1 flex-col", shake && "animate-shake")}>
      <p className="text-lg font-medium leading-snug tracking-tight">{question.prompt}</p>
      {question.code ? (
        <div className="mt-4">
          <CodeBlock
            code={question.code}
            blank={question.kind === "fill" ? (fillPick ?? "") : null}
          />
        </div>
      ) : null}

      {question.kind === "choice" ? (
        <div className="mt-6 flex flex-col gap-2">
          {(question.choices ?? []).map((c, i) => {
            const right = i === question.answer;
            const mine = choicePick === i;
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => {
                  setChoicePick(i);
                  settle(i === question.answer);
                }}
                className={cn(
                  "min-h-12 rounded-md px-4 py-3 text-left text-sm transition-[background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98]",
                  "bg-elevated shadow-[var(--shadow-border)]",
                  locked && right && "bg-good/15 text-good shadow-none",
                  locked && mine && !right && "bg-bad/15 text-bad shadow-none",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === "bool" ? (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const right = v === question.answer;
            const mine = boolPick === v;
            return (
              <button
                key={String(v)}
                type="button"
                disabled={locked}
                onClick={() => {
                  setBoolPick(v);
                  settle(v === question.answer);
                }}
                className={cn(
                  "h-14 rounded-md text-sm font-medium transition-[background-color,transform] duration-150 active:scale-[0.98]",
                  "bg-elevated shadow-[var(--shadow-border)]",
                  locked && right && "bg-good/15 text-good shadow-none",
                  locked && mine && !right && "bg-bad/15 text-bad shadow-none",
                )}
              >
                {v ? "True" : "False"}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === "fill" ? (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {(question.choices ?? []).map((c, i) => {
              const mine = fillPick === c;
              const right = c === question.answer;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={locked}
                  onClick={() => setFillPick(c)}
                  className={cn(
                    "min-h-11 rounded-md px-3.5 font-mono text-sm transition-[background-color,transform] duration-150 active:scale-[0.98]",
                    mine ? "bg-accent text-accent-fg" : "bg-elevated shadow-[var(--shadow-border)]",
                    locked && right && "bg-good/15 text-good shadow-none",
                    locked && mine && !right && "bg-bad/15 text-bad shadow-none",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {!locked ? (
            <div className="mt-auto pt-6">
              <Button className="w-full" disabled={fillPick === null} onClick={checkFill}>
                Check
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {question.kind === "order" ? (
        <>
          <p className="mt-2 text-sm text-muted">Tap in the right order.</p>
          <div className="mt-4 flex flex-col gap-2">
            {orderPool.map((line, i) => {
              const pos = orderPick.indexOf(i);
              const used = pos !== -1;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    setOrderPick((seq) => (used ? seq.filter((x) => x !== i) : [...seq, i]))
                  }
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-md px-3 text-left font-mono text-[13px] transition-[background-color,transform] duration-150 active:scale-[0.98]",
                    used ? "bg-accent text-accent-fg" : "bg-elevated shadow-[var(--shadow-border)]",
                  )}
                >
                  <span className="flex size-6 items-center justify-center rounded-xs bg-bg/30 text-xs tabular-nums">
                    {used ? pos + 1 : ""}
                  </span>
                  {line}
                </button>
              );
            })}
          </div>
          {!locked ? (
            <div className="mt-auto pt-6">
              <Button
                className="w-full"
                disabled={orderPick.length !== orderPool.length}
                onClick={checkOrder}
              >
                Check
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {question.kind === "code" ? (
        <CodeQuestion
          question={question}
          locked={locked}
          onGraded={(ok, why) => settle(ok, { note: why })}
          onSkip={() => settle(false, { skipped: true, note: "Skipped - the Python runner wasn't available." })}
        />
      ) : null}

      {locked && verdict !== null ? (
        <div className="mt-auto pt-6">
          <p
            className={cn(
              "text-sm leading-relaxed",
              skipped ? "text-muted" : verdict ? "text-good" : "text-bad",
            )}
          >
            {skipped ? "" : verdict ? "Correct. " : "Not quite. "}
            {skipped ? note : question.why}
          </p>
          {!skipped && note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
          {showExpected ? (
            <pre className="mt-2 overflow-x-auto rounded-md bg-surface px-3 py-2 font-mono text-[13px] text-muted shadow-[var(--shadow-border)]">
              {`Expected output:\n${question.expected ?? ""}`}
            </pre>
          ) : null}
          {holdOnWrong && !verdict && !skipped ? (
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => {
                // A second tap must not advance twice.
                if (proceededRef.current) return;
                proceededRef.current = true;
                onResolved(false);
              }}
            >
              Continue
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
