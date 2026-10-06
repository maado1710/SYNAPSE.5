import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { TRACKS } from "@/lib/curriculum";
import { languageStrength, trackProgress } from "@/lib/progress";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/you")({ component: You });

const GOALS = [20, 40, 80];

function You() {
  const name = useApp((s) => s.name);
  const setName = useApp((s) => s.setName);
  const xp = useApp((s) => s.xp);
  const streak = useApp((s) => s.streak);
  const bestStreak = useApp((s) => s.bestStreak);
  const dailyGoal = useApp((s) => s.dailyGoal);
  const setGoal = useApp((s) => s.setGoal);
  const completed = useApp((s) => s.completed);
  const clashWon = useApp((s) => s.clashWon);
  const concepts = useApp((s) => s.concepts);

  const lessons = Object.keys(completed).length;
  const clashes = Object.keys(clashWon).length;
  const conceptCount = Object.keys(concepts).length;

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
      <p className="mt-2 text-sm text-muted">Memory, streak, and the shape of what you’ve kept.</p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          { k: "XP", v: xp },
          { k: "Streak", v: streak },
          { k: "Best", v: bestStreak },
        ].map((s) => (
          <div key={s.k} className="rounded-lg bg-surface px-3 py-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">{s.k}</p>
            <p className="mt-1 text-xl font-medium tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          { k: "Lessons", v: lessons },
          { k: "Clashes", v: clashes },
          { k: "Concepts", v: conceptCount },
        ].map((s) => (
          <div key={s.k} className="rounded-lg bg-surface px-3 py-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">{s.k}</p>
            <p className="mt-1 text-xl font-medium tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted">Memory by track</h2>
      <div className="mt-3 flex flex-col gap-3">
        {TRACKS.map((t) => {
          const p = trackProgress(t.id);
          const str = languageStrength(t.id);
          return (
            <div key={t.id}>
              <div className="flex items-baseline justify-between text-sm">
                <span>{t.name}</span>
                <span className="tabular-nums text-muted">{str || p.pct}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${Math.max(p.pct, str)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted">Daily goal</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {GOALS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGoal(g)}
            className={cn(
              "h-12 rounded-md text-sm font-medium tabular-nums transition-colors duration-150",
              dailyGoal === g ? "bg-accent text-accent-fg" : "bg-elevated shadow-[var(--shadow-border)]",
            )}
          >
            {g} XP
          </button>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted">Name</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-3 h-12 w-full rounded-md bg-elevated px-4 text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      />
    </Shell>
  );
}
