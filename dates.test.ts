import assert from "node:assert/strict";
import { test } from "node:test";
import { dayKey, todayKey, yesterdayKey } from "./dates.ts";

test("dayKey uses local calendar fields, zero padded", () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(dayKey(new Date(2026, 11, 31, 0, 1)), "2026-12-31");
});

test("yesterdayKey crosses month and year boundaries", () => {
  assert.equal(yesterdayKey(new Date(2026, 2, 1, 12)), "2026-02-28");
  assert.equal(yesterdayKey(new Date(2027, 0, 1, 0, 5)), "2026-12-31");
});

test("yesterdayKey is one calendar day before todayKey at any hour", () => {
  for (const hour of [0, 1, 12, 23]) {
    const d = new Date(2026, 9, 5, hour, 30);
    assert.equal(todayKey(d), "2026-10-05");
    assert.equal(yesterdayKey(d), "2026-10-04");
  }
});
