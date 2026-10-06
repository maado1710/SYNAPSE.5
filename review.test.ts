import assert from "node:assert/strict";
import { test } from "node:test";
import { REPEAT_XP_CAP, capRepeatXp, collapseByConcept, lessonReward } from "./review.ts";

test("collapseByConcept merges answers on the same concept", () => {
  const out = collapseByConcept([
    { concept: "print", correct: true },
    { concept: "print", correct: true },
    { concept: "print", correct: true },
  ]);
  assert.deepEqual(out, [{ concept: "print", correct: true }]);
});

test("collapseByConcept marks a concept wrong if any answer was wrong", () => {
  const out = collapseByConcept([
    { concept: "print", correct: true },
    { concept: "print", correct: false },
    { concept: "variables", correct: true },
  ]);
  assert.deepEqual(out, [
    { concept: "print", correct: false },
    { concept: "variables", correct: true },
  ]);
});

test("collapseByConcept handles empty input", () => {
  assert.deepEqual(collapseByConcept([]), []);
});

test("lessonReward pays far less for replays", () => {
  assert.equal(lessonReward(true, 3), 64);
  assert.equal(lessonReward(false, 3), 10);
  assert.ok(lessonReward(false, 4) < lessonReward(true, 0));
});

test("capRepeatXp never exceeds the daily budget", () => {
  assert.equal(capRepeatXp(0, 10), 10);
  assert.equal(capRepeatXp(95, 10), REPEAT_XP_CAP - 95);
  assert.equal(capRepeatXp(REPEAT_XP_CAP, 10), 0);
  assert.equal(capRepeatXp(REPEAT_XP_CAP + 20, 10), 0);
  assert.equal(capRepeatXp(0, -5), 0);
});
