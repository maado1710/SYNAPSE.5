import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_RETRIES,
  beginQuestions,
  isFinished,
  resolveQuestion,
  startFlow,
} from "./lesson-flow.ts";

const A = { id: "a", concept: "print" };
const B = { id: "b", concept: "print" };
const C = { id: "c", concept: "variables" };

function play(answers: boolean[], questions = [A, B, C]) {
  let flow = beginQuestions(startFlow(questions));
  for (const ok of answers) {
    assert.equal(isFinished(flow), false, "finished too early");
    const q = flow.queue[flow.step - 1];
    assert.ok(q);
    flow = resolveQuestion(flow, q, ok);
  }
  return flow;
}

test("all correct: finishes after exactly one pass, nothing re-asked", () => {
  const flow = play([true, true, true]);
  assert.equal(isFinished(flow), true);
  assert.equal(flow.queue.length, 3);
  assert.deepEqual(flow.firstTry.map((r) => r.correct), [true, true, true]);
});

test("a miss is re-asked at the end, and finishing needs the retry", () => {
  let flow = play([true, false, true]);
  assert.equal(isFinished(flow), false);
  assert.equal(flow.queue.length, 4);
  assert.equal(flow.queue[3]?.id, "b");
  flow = resolveQuestion(flow, flow.queue[3]!, true);
  assert.equal(isFinished(flow), true);
});

test("only the first attempt is scored; a later correct retry does not erase the miss", () => {
  let flow = play([true, false, true]);
  flow = resolveQuestion(flow, flow.queue[3]!, true);
  assert.deepEqual(flow.firstTry, [
    { concept: "print", correct: true },
    { concept: "print", correct: false },
    { concept: "variables", correct: true },
  ]);
});

test("missing the LAST question still brings it back (not finished)", () => {
  const flow = play([true, true, false]);
  assert.equal(isFinished(flow), false);
  assert.equal(flow.queue.length, 4);
  assert.equal(flow.queue[3]?.id, "c");
});

test("a question is retried at most MAX_RETRIES times, then the lesson can end", () => {
  let flow = beginQuestions(startFlow([A]));
  for (let i = 0; i <= MAX_RETRIES; i++) {
    assert.equal(isFinished(flow), false);
    flow = resolveQuestion(flow, flow.queue[flow.step - 1]!, false);
  }
  assert.equal(isFinished(flow), true);
  assert.equal(flow.queue.length, 1 + MAX_RETRIES);
  assert.equal(flow.firstTry.length, 1);
});

test("a skipped question is not scored and not re-asked", () => {
  let flow = beginQuestions(startFlow([A, B]));
  flow = resolveQuestion(flow, A, false, true);
  flow = resolveQuestion(flow, B, true);
  assert.equal(isFinished(flow), true);
  assert.deepEqual(flow.firstTry, [{ concept: "print", correct: true }]);
  assert.equal(flow.queue.length, 2);
});

test("an empty lesson is finished as soon as it begins", () => {
  assert.equal(isFinished(beginQuestions(startFlow([]))), true);
});
