import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { Shell } from "@/components/shell";
import { Onboarding } from "@/components/onboarding";
import { ProgressRing } from "@/components/progress-ring";
import { SynapseMark } from "@/components/mark";
import { useHydrated } from "@/hooks/use-hydrated";
import { TRACKS } from "@/lib/curriculum";
import { dueConcepts, nextLesson, trackProgress } from "@/lib/progress";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const hydrated = useHydrated();
  const onboarded = useApp((s) => s.onboarded);
  const name = useApp((s) => s.name);
  const xpToday = useApp((s) => s.xpToday);
  const dailyGoal = useApp((s) => s.dailyGoal);
  const streak = useApp((s) => s.streak);
  const selected = useApp((s) => s.selectedTracks);
  const completed = useApp((s) => s.completed);
  const clashWon = useApp((s) => s.clashWon);
  const concepts = useApp((s) => s.concepts);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-fg">
        <SynapseMark className="size-10" />
        <p className="mt-6 text-2xl font-semibold tracking-tight">Synapse</p>
        <p className="mt-2 text-sm text-muted">Learn to code. Make it stick.</p>
      </div>
    );
  }
  if (!onboarded) return <Onboarding />;

  const nxt = nextLesson();
  const due = dueConcepts(8);
  const goalPct = dailyGoal ? Math.min(100, Math.round((xpToday / dailyGoal) * 100)) : 0;
  const tracks = TRACKS.filter((t) => selected.includes(t.id));
  const shown = tracks.length ? tracks : TRACKS.slice(0, 4);
  void completed;
  void clashWon;
  void concepts;

  return (
    <Shell>
      <p className="text-sm text-muted">{greeting()}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{name}</h1>

      <section className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center gap-4">
          <ProgressRing value={goalPct} label={`${xpToday}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Daily goal</p>
            <p className="mt-0.5 text-sm text-muted">
              {xpToday} / {dailyGoal} XP today
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted">
              <Flame className="size-3.5 text-fg" />
              <span className="tabular-nums text-fg">{streak}</span> day streak
            </p>
          </div>
        </div>
      </section>

      {nxt ? (
        nxt.lesson ? (
          <Link
            to="/lesson/$langId/$chapterId/$lessonId"
            params={{ langId: nxt.langId, chapterId: nxt.chapterId, lessonId: nxt.lessonId }}
            className="mt-4 flex items-center gap-4 rounded-xl bg-accent p-4 text-accent-fg transition-transform duration-150 active:scale-[0.98]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-70">Continue</p>
              <p className="mt-1 truncate text-base font-semibold">
                {nxt.track.name} · {nxt.lesson.title}
              </p>
              <p className="mt-0.5 truncate text-sm opacity-70">{nxt.chapter.title}</p>
            </div>
            <ArrowRight className="size-5 shrink-0" />
          </Link>
        ) : (
          <Link
            to="/clash/$langId/$chapterId"
            params={{ langId: nxt.langId, chapterId: nxt.chapterId }}
            className="mt-4 flex items-center gap-4 rounded-xl bg-accent p-4 text-accent-fg transition-transform duration-150 active:scale-[0.98]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-70">Continue</p>
              <p className="mt-1 truncate text-base font-semibold">
                {nxt.track.name} · {nxt.chapter.clash.name}
              </p>
              <p className="mt-0.5 truncate text-sm opacity-70">{nxt.chapter.title}</p>
            </div>
            <ArrowRight className="size-5 shrink-0" />
          </Link>
        )
      ) : (
        <div className="mt-4 rounded-xl bg-surface p-4 text-sm text-muted shadow-[var(--shadow-border)]">
          Every lesson in your tracks is done. Open Learn to start a new language, or drill in the Lab.
        </div>
      )}

      {due.length > 0 ? (
        <Link
          to="/lab"
          className="mt-4 flex items-center gap-3 rounded-xl bg-elevated p-4 shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.98]"
        >
          <Sparkles className="size-5 text-fg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Due for recall</p>
            <p className="text-sm text-muted">
              {due.length} concept{due.length === 1 ? "" : "s"} fading — drill them in the Lab
            </p>
          </div>
        </Link>
      ) : null}

      <h2 className="mt-8 text-sm font-medium text-muted">Your tracks</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {shown.map((t) => {
          const p = trackProgress(t.id);
          return (
            <Link
              key={t.id}
              to="/learn/$langId"
              params={{ langId: t.id }}
              className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.98]"
            >
              <p className="font-mono text-xs text-muted">{t.short}</p>
              <p className="mt-1 text-sm font-medium">{t.name}</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-elevated">
                <div className="h-full bg-accent" style={{ width: `${p.pct}%` }} />
              </div>
              <p className="mt-2 text-xs tabular-nums text-muted">
                {p.done}/{p.total}
              </p>
            </Link>
          );
        })}
      </div>

      {shown.length < TRACKS.length ? (
        <Link to="/learn" className="mt-3 inline-flex items-center gap-1 text-sm text-muted">
          All languages <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </Shell>
  );
}
