import { TRACKS, getTrack, tapQuestions, type Question, type Track } from "./curriculum";
import { chapterKey, lessonKey, shuffle } from "./utils";
import { useApp } from "./store";

export function trackProgress(langId: string) {
  const track = getTrack(langId);
  const completed = useApp.getState().completed;
  if (!track) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  let total = 0;
  for (const ch of track.chapters) {
    for (const les of ch.lessons) {
      total += 1;
      if (completed[lessonKey(langId, ch.id, les.id)]) done += 1;
    }
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function chapterDone(langId: string, chapterId: string) {
  const track = getTrack(langId);
  const chapter = track?.chapters.find((c) => c.id === chapterId);
  const completed = useApp.getState().completed;
  if (!chapter) return false;
  return chapter.lessons.every((l) => completed[lessonKey(langId, chapterId, l.id)]);
}

export function chapterUnlocked(langId: string, chapterId: string) {
  const track = getTrack(langId);
  if (!track) return false;
  const idx = track.chapters.findIndex((c) => c.id === chapterId);
  if (idx <= 0) return true;
  const prev = track.chapters[idx - 1];
  if (!prev) return true;
  // Finishing the lessons unlocks the next chapter. The chapter clash is an
  // optional challenge, so one hard minigame can never block your progress.
  return chapterDone(langId, prev.id);
}

export function nextLesson(langId?: string) {
  const last = useApp.getState().lastLesson;
  const startIds = langId
    ? [langId]
    : ([last?.langId, ...useApp.getState().selectedTracks, ...TRACKS.map((t) => t.id)].filter(
        Boolean,
      ) as string[]);
  const ids: string[] = [];
  for (const id of startIds) if (!ids.includes(id)) ids.push(id);

  // Pass 1: the next unfinished lesson in any unlocked chapter.
  for (const id of ids) {
    const track = getTrack(id);
    if (!track) continue;
    for (const ch of track.chapters) {
      if (!chapterUnlocked(id, ch.id)) continue;
      for (const les of ch.lessons) {
        if (!useApp.getState().completed[lessonKey(id, ch.id, les.id)]) {
          return {
            langId: id,
            chapterId: ch.id,
            lessonId: les.id,
            track,
            chapter: ch,
            lesson: les,
          };
        }
      }
    }
  }

  // Pass 2: nothing left to learn, so offer a chapter clash that hasn't been won.
  for (const id of ids) {
    const track = getTrack(id);
    if (!track) continue;
    for (const ch of track.chapters) {
      if (chapterDone(id, ch.id) && !useApp.getState().clashWon[chapterKey(id, ch.id)]) {
        return {
          langId: id,
          chapterId: ch.id,
          lessonId: "clash",
          track,
          chapter: ch,
          lesson: null,
        };
      }
    }
  }
  return null;
}

export function dueConcepts(limit = 12) {
  const now = Date.now();
  const { concepts } = useApp.getState();
  return Object.entries(concepts)
    .filter(([, m]) => m.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit)
    .map(([key, mem]) => {
      const [langId, ...rest] = key.split(":");
      return { key, langId: langId ?? "", concept: rest.join(":"), mem };
    });
}

export function languageStrength(langId: string) {
  const { concepts } = useApp.getState();
  const rows = Object.entries(concepts).filter(([k]) => k.startsWith(`${langId}:`));
  if (!rows.length) return 0;
  const avg = rows.reduce((s, [, m]) => s + m.strength, 0) / rows.length;
  return Math.round(avg);
}

export function reviewQuestions(count: number): { track: Track; question: Question }[] {
  const completed = useApp.getState().completed;
  const pool: { track: Track; question: Question }[] = [];
  for (const track of TRACKS) {
    for (const ch of track.chapters) {
      for (const les of ch.lessons) {
        const done = completed[lessonKey(track.id, ch.id, les.id)];
        if (!done) continue;
        for (const q of tapQuestions(les.questions)) pool.push({ track, question: q });
      }
    }
  }
  const source =
    pool.length > 0
      ? pool
      : TRACKS.flatMap((track) =>
          track.chapters[0]
            ? track.chapters[0].lessons.flatMap((l) =>
                tapQuestions(l.questions).map((question) => ({ track, question })),
              )
            : [],
        );
  return shuffle(source).slice(0, count);
}

export function learnedTerms(count = 6) {
  const completed = useApp.getState().completed;
  const terms: { term: string; def: string; langId: string }[] = [];
  for (const track of TRACKS) {
    for (const ch of track.chapters) {
      for (const les of ch.lessons) {
        if (!completed[lessonKey(track.id, ch.id, les.id)]) continue;
        for (const t of les.terms) terms.push({ ...t, langId: track.id });
      }
    }
  }
  const source =
    terms.length > 0
      ? terms
      : (TRACKS[0]?.chapters[0]?.lessons.flatMap((l) =>
          l.terms.map((t) => ({ ...t, langId: TRACKS[0]!.id })),
        ) ?? []);
  const unique = new Map<string, (typeof source)[0]>();
  for (const t of source) unique.set(t.term, t);
  return shuffle([...unique.values()]).slice(0, count);
}
