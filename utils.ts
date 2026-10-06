import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { todayKey, yesterdayKey } from "./dates";

export function lessonKey(langId: string, chapterId: string, lessonId: string) {
  return `${langId}:${chapterId}:${lessonId}`;
}

export function chapterKey(langId: string, chapterId: string) {
  return `${langId}:${chapterId}`;
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) continue;
    next[i] = b;
    next[j] = a;
  }
  return next;
}
