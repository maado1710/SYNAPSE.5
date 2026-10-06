export type QuestionKind = "choice" | "fill" | "order" | "bool" | "code";

export type Question = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  code?: string;
  /** For choice: options. For fill: chips. For order: correct line order. */
  choices?: string[];
  /** choice: index. fill: the chip string. bool: true/false. order: unused. */
  answer?: number | string | boolean;
  /** code: text already in the editor (e.g. a buggy snippet to fix). */
  starter?: string;
  /** code: exact text the program must print. */
  expected?: string;
  /** code: substrings the source must contain (comments ignored). */
  requires?: string[];
  why: string;
  concept: string;
};

export type Term = { term: string; def: string };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  teach: {
    title: string;
    body: string;
    code?: string;
    note?: string;
  };
  terms: Term[];
  questions: Question[];
};

export type Chapter = {
  id: string;
  title: string;
  summary: string;
  clash: { name: string; blurb: string };
  lessons: Lesson[];
};

export type Track = {
  id: string;
  name: string;
  short: string;
  blurb: string;
  level: string;
  chapters: Chapter[];
};
