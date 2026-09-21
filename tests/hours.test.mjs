import test from "node:test";
import assert from "node:assert/strict";
import { statusAt, rangesFor, toMinutes, taipeiParts, formatMinutes } from "../card/hours.js";

// 一間有午休、週日公休的典型社區藥局
const HOURS = {
  weekly: {
    0: [],                                  // 週日公休
    1: [["08:30", "12:30"], ["14:00", "21:00"]],
    2: [["08:30", "12:30"], ["14:00", "21:00"]],
    3: [["08:30", "12:30"], ["14:00", "21:00"]],
    4: [["08:30", "12:30"], ["14:00", "21:00"]],
    5: [["08:30", "12:30"], ["14:00", "21:00"]],
    6: [["09:00", "17:00"]],
  },
  closedDates: ["2026-10-10"],
  note: { zh: "", en: "", ja: "" },
};

// 台北時間 = UTC+8，無日光節約。以 UTC 建構時刻，避免受測試機器時區影響。
const taipei = (iso) => new Date(`${iso}+08:00`);

test("時間字串解析：無效值一律回 null，不會被當成 00:00", () => {
  assert.equal(toMinutes("08:30"), 510);
  assert.equal(toMinutes("00:00"), 0);
  assert.equal(toMinutes("TODO"), null);
  assert.equal(toMinutes(""), null);
  assert.equal(toMinutes("25:00"), null);
  assert.equal(toMinutes("8.30"), null);
});

test("時區固定台北：人在國外用漫遊看名片，狀態仍以店裡的時間為準", () => {
  // 同一瞬間：台北週一上午 10:00
  const moment = new Date("2026-09-21T02:00:00.000Z");
  const parts = taipeiParts(moment);
  assert.equal(parts.weekday, 1);
  assert.equal(formatMinutes(parts.minutes), "10:00");
  assert.equal(statusAt(moment, HOURS).state, "open");
});

test("營業中", () => {
  const s = statusAt(taipei("2026-09-21T10:00"), HOURS);   // 週一上午
  assert.equal(s.state, "open");
  assert.equal(s.closingSoon, false);
  assert.equal(formatMinutes(s.closesAt), "12:30");
});

test("午休時段要顯示休息中，而不是因為「今天有開」就說營業中", () => {
  const s = statusAt(taipei("2026-09-21T13:00"), HOURS);
  assert.equal(s.state, "closed");
  assert.equal(s.nextOpen.daysAhead, 0);
  assert.equal(formatMinutes(s.nextOpen.minutes), "14:00");
  assert.equal(s.openingSoon, true);                        // 一小時內就開
});

test("打烊前 30 分鐘提醒即將打烊——客人才不會踩著門關白跑一趟", () => {
  const s = statusAt(taipei("2026-09-21T20:45"), HOURS);
  assert.equal(s.state, "open");
  assert.equal(s.closingSoon, true);
});

test("開門的那一分鐘算營業，打烊的那一分鐘算休息", () => {
  assert.equal(statusAt(taipei("2026-09-21T08:30"), HOURS).state, "open");
  assert.equal(statusAt(taipei("2026-09-21T21:00"), HOURS).state, "closed");
});

test("打烊之後指向明天的第一個時段", () => {
  const s = statusAt(taipei("2026-09-21T22:00"), HOURS);   // 週一深夜
  assert.equal(s.state, "closed");
  assert.equal(s.nextOpen.weekday, 2);
  assert.equal(s.nextOpen.daysAhead, 1);
  assert.equal(formatMinutes(s.nextOpen.minutes), "08:30");
  assert.equal(s.openingSoon, false);                       // 隔天才開，不算「即將開門」
});

test("週日公休：跨過公休日指到週一", () => {
  const s = statusAt(taipei("2026-09-20T11:00"), HOURS);   // 週日上午
  assert.equal(s.state, "closed");
  assert.deepEqual(s.todayRanges, []);
  assert.equal(s.nextOpen.weekday, 1);
  assert.equal(s.nextOpen.daysAhead, 1);
});

test("國定假日臨時公休：當天一律休息，即使週間有排班", () => {
  const s = statusAt(taipei("2026-10-10T10:00"), HOURS);   // 2026-10-10 是週六
  assert.equal(s.state, "closed");
  assert.deepEqual(s.todayRanges, []);
});

test("一週只開一天也能正確回答「下次何時開」", () => {
  const rare = { weekly: { 0: [], 1: [], 2: [], 3: [["09:00", "12:00"]], 4: [], 5: [], 6: [] }, closedDates: [] };
  const s = statusAt(taipei("2026-09-24T13:00"), rare);    // 週四下午，剛錯過週三
  assert.equal(s.nextOpen.weekday, 3);
  assert.equal(s.nextOpen.daysAhead, 6);
});

test("營業時間完全沒設定時不硬掰狀態", () => {
  const empty = { weekly: {}, closedDates: [] };
  const s = statusAt(taipei("2026-09-21T10:00"), empty);
  assert.equal(s.state, "closed");
  assert.equal(s.nextOpen, null);
});

test("config 還是 TODO 時，時段視為無效而非 00:00–00:00", () => {
  const todo = { weekly: { 1: [["TODO", "TODO"]] }, closedDates: [] };
  assert.deepEqual(rangesFor(todo, 1, null), []);
});

test("結束時間早於開始時間的設定會被丟掉，不會產生負長度時段", () => {
  const broken = { weekly: { 1: [["21:00", "08:30"]] }, closedDates: [] };
  assert.deepEqual(rangesFor(broken, 1, null), []);
});
