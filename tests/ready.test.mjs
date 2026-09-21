// 上線前檢查。
//
// 這個檔案的工作是「在資料還沒填完之前，攔住這張名片」。
// 在 config.js 填完真實資料、跑過 `npm run vcf` 之前，這裡本來就會失敗——
// 那是設計，不是壞掉。失敗訊息會直接告訴你還差哪幾欄。
//
// 為什麼要特別做這道：一張名片最糟的失敗不是當掉，而是安靜地印著錯的電話
// 或錯的營業時間上線，然後沒有人發現，直到客人白跑一趟。

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { shop } from "../card/config.js";
import { buildVCard } from "../card/vcard.js";
import { rangesFor } from "../card/hours.js";

const LANGS = ["zh", "en", "ja"];

// 深走整份 config，收集所有還留著 TODO 的欄位路徑
const findTodos = (node, path = "") => {
  if (typeof node === "string") return node.includes("TODO") ? [path] : [];
  if (Array.isArray(node)) return node.flatMap((v, i) => findTodos(v, `${path}[${i}]`));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => findTodos(v, path ? `${path}.${k}` : k));
  }
  return [];
};

test("config.js 已填入真實資料（還有 TODO 就不該上線）", () => {
  const todos = findTodos(shop);
  assert.deepEqual(todos, [], `以下欄位尚未填寫真實資料：\n  ${todos.join("\n  ")}`);
});

test("每個可翻譯欄位都齊備中英日三語", () => {
  const missing = [];
  const walk = (node, path) => {
    if (node === null || typeof node !== "object") return;
    if (typeof node.zh === "string") {
      for (const lang of LANGS) {
        if (typeof node[lang] !== "string" || !node[lang].trim()) missing.push(`${path}.${lang}`);
      }
      return;
    }
    for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
  };
  walk(shop.pharmacy, "pharmacy");
  walk(shop.hours.note, "hours.note");
  walk(shop.about, "about");
  shop.services.forEach((s, i) => walk(s, `services[${i}]`));
  assert.deepEqual(missing, [], `缺少翻譯：${missing.join(", ")}`);
});

test("電話號碼可撥打：international 必須是 + 開頭的國際格式", () => {
  assert.match(
    shop.pharmacy.phone.international,
    /^\+886-?\d[\d-]+$/,
    "international 要寫成 +886-… 的形式，撥號連結才能在海外與漫遊時正確撥出",
  );
});

test("一週至少有一天營業——整週都關代表時間還沒設定", () => {
  const openDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => rangesFor(shop.hours, d, null).length);
  assert.ok(openDays.length > 0, "weekly 沒有任何有效營業時段");
});

test("地址的 vCard 欄位已填：存進通訊錄才點得出地圖", () => {
  const [, , street, city, region, postal] = shop.pharmacy.address.vcard;
  for (const [name, value] of [["街道", street], ["鄉鎮市區", city], ["縣市", region], ["郵遞區號", postal]]) {
    assert.ok(value && !value.includes("TODO"), `vcard 地址缺少${name}`);
  }
});

test("靜態聯絡人檔已產生且與 config.js 同步（改了資料忘記重跑 npm run vcf 會被擋下）", () => {
  const path = new URL(`../card/${shop.vcard.fileName}`, import.meta.url);
  assert.ok(existsSync(path), `尚未產生 card/${shop.vcard.fileName}，請執行：npm run vcf`);
  // build-vcf.mjs 使用固定時戳，因此同步時內容應逐字元相同
  assert.equal(
    readFileSync(path, "utf8"),
    buildVCard({ language: "zh", timestamp: new Date("2026-01-01T00:00:00.000Z") }),
    `card/${shop.vcard.fileName} 已過期，請重新執行：npm run vcf`,
  );
});
