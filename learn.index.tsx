import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { TRACKS } from "@/lib/curriculum";
import { trackProgress } from "@/lib/progress";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/learn/")({ component: Learn });

function Learn() {
  const completed = useApp((s) => s.completed);
  void completed;

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Learn</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Eight tracks. Short lessons. A clash at the end of every chapter.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {TRACKS.map((t) => {
          const p = trackProgress(t.id);
          return (
            <Link
              key={t.id}
              to="/learn/$langId"
              params={{ langId: t.id }}
              className="flex items-center gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.98]"
            >
              <div className="flex size-12 items-center justify-center rounded-md bg-elevated font-mono text-sm text-accent">
                {t.short}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs tabular-nums text-muted">{p.pct}%</p>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">{t.blurb}</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-elevated">
                  <div className="h-full bg-accent" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
