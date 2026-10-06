import assert from "node:assert/strict";
import { test } from "node:test";
import { css } from "./css.ts";
import { git } from "./git.ts";
import { html } from "./html.ts";
import { java } from "./java.ts";
import { javascript } from "./javascript.ts";
import { python } from "./python.ts";
import { sql } from "./sql.ts";
import { typescript } from "./typescript.ts";
import type { Question, Track } from "./types.ts";

const tracks: Track[] = [python, javascript, html, css, java, sql, typescript, git];

function questionsOf(track: Track): Question[] {
  return track.chapters.flatMap((c) => c.lessons.flatMap((l) => l.questions));
}

test("question ids are unique within each track", () => {
  for (const track of tracks) {
    const ids = questionsOf(track).map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, `${track.id} has duplicate question ids`);
  }
});

test("every question has the fields its kind needs", () => {
  for (const track of tracks) {
    for (const q of questionsOf(track)) {
      const where = `${track.id}/${q.id}`;
      assert.ok(q.why.length > 0, `${where}: missing why`);
      assert.ok(q.concept.length > 0, `${where}: missing concept`);
      switch (q.kind) {
        case "choice":
          assert.ok((q.choices?.length ?? 0) >= 2, `${where}: needs choices`);
          assert.equal(typeof q.answer, "number", `${where}: answer must be an index`);
          assert.ok((q.answer as number) < (q.choices?.length ?? 0), `${where}: answer out of range`);
          break;
        case "fill":
          assert.ok(q.choices?.includes(q.answer as string), `${where}: answer must be a chip`);
          assert.ok(q.code?.includes("___"), `${where}: fill needs a ___ blank`);
          break;
        case "bool":
          assert.equal(typeof q.answer, "boolean", `${where}: bool answer`);
          break;
        case "order":
          assert.ok((q.choices?.length ?? 0) >= 2, `${where}: order needs 2+ lines`);
          break;
        case "code":
          assert.equal(typeof q.expected, "string", `${where}: code needs expected output`);
          assert.ok((q.expected ?? "").length > 0, `${where}: expected is empty`);
          break;
      }
    }
  }
});

test("code questions only exist where a runner exists (Python)", () => {
  for (const track of tracks) {
    const hasCode = questionsOf(track).some((q) => q.kind === "code");
    if (track.id !== "python") assert.equal(hasCode, false, `${track.id} has code questions but no runner`);
  }
});

test("chapters have lessons and lessons have questions", () => {
  for (const track of tracks) {
    for (const ch of track.chapters) {
      assert.ok(ch.lessons.length > 0, `${track.id}/${ch.id}: empty chapter`);
      for (const les of ch.lessons) {
        assert.ok(les.questions.length >= 3, `${track.id}/${ch.id}/${les.id}: too few questions`);
      }
    }
  }
});
