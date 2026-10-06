import { useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/curriculum";
import { gradeCode } from "@/lib/code-grade";
import { isPythonReady, preloadPython, runPython, type RunResult } from "@/lib/pyrunner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Phone keyboards bury these, so give them one tap away.
const SYMBOLS = ['"', "'", "(", ")", ":", "=", "[", "]", "#", "%", "*"];
const MAX_OUTPUT_CHARS = 2000;

type Status = "idle" | "starting" | "running" | "unavailable";

function clip(text: string) {
  return text.length > MAX_OUTPUT_CHARS ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n…` : text;
}

export function CodeQuestion({
  question,
  locked,
  onGraded,
  onSkip,
}: {
  question: Question;
  locked: boolean;
  /** `note` explains a wrong result; null when correct. */
  onGraded: (ok: boolean, note: string | null) => void;
  onSkip: () => void;
}) {
  const [src, setSrc] = useState(question.starter ?? "");
  const [out, setOut] = useState<RunResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const area = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(false);
  const busy = status === "starting" || status === "running";

  useEffect(() => {
    mounted.current = true;
    preloadPython(); // start the download while the learner reads the prompt
    return () => {
      mounted.current = false;
    };
  }, []);

  function insert(text: string) {
    const el = area.current;
    const start = el?.selectionStart ?? src.length;
    const end = el?.selectionEnd ?? src.length;
    setSrc(src.slice(0, start) + text + src.slice(end));
    const caret = start + text.length;
    window.requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  async function execute(): Promise<RunResult | null> {
    setStatus(isPythonReady() ? "running" : "starting");
    try {
      const result = await runPython(src);
      if (!mounted.current) return null;
      setOut(result);
      setStatus("idle");
      return result;
    } catch {
      if (mounted.current) setStatus("unavailable");
      return null;
    }
  }

  async function check() {
    const result = await execute();
    if (!result) return;
    const grade = gradeCode(
      { expected: question.expected ?? "", requires: question.requires },
      result,
      src,
    );
    onGraded(grade.ok, grade.ok ? null : grade.message);
  }

  return (
    <div className="mt-4 flex flex-1 flex-col">
      <textarea
        ref={area}
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        onKeyDown={(e) => {
          // Tab indents instead of leaving the box (Shift+Tab still moves focus).
          if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            insert("    ");
          }
        }}
        disabled={locked}
        rows={Math.max(5, src.split("\n").length + 1)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        aria-label="Python code"
        placeholder="Type your Python here"
        className={cn(
          "w-full resize-y rounded-md bg-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-fg",
          "shadow-[var(--shadow-border)] outline-none placeholder:text-faint",
          "focus:shadow-[0_0_0_1px_var(--color-accent)] disabled:opacity-70",
        )}
      />

      {!locked ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Quick keys">
          {SYMBOLS.map((sym) => (
            <button
              key={sym}
              type="button"
              // Keep the keyboard open: don't let the tap steal focus.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(sym)}
              className="min-h-10 min-w-10 shrink-0 rounded-sm bg-elevated px-2 font-mono text-sm shadow-[var(--shadow-border)] active:scale-[0.96]"
            >
              {sym}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert("    ")}
            className="min-h-10 shrink-0 rounded-sm bg-elevated px-3 font-mono text-xs text-muted shadow-[var(--shadow-border)] active:scale-[0.96]"
          >
            tab
          </button>
        </div>
      ) : null}

      <div
        className="mt-3 min-h-16 rounded-md bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
        aria-live="polite"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">Output</p>
        {status === "starting" ? (
          <p className="mt-1 text-sm text-muted">Starting Python… (first run only)</p>
        ) : status === "running" ? (
          <p className="mt-1 text-sm text-muted">Running…</p>
        ) : status === "unavailable" ? (
          <div className="mt-1">
            <p className="text-sm text-bad">
              Couldn&apos;t load the Python runner. Give it a moment and try again.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => void execute()}>
                Try again
              </Button>
              <Button size="sm" variant="ghost" onClick={onSkip}>
                Skip this one
              </Button>
            </div>
          </div>
        ) : out ? (
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
            {out.stdout ? <span className="text-fg">{clip(out.stdout)}</span> : null}
            {out.stdout && out.error ? "\n" : null}
            {out.error ? <span className="text-bad">{clip(out.error)}</span> : null}
            {!out.stdout && !out.error ? <span className="text-faint">(no output)</span> : null}
          </pre>
        ) : (
          <p className="mt-1 text-sm text-faint">Run your code to see what it prints.</p>
        )}
      </div>

      {!locked ? (
        <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 pt-6">
          <Button
            variant="secondary"
            disabled={busy || src.trim() === ""}
            onClick={() => void execute()}
          >
            Run
          </Button>
          <Button disabled={busy || src.trim() === ""} onClick={() => void check()}>
            Check
          </Button>
        </div>
      ) : null}
    </div>
  );
}
