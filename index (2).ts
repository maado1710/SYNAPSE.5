import type { Chapter, Lesson, Question, Track } from "./types";
import { python } from "./python";
import { javascript } from "./javascript";
import { html } from "./html";
import { css } from "./css";
import { java } from "./java";
import { sql } from "./sql";
import { typescript } from "./typescript";
import { git } from "./git";

export type { Chapter, Lesson, Question, Track } from "./types";

export const TRACKS: Track[] = [
  python,
  javascript,
  html,
  css,
  java,
  sql,
  typescript,
  git,
];

export function getTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function getChapter(langId: string, chapterId: string): Chapter | undefined {
  return getTrack(langId)?.chapters.find((c) => c.id === chapterId);
}

export function getLesson(
  langId: string,
  chapterId: string,
  lessonId: string,
): Lesson | undefined {
  return getChapter(langId, chapterId)?.lessons.find((l) => l.id === lessonId);
}

export function allQuestions(track: Track): Question[] {
  return track.chapters.flatMap((c) => c.lessons.flatMap((l) => l.questions));
}

export function chapterQuestions(chapter: Chapter): Question[] {
  return chapter.lessons.flatMap((l) => l.questions);
}

export function allTerms(track: Track) {
  return track.chapters.flatMap((c) => c.lessons.flatMap((l) => l.terms));
}

export function lessonCount(track: Track) {
  return track.chapters.reduce((n, c) => n + c.lessons.length, 0);
}

/** Questions that work in quick tap-to-answer games (no typing / no runtime needed). */
export function tapQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.kind !== "code");
}
