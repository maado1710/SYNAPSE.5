import { useState } from "react";
import { TRACKS } from "@/lib/curriculum";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SynapseMark } from "@/components/mark";
import { cn } from "@/lib/utils";

const GOALS = [20, 40, 80];

export function Onboarding() {
  const complete = useApp((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(40);
  const [picks, setPicks] = useState<string[]>(["python"]);

  function toggle(id: string) {
    setPicks((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      return [...cur, id];
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-8 text-fg">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        {step === 0 ? (
          <div className="flex flex-1 flex-col animate-fade-up">
            <SynapseMark className="size-10" />
            <h1 className="mt-8 text-4xl font-semibold tracking-tight">
              Learn to code.
              <br />
              Make it stick.
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
              Bite-sized lessons in Python, Java, CSS, and more — then recall games that pull the
              idea back before it fades.
            </p>
            <div className="mt-auto pt-10">
              <Button size="lg" className="w-full" onClick={() => setStep(1)}>
                Get started
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-1 flex-col animate-fade-up">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tracks</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">What do you want first?</h2>
            <p className="mt-2 text-sm text-muted">Pick one or several. You can open the rest anytime.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {TRACKS.map((t) => {
                const on = picks.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={cn(
                      "rounded-lg px-4 py-4 text-left transition-[background-color,box-shadow] duration-150",
                      on
                        ? "bg-accent text-accent-fg"
                        : "bg-elevated text-fg shadow-[var(--shadow-border)]",
                    )}
                  >
                    <span className="font-mono text-xs opacity-70">{t.short}</span>
                    <span className="mt-1 block text-sm font-medium">{t.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-auto pt-8">
              <Button size="lg" className="w-full" disabled={picks.length === 0} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-1 flex-col animate-fade-up">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Daily goal</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">A name and a pace</h2>
            <label className="mt-6 text-sm text-muted" htmlFor="name">
              What should we call you?
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada"
              className="mt-2 h-12 rounded-md bg-elevated px-4 text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent/50"
            />
            <p className="mt-6 text-sm text-muted">Daily XP target</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={cn(
                    "h-12 rounded-md text-sm font-medium tabular-nums transition-colors duration-150",
                    goal === g ? "bg-accent text-accent-fg" : "bg-elevated shadow-[var(--shadow-border)]",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="mt-auto pt-8">
              <Button
                size="lg"
                className="w-full"
                onClick={() => complete(name, goal, picks)}
              >
                Start learning
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
