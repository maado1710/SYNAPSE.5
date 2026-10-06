import { createFileRoute, Link } from "@tanstack/react-router";
import { Crosshair, Layers, Zap } from "lucide-react";
import { Shell } from "@/components/shell";
import { dueConcepts } from "@/lib/progress";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/lab")({ component: Lab });

const GAMES = [
  {
    to: "/flash" as const,
    title: "Flash strike",
    blurb: "Timed recall. Combo multiplies XP. Miss a beat, combo drops.",
    icon: Zap,
  },
  {
    to: "/match" as const,
    title: "Pair match",
    blurb: "Flip a term, find its meaning. Association is memory’s cheapest trick.",
    icon: Layers,
  },
  {
    to: "/recall" as const,
    title: "Recall clash",
    blurb: "Three hearts vs a glitch. Correct answers drain it. Pressure is the point.",
    icon: Crosshair,
  },
];

function Lab() {
  const concepts = useApp((s) => s.concepts);
  void concepts;
  const due = dueConcepts(12);

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Lab</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Lessons put an idea in. These games pull it back out — the part that makes it stay.
      </p>

      {due.length > 0 ? (
        <p className="mt-4 text-sm text-fg">
          <span className="tabular-nums">{due.length}</span> concept{due.length === 1 ? "" : "s"} due
          for review.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">Nothing is fading yet. Play anyway to warm the circuit.</p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.to}
              to={g.to}
              className="flex items-start gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.98]"
            >
              <span className="mt-0.5 flex size-10 items-center justify-center rounded-md bg-elevated">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{g.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{g.blurb}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
