// The queue logic behind a lesson: ask every question, re-ask misses at the
// end, and record only each question's FIRST attempt for XP / spaced repetition.
// Pure and framework-free so it can be unit tested.

import type { ReviewResult } from "./review";

/** A missed question comes back at the end up to this many times. */
export const MAX_RETRIES = 2;

export type FlowQuestion = { id: string; concept: string };

export type LessonFlow<Q extends FlowQuestion> = {
  /** step 0 = the concept card, step n = queue[n - 1], step > queue.length = finished. */
  step: number;
  queue: Q[];
  firstTry: ReviewResult[];
  answered: string[];
  retries: Record<string, number>;
};

export function startFlow<Q extends FlowQuestion>(questions: Q[]): LessonFlow<Q> {
  return { step: 0, queue: questions, firstTry: [], answered: [], retries: {} };
}

export function isFinished<Q extends FlowQuestion>(flow: LessonFlow<Q>) {
  return flow.step > flow.queue.length;
}

/** Leave the concept card and start the questions. */
export function beginQuestions<Q extends FlowQuestion>(flow: LessonFlow<Q>): LessonFlow<Q> {
  return { ...flow, step: 1 };
}

/**
 * Record the learner's answer to the current question and move on.
 * `skipped` (e.g. the Python runner was offline) is neither right nor wrong:
 * it isn't scored and isn't asked again.
 */
export function resolveQuestion<Q extends FlowQuestion>(
  flow: LessonFlow<Q>,
  question: Q,
  correct: boolean,
  skipped = false,
): LessonFlow<Q> {
  let { queue, firstTry, answered, retries } = flow;
  if (!skipped) {
    if (!answered.includes(question.id)) {
      firstTry = [...firstTry, { concept: question.concept, correct }];
      answered = [...answered, question.id];
    }
    const used = retries[question.id] ?? 0;
    if (!correct && used < MAX_RETRIES) {
      queue = [...queue, question];
      retries = { ...retries, [question.id]: used + 1 };
    }
  }
  return { step: flow.step + 1, queue, firstTry, answered, retries };
}
