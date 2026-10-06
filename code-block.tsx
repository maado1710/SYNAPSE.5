import { cn } from "@/lib/utils";

const KEYWORDS = new Set([
  "print",
  "if",
  "else",
  "elif",
  "and",
  "or",
  "not",
  "def",
  "return",
  "let",
  "const",
  "var",
  "function",
  "typeof",
  "true",
  "false",
  "True",
  "False",
  "null",
  "undefined",
  "class",
  "public",
  "static",
  "void",
  "int",
  "double",
  "boolean",
  "String",
  "final",
  "for",
  "new",
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INNER",
  "LEFT",
  "ON",
  "GROUP",
  "BY",
  "ORDER",
  "LIMIT",
  "DISTINCT",
  "AS",
  "AND",
  "OR",
  "LIKE",
  "COUNT",
  "HAVING",
  "interface",
  "type",
  "readonly",
  "git",
]);

function tokenize(code: string) {
  const tokens: { text: string; kind: "code" | "str" | "cmt" | "kw" }[] = [];
  const re =
    /(\/\/[^\n]*|#(?!\{)[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b[A-Za-z_][\w]*\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m.index > last) tokens.push({ text: code.slice(last, m.index), kind: "code" });
    const text = m[0];
    let kind: "code" | "str" | "cmt" | "kw" = "code";
    if (text.startsWith("//") || text.startsWith("#") || text.startsWith("/*")) kind = "cmt";
    else if (text.startsWith('"') || text.startsWith("'") || text.startsWith("`")) kind = "str";
    else if (KEYWORDS.has(text)) kind = "kw";
    tokens.push({ text, kind });
    last = m.index + text.length;
  }
  if (last < code.length) tokens.push({ text: code.slice(last), kind: "code" });
  return tokens;
}

export function CodeBlock({
  code,
  blank,
  className,
}: {
  code: string;
  blank?: string | null;
  className?: string;
}) {
  const parts = code.split("___");
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-md bg-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-fg shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <code>
        {parts.map((part, i) => (
          <span key={i}>
            {tokenize(part).map((t, j) => (
              <span
                key={j}
                className={
                  t.kind === "str"
                    ? "text-good"
                    : t.kind === "cmt"
                      ? "text-muted"
                      : t.kind === "kw"
                        ? "text-accent"
                        : undefined
                }
              >
                {t.text}
              </span>
            ))}
            {i < parts.length - 1 ? (
              <span className="mx-0.5 inline-flex min-w-16 items-center justify-center rounded-xs border border-dashed border-accent/50 bg-elevated px-2 py-0.5 text-accent">
                {blank ?? " "}
              </span>
            ) : null}
          </span>
        ))}
      </code>
    </pre>
  );
}
