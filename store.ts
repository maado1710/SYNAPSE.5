import { create } from "zustand";
import { persist } from "zustand/middleware";
import { chapterKey, lessonKey, todayKey, yesterdayKey } from "./utils";
import {
  type ReviewResult,
  capRepeatXp,
  collapseByConcept,
  lessonReward,
} from "./review";

export type ConceptMem = {
  strength: number;
  due: number;
  last: number;
  correct: number;
  wrong: number;
};

export type LastLesson = {
  langId: string;
  chapterId: string;
  lessonId: string;
};

type AppState = {
  onboarded: boolean;
  name: string;
  dailyGoal: number;
  xp: number;
  xpToday: number;
  xpDay: string;
  /** XP earned today from repeating things already done (capped per day). */
  repeatXpToday: number;
  repeatXpDay: string;
  streak: number;
  lastActive: string;
  bestStreak: number;
  completed: Record<string, true>;
  clashWon: Record<string, true>;
  concepts: Record<string, ConceptMem>;
  selectedTracks: string[];
  lastLesson: LastLesson | null;

  completeOnboarding: (name: string, goal: number, tracks: string[]) => void;
  setName: (name: string) => void;
  setGoal: (goal: number) => void;
  awardXp: (amount: number) => number;
  /** Like awardXp, but counts against today's cap for repeatable XP. Returns XP actually gained. */
  awardRepeatXp: (amount: number) => number;
  /** `results` = first-try answers only (one per question, retries excluded). */
  completeLesson: (langId: string, chapterId: string, lessonId: string, results: ReviewResult[]) => void;
  reviewConcept: (langId: string, concept: string, correct: boolean) => void;
  winClash: (langId: string, chapterId: string) => void;
  setLastLesson: (loc: LastLesson) => void;
};

function bumpStreak(state: Pick<AppState, "streak" | "lastActive" | "bestStreak" | "xpDay" | "xpToday">) {
  const today = todayKey();
  let { streak, lastActive, bestStreak, xpDay, xpToday } = state;
  if (xpDay !== today) {
    xpToday = 0;
    xpDay = today;
  }
  if (lastActive !== today) {
    if (lastActive === yesterdayKey()) streak += 1;
    else streak = 1;
    lastActive = today;
    if (streak > bestStreak) bestStreak = streak;
  }
  return { streak, lastActive, bestStreak, xpDay, xpToday };
}

function repeatUsedToday(state: Pick<AppState, "repeatXpDay" | "repeatXpToday">) {
  return state.repeatXpDay === todayKey() ? state.repeatXpToday : 0;
}

function intervalMs(strength: number) {
  if (strength >= 80) return 7 * 24 * 60 * 60 * 1000;
  if (strength >= 55) return 3 * 24 * 60 * 60 * 1000;
  if (strength >= 30) return 24 * 60 * 60 * 1000;
  return 4 * 60 * 60 * 1000;
}

function applyReview(mem: ConceptMem | undefined, correct: boolean): ConceptMem {
  const now = Date.now();
  const prev = mem ?? { strength: 0, due: now, last: 0, correct: 0, wrong: 0 };
  if (correct) {
    const strength = Math.min(100, prev.strength + 18);
    return {
      strength,
      due: now + intervalMs(strength),
      last: now,
      correct: prev.correct + 1,
      wrong: prev.wrong,
    };
  }
  const strength = Math.max(0, prev.strength - 22);
  return {
    strength,
    due: now + 20 * 60 * 1000,
    last: now,
    correct: prev.correct,
    wrong: prev.wrong + 1,
  };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      name: "Learner",
      dailyGoal: 40,
      xp: 0,
      xpToday: 0,
      xpDay: "",
      repeatXpToday: 0,
      repeatXpDay: "",
      streak: 0,
      lastActive: "",
      bestStreak: 0,
      completed: {},
      clashWon: {},
      concepts: {},
      selectedTracks: ["python"],
      lastLesson: null,

      completeOnboarding: (name, goal, tracks) =>
        set({
          onboarded: true,
          name: name.trim() || "Learner",
          dailyGoal: goal,
          selectedTracks: tracks.length ? tracks : ["python"],
        }),

      setName: (name) => set({ name: name.trim() || "Learner" }),
      setGoal: (goal) => set({ dailyGoal: goal }),

      awardXp: (amount) => {
        const next = bumpStreak(get());
        const gained = Math.max(0, Math.round(amount));
        set({
          ...next,
          xp: get().xp + gained,
          xpToday: next.xpToday + gained,
        });
        return gained;
      },

      awardRepeatXp: (amount) => {
        const used = repeatUsedToday(get());
        const gained = capRepeatXp(used, amount);
        const next = bumpStreak(get());
        set({
          ...next,
          repeatXpDay: todayKey(),
          repeatXpToday: used + gained,
          xp: get().xp + gained,
          xpToday: next.xpToday + gained,
        });
        return gained;
      },

      completeLesson: (langId, chapterId, lessonId, results) => {
        const key = lessonKey(langId, chapterId, lessonId);
        const firstTime = !get().completed[key];
        const concepts = { ...get().concepts };
        // One review per concept per sitting, not one per question.
        for (const r of collapseByConcept(results)) {
          const ck = `${langId}:${r.concept}`;
          concepts[ck] = applyReview(concepts[ck], r.correct);
        }
        const next = bumpStreak(get());
        const reward = lessonReward(firstTime, results.filter((r) => r.correct).length);
        let gained = reward;
        let repeat: { repeatXpDay?: string; repeatXpToday?: number } = {};
        if (!firstTime) {
          const used = repeatUsedToday(get());
          gained = capRepeatXp(used, reward);
          repeat = { repeatXpDay: todayKey(), repeatXpToday: used + gained };
        }
        set({
          ...next,
          ...repeat,
          completed: { ...get().completed, [key]: true },
          concepts,
          lastLesson: { langId, chapterId, lessonId },
          xp: get().xp + gained,
          xpToday: next.xpToday + gained,
        });
      },

      reviewConcept: (langId, concept, correct) => {
        const ck = `${langId}:${concept}`;
        const concepts = { ...get().concepts, [ck]: applyReview(get().concepts[ck], correct) };
        set({ concepts });
      },

      winClash: (langId, chapterId) => {
        const key = chapterKey(langId, chapterId);
        if (get().clashWon[key]) {
          get().awardRepeatXp(10);
          return;
        }
        const next = bumpStreak(get());
        set({
          ...next,
          clashWon: { ...get().clashWon, [key]: true },
          xp: get().xp + 60,
          xpToday: next.xpToday + 60,
        });
      },

      setLastLesson: (loc) => set({ lastLesson: loc }),
    }),
    {
      name: "synapse-v1",
      partialize: (s) => ({
        onboarded: s.onboarded,
        name: s.name,
        dailyGoal: s.dailyGoal,
        xp: s.xp,
        xpToday: s.xpToday,
        xpDay: s.xpDay,
        repeatXpToday: s.repeatXpToday,
        repeatXpDay: s.repeatXpDay,
        streak: s.streak,
        lastActive: s.lastActive,
        bestStreak: s.bestStreak,
        completed: s.completed,
        clashWon: s.clashWon,
        concepts: s.concepts,
        selectedTracks: s.selectedTracks,
        lastLesson: s.lastLesson,
      }),
    },
  ),
);

export function conceptKey(langId: string, concept: string) {
  return `${langId}:${concept}`;
}
