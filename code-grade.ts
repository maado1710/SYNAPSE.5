// Pure helpers for grading "write the code" questions.

export type RunOutcome = { stdout: string; error: string | null };

export type CodeSpec = {
  /** Exact text the program should print (trailing spaces/newlines ignored). */
  expected: string;
  /** Source must contain each of these (comments are ignored). */
  requires?: string[];
};

export type Grade =
  | { ok: true }
  | { ok: false; reason: "error" | "output" | "requires"; message: string };

export function normalizeOutput(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .trim();
}

/** Drop `# comments` so `# print` can't satisfy a "must use print" rule. */
export function stripPythonComments(source: string) {
  return source.replace(/(^|\s)#.*$/gm, "$1");
}

/**
 * Pyodide error messages include internal frames. Keep only the part about the
 * learner's own code (from the `<exec>` frame on), capped to a few lines.
 */
export function cleanTraceback(message: string) {
  const lines = message.replace(/\r\n?/g, "\n").trimEnd().split("\n");
  const start = lines.findIndex((l) => l.includes('File "<exec>"'));
  const kept = start >= 0 ? lines.slice(start) : lines.slice(-3);
  return kept.slice(-6).join("\n");
}

export function gradeCode(spec: CodeSpec, run: RunOutcome, source: string): Grade {
  if (run.error) {
    return { ok: false, reason: "error", message: "Your code raised an error." };
  }
  if (normalizeOutput(run.stdout) !== normalizeOutput(spec.expected)) {
    return { ok: false, reason: "output", message: "The output didn't match." };
  }
  const code = stripPythonComments(source);
  const missing = (spec.requires ?? []).filter((needle) => !code.includes(needle));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: "requires",
      message: `Right output, but this one needs ${missing.map((m) => `"${m}"`).join(", ")} in your code.`,
    };
  }
  return { ok: true };
}
