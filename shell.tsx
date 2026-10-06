import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Home, Layers, Sparkles, User } from "lucide-react";
import { SynapseMark } from "@/components/mark";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: Layers },
  { to: "/lab", label: "Lab", icon: Sparkles },
  { to: "/you", label: "You", icon: User },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const streak = useApp((s) => s.streak);
  const xp = useApp((s) => s.xp);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <header className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
          <Link to="/" className="flex items-center gap-2 text-fg">
            <SynapseMark className="size-7" />
            <span className="text-sm font-semibold tracking-tight">Synapse</span>
          </Link>
          <div className="flex items-center gap-3 text-sm tabular-nums text-muted">
            <span className="inline-flex items-center gap-1">
              <Flame className="size-4 text-fg" />
              <span className="text-fg">{streak}</span>
            </span>
            <span>{xp} XP</span>
          </div>
        </header>
        <main className="flex-1 px-5 pb-28">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
          <div className="mx-auto grid max-w-lg grid-cols-4">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150",
                    active ? "text-fg" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PlayFrame({
  children,
  title,
  onClose,
  trailing,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
          <h1 className="flex-1 text-sm font-medium tracking-tight">{title}</h1>
          {trailing}
        </header>
        <div className="flex flex-1 flex-col px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
