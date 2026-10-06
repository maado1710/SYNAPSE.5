import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanTraceback,
  gradeCode,
  normalizeOutput,
  stripPythonComments,
} from "./code-grade.ts";

const spec = { expected: "10", requires: ["score", "="] };

test("normalizeOutput ignores trailing whitespace and CRLF", () => {
  assert.equal(normalizeOutput("a  \r\nb\n\n"), "a\nb");
});

test("passes when output and required tokens match", () => {
  const g = gradeCode(spec, { stdout: "10\n", error: null }, "score = 10\nprint(score)");
  assert.deepEqual(g, { ok: true });
});

test("fails on a runtime error before looking at output", () => {
  const g = gradeCode(spec, { stdout: "10", error: "NameError" }, "print(score)");
  assert.equal(g.ok, false);
  assert.equal(g.ok === false && g.reason, "error");
});

test("fails on wrong output", () => {
  const g = gradeCode(spec, { stdout: "11", error: null }, "score = 11\nprint(score)");
  assert.equal(g.ok === false && g.reason, "output");
});

test("fails when a required token is missing (hard-coded answer)", () => {
  const g = gradeCode(spec, { stdout: "10", error: null }, "print(10)");
  assert.equal(g.ok === false && g.reason, "requires");
});

test("a required token that only appears in a comment does not count", () => {
  const src = "# score = 10\nprint(10)";
  const g = gradeCode(spec, { stdout: "10", error: null }, src);
  assert.equal(g.ok === false && g.reason, "requires");
});

test("stripPythonComments keeps code before an inline comment", () => {
  assert.equal(stripPythonComments("x = 1  # note").includes("x = 1"), true);
  assert.equal(stripPythonComments("x = 1  # note").includes("note"), false);
});

test("cleanTraceback keeps only the learner's frames", () => {
  const raw = [
    "Traceback (most recent call last):",
    '  File "/lib/python312.zip/_pyodide/_base.py", line 574, in eval_code_async',
    '  File "<exec>", line 2, in <module>',
    "NameError: name 'Ready' is not defined",
  ].join("\n");
  assert.equal(
    cleanTraceback(raw),
    ['  File "<exec>", line 2, in <module>', "NameError: name 'Ready' is not defined"].join("\n"),
  );
});

test("cleanTraceback falls back to the last lines", () => {
  assert.equal(cleanTraceback("a\nb\nc\nd"), "b\nc\nd");
});
