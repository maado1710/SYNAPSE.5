import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { learnedTerms } from "@/lib/progress";
import { useApp } from "@/lib/store";
import { shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlayFrame } from "@/components/shell";
import { cn } from "@/lib/utils";

type Card = { id: string; pair: string; text: string; kind: "term" | "def" };

export function MatchGame() {
  const navigate = useNavigate();
  const awardXp = useApp((s) => s.awardXp);
  const pairs = useMemo(() => learnedTerms(6), []);
  const cards = useMemo<Card[]>(() => {
    const list: Card[] = [];
    pairs.forEach((p, i) => {
      list.push({ id: `t${i}`, pair: p.term, text: p.term, kind: "term" });
      list.push({ id: `d${i}`, pair: p.term, text: p.def, kind: "def" });
    });
    return shuffle(list);
  }, [pairs]);

  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [busy, setBusy] = useState(false);
  const done = matched.length === cards.length && cards.length > 0;

  function flip(id: string) {
    if (busy || matched.includes(id) || open.includes(id)) return;
    const next = [...open, id];
    setOpen(next);
    if (next.length < 2) return;
    const a = cards.find((c) => c.id === next[0]);
    const b = cards.find((c) => c.id === next[1]);
    if (!a || !b) return;
    setBusy(true);
    if (a.pair === b.pair && a.kind !== b.kind) {
      window.setTimeout(() => {
        setMatched((m) => [...m, a.id, b.id]);
        setOpen([]);
        setBusy(false);
      }, 280);
    } else {
      setMisses((n) => n + 1);
      window.setTimeout(() => {
        setOpen([]);
        setBusy(false);
      }, 700);
    }
  }

  const awarded = done ? Math.max(8, 48 - misses * 4) : 0;

  return (
    <PlayFrame
      title="Pair match"
      onClose={() => navigate({ to: "/lab" })}
      trailing={<span className="text-xs tabular-nums text-muted">{misses} misses</span>}
    >
      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
          <h2 className="text-2xl font-semibold tracking-tight">Board clear</h2>
          <p className="mt-2 text-sm text-muted">
            {misses === 0 ? "Perfect pairing." : `${misses} miss${misses === 1 ? "" : "es"}.`} Linking
            a name to a meaning is how it stays.
          </p>
          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={() => {
              awardXp(awarded);
              navigate({ to: "/lab" });
            }}
          >
            Collect {awarded} XP
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {cards.map((c) => {
            const isOpen = open.includes(c.id) || matched.includes(c.id);
            const isMatch = matched.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => flip(c.id)}
                className={cn(
                  "min-h-24 rounded-lg px-3 py-3 text-left text-sm leading-snug transition-[background-color,transform,opacity] duration-200 ease-out active:scale-[0.98]",
                  isOpen
                    ? isMatch
                      ? "bg-good/15 text-fg"
                      : "bg-elevated text-fg shadow-[var(--shadow-border)]"
                    : "bg-surface text-muted shadow-[var(--shadow-border)]",
                )}
              >
                {isOpen ? (
                  <>
                    <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                      {c.kind === "term" ? "Term" : "Meaning"}
                    </span>
                    <span className="mt-1 block">{c.text}</span>
                  </>
                ) : (
                  <span className="flex h-full items-center justify-center font-mono text-xs text-faint">
                    ···
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </PlayFrame>
  );
}
