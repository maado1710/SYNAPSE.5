import { cn } from "@/lib/utils";

export function SynapseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <circle cx="8" cy="16" r="4.2" fill="currentColor" />
      <circle cx="24" cy="16" r="4.2" fill="currentColor" />
      <path
        d="M12.4 16h7.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
