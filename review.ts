// Pure scoring helpers for lessons and spaced repetition (no app imports, so
// they are easy to unit test).

export type ReviewResult = { concept: string; correct: boolean };

/**
 * Several questions in one lesson often test the same concept. Applying a
 * review per question would count one sitting as several spaced reviews and
 * push the next review too far out. Collapse them to ONE result per concept:
 * the concept counts as correct only if every answer on it was correct.
 */
export function collapseByConcept(results: ReviewResult[]): ReviewResult[] {
  const byConcept = new Map<string, boolean>();
  for (const r of results) {
    byConcept.set(r.concept, (byConcept.get(r.concept) ?? true) && r.correct);
  }
  return [...byConcept].map(([concept, correct]) => ({ concept, correct }));
}

/** Daily budget for XP that can be earned by repeating things you already did. */
export const REPEAT_XP_CAP = 100;

/** XP for finishing a lesson. Replays are worth much less than a first clear. */
export function lessonReward(firstTime: boolean, firstTryCorrect: number) {
  return firstTime ? 40 + firstTryCorrect * 8 : 4 + firstTryCorrect * 2;
}

/** How much of `want` still fits in today's repeat-XP budget. */
export function capRepeatXp(usedToday: number, want: number, cap = REPEAT_XP_CAP) {
  return Math.max(0, Math.min(Math.round(want), cap - usedToday));
}
