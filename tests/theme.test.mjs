import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readSaved, writeSaved, resolveTheme, nextTheme, STORAGE_KEY } from "../card/theme.js";

/* ── 主題判斷 ── */

test("沒按過切換鈕：跟著手機系統", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
  assert.equal(resolveTheme(null, undefined), "light"); // 舊瀏覽器沒有 matchMedia
});

test("按過切換鈕：照客人選的，不管系統", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("切換鈕在深淺之間來回", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
  assert.equal(nextTheme(null), "dark");
});

test("存下的值被竄改或是舊格式：當作沒選過", () => {
  const storage = { getItem: () => "purple" };
  assert.equal(readSaved(storage), null);
});

test("無痕模式或網站資料被封鎖：讀寫丟錯也不會讓名片壞掉", () => {
  const broken = {
    getItem() { throw new Error("SecurityError"); },
    setItem() { throw new Error("QuotaExceededError"); },
  };
  assert.equal(readSaved(broken), null);
  assert.doesNotThrow(() => writeSaved(broken, "dark"));
  assert.equal(readSaved(null), null);
});

test("存了再讀回來是同一個", () => {
  const box = {};
  const storage = { getItem: (k) => box[k] ?? null, setItem: (k, v) => { box[k] = v; } };
  writeSaved(storage, "dark");
  assert.equal(box[STORAGE_KEY], "dark");
  assert.equal(readSaved(storage), "dark");
});

/* ── 對比度 ──
   直接從 styles.css 讀出深淺兩套用途色，逐對計算 WCAG 對比度。
   日後改色改到看不清楚，這裡會擋下，不必靠眼睛判斷。 */

const css = readFileSync(new URL("../card/styles.css", import.meta.url), "utf8");

const tokensIn = (selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `styles.css 找不到 ${selector}`);
  const body = css.slice(start, css.indexOf("\n}", start));
  const out = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g)) out[name] = value;
  return out;
};

const light = tokensIn(":root");
const dark = { ...light, ...tokensIn(':root[data-theme="dark"]') };

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [前景, 背景, 用在哪]——都是小字，一律要求 WCAG AA 4.5:1
const PAIRS = [
  ["text", "bg-card", "內文"],
  ["text", "bg-panel", "區塊內文"],
  ["text", "bg-surface", "導航卡的地址"],
  ["text-muted", "bg-panel", "說明文字、營業時間的星期"],
  ["text-muted", "bg-card", "頁尾"],
  ["text-strong", "bg-highlight", "營業時間表的今天"],
  ["text-strong", "bg-surface", "服務項目"],
  ["text-accent", "bg-panel", "區塊小標"],
  ["text-strong", "bg-surface", "導航卡的「開啟導航」"],
  ["text-closed", "bg-panel", "公休"],
  ["btn-fg", "btn-bg", "存聯絡人按鈕"],
  ["open-fg", "open-bg", "營業中"],
  ["soon-fg", "soon-bg", "即將打烊"],
  ["closed-fg", "closed-bg", "休息中"],
  ["success-text", "bg-surface", "存檔成功"],
  ["error-text", "bg-panel", "錯誤訊息"],
  ["warning-text", "bg-panel", "警告訊息"],
];

for (const [themeName, t] of [["淺色", light], ["深色", dark]]) {
  test(`${themeName}主題：所有文字與底色對比度都過 WCAG AA`, () => {
    const fails = PAIRS
      .map(([fg, bg, where]) => {
        assert.ok(t[fg] && t[bg], `${themeName}主題缺少 --${fg} 或 --${bg}`);
        return { where, fg, bg, r: ratio(t[fg], t[bg]) };
      })
      .filter((x) => x.r < 4.5)
      .map((x) => `${x.where}（--${x.fg} on --${x.bg}）${x.r.toFixed(2)}:1`);
    assert.deepEqual(fails, [], `對比不足：\n  ${fails.join("\n  ")}`);
  });
}

test("深色主題的每個用途色都有定義，沒有漏掉而沿用到淺色的", () => {
  const darkOwn = tokensIn(':root[data-theme="dark"]');
  // 只檢查用途色；品牌色（--wood、--open…）本來就是兩種主題共用
  const semantic = Object.keys(light).filter((k) => /^(bg|text|btn)-|-(fg|bg)$|^(success|error|warning)-text$|^border$/.test(k));
  const missing = semantic.filter((k) => !(k in darkOwn));
  assert.deepEqual(missing, [], `深色主題缺少：${missing.join(", ")}`);
});
