import test from "node:test";
import assert from "node:assert/strict";
import { deliveryPlan } from "../card/save-strategy.js";
import { buildVCard, formatWeeklyHours } from "../card/vcard.js";
import { mapsUrl } from "../card/maps.js";
import { shop } from "../card/config.js";

/* ── 交付策略 ──
   這幾項是從 Lucas Lu 名片的 Android 事故移植過來的回歸測試。
   當時 8 項測試全過卻讓 Android 壞著上線，因為那些測試比對的是原始碼字串，
   等於把錯誤行為鎖成正確答案。這裡測的是行為。 */

const DEVICES = [
  { name: "Android Chrome（可分享）", canShareFiles: true,  isIOS: false },
  { name: "Android 舊版（不可分享）", canShareFiles: false, isIOS: false },
  { name: "iOS Safari（可分享）",     canShareFiles: true,  isIOS: true  },
  { name: "iOS App 內建瀏覽器",       canShareFiles: false, isIOS: true  },
  { name: "桌面瀏覽器",               canShareFiles: false, isIOS: false },
];

test("分享永遠不是死路：每種裝置在分享之後都還有後續步驟", () => {
  for (const d of DEVICES) {
    const plan = deliveryPlan(d);
    const i = plan.indexOf("share");
    if (i !== -1) assert.ok(i < plan.length - 1, `${d.name}：share 之後沒有退路 → ${plan.join(" → ")}`);
  }
});

test("每種裝置最後都保有手動另存連結", () => {
  for (const d of DEVICES) {
    assert.equal(deliveryPlan(d).at(-1), "manual-link", `${d.name} 缺少最終退路`);
  }
});

test("Android 分享失敗後必須落到一般下載", () => {
  assert.deepEqual(deliveryPlan({ canShareFiles: true, isIOS: false }), ["share", "download", "manual-link"]);
});

test("Android 不該看到 iOS 專用的 Safari 指南針指引", () => {
  for (const d of DEVICES.filter((x) => !x.isIOS)) {
    assert.ok(!deliveryPlan(d).includes("ios-in-app-guidance"), `${d.name} 出現了 iOS 專用指引`);
  }
});

test("Android 不得走靜態 .vcf——實測一律變成下載，沒有直接開啟聯絡人的路", () => {
  for (const d of DEVICES.filter((x) => !x.isIOS)) {
    assert.ok(!deliveryPlan(d).includes("direct-vcf"), `${d.name} 出現了 direct-vcf`);
  }
});

test("iOS Safari 走靜態 .vcf 捷徑，可直接跳出聯絡人卡片", () => {
  assert.deepEqual(
    deliveryPlan({ canShareFiles: true, isIOS: true }),
    ["direct-vcf", "share", "ios-in-app-guidance", "manual-link"],
  );
});

test("iOS App 內建瀏覽器不得走靜態 .vcf——它連導航都會失敗且毫無回饋", () => {
  assert.deepEqual(
    deliveryPlan({ canShareFiles: false, isIOS: true }),
    ["ios-in-app-guidance", "manual-link"],
  );
});

test("桌面瀏覽器直接走下載", () => {
  assert.deepEqual(deliveryPlan({ canShareFiles: false, isIOS: false }), ["download", "manual-link"]);
});

/* ── 導航連結 ── */

test("有正式 Google 地圖連結時優先使用", () => {
  assert.equal(
    mapsUrl({ mapsUrl: "https://maps.app.goo.gl/abc123", addressText: "高雄市…" }),
    "https://maps.app.goo.gl/abc123",
  );
});

test("沒有正式連結時以地址組出搜尋網址，中文地址要正確編碼", () => {
  const url = mapsUrl({ mapsUrl: null, addressText: "高雄市三民區建國三路 1 號" });
  assert.ok(url.startsWith("https://www.google.com/maps/search/?api=1&query="));
  assert.equal(decodeURIComponent(url.split("query=")[1]), "高雄市三民區建國三路 1 號");
});

test("地址還沒填時回 null，頁面才能把導航按鈕藏起來，而不是給一顆點了沒反應的按鈕", () => {
  assert.equal(mapsUrl({ mapsUrl: null, addressText: "TODO：完整地址" }), null);
  assert.equal(mapsUrl({ mapsUrl: "TODO", addressText: "" }), null);
  assert.equal(mapsUrl({ mapsUrl: null, addressText: "   " }), null);
});

/* ── vCard 格式 ──
   這些細節決定 iOS／Android 通訊錄認不認得這張卡。 */

const AT = new Date("2026-09-20T08:00:00.000Z");

test("產出 vCard 3.0，CRLF 換行、無 UTF-8 BOM", () => {
  const v = buildVCard({ language: "zh", timestamp: AT });
  assert.ok(v.startsWith("BEGIN:VCARD\r\n"));
  assert.ok(v.includes("VERSION:3.0\r\n"));
  assert.ok(v.trimEnd().endsWith("END:VCARD"));
  assert.ok(!v.includes("﻿"));
  assert.ok(!/[^\r]\n/.test(v), "出現了沒有搭配 CR 的 LF");
});

test("每一行都不超過 RFC 2426 的 75 位元組上限", () => {
  for (const lang of ["zh", "en", "ja"]) {
    const v = buildVCard({ language: lang, timestamp: AT });
    for (const line of v.split("\r\n")) {
      const bytes = Buffer.byteLength(line, "utf8");
      assert.ok(bytes <= 75, `${lang}：有一行 ${bytes} 位元組 → ${line}`);
    }
  }
});

test("存的是一間店而不是一個人：FN 用店名、N 留空、標記為公司", () => {
  const v = buildVCard({ language: "zh", timestamp: AT });
  assert.ok(v.includes("FN;CHARSET=UTF-8:喆安藥行"));
  assert.ok(v.includes("N;CHARSET=UTF-8:;;;;"), "N 應留空，不該把店名硬拆成姓和名");
  assert.ok(v.includes("X-ABShowAs:COMPANY"));
});

test("營業時間寫進 NOTE：存進通訊錄後最常需要的就是「現在開不開」", () => {
  const hours = {
    weekly: {
      0: [], 1: [["08:30", "21:00"]], 2: [["08:30", "21:00"]], 3: [["08:30", "21:00"]],
      4: [["08:30", "21:00"]], 5: [["08:30", "21:00"]], 6: [["09:00", "17:00"]],
    },
    closedDates: [],
  };
  // 相鄰且時段相同的日子要合併，不要變成七行流水帳
  assert.equal(
    formatWeeklyHours(hours, "zh"),
    "一–五 08:30–21:00\n六 09:00–17:00\n日 公休",
  );
  assert.equal(
    formatWeeklyHours(hours, "en"),
    "Mon–Fri 08:30–21:00\nSat 09:00–17:00\nSun Closed",
  );
});

test("午休會在 NOTE 裡完整列出兩段，不會被壓成一整天", () => {
  const hours = { weekly: { 1: [["08:30", "12:30"], ["14:00", "21:00"]] }, closedDates: [] };
  assert.ok(formatWeeklyHours(hours, "zh").includes("08:30–12:30, 14:00–21:00"));
});

test("沒有 Email／官網時不留下空欄位", () => {
  const v = buildVCard({ language: "zh", timestamp: AT });
  assert.ok(!/EMAIL;[^\r\n]*:\s*(\r\n|$)/.test(v), "出現了空的 EMAIL 欄位");
  assert.ok(v.includes("URL:"), "沒有官網時應退回名片頁網址");
});

/* ── 聯絡人備註的稱謂 ──
   回歸測試：vcard.js 曾把「藥師」寫死在備註裡，網頁已改「負責人」，
   存進手機的聯絡人卻仍寫「藥師」。這裡檢查實際產出的 VCF，不比對原始碼。 */
const unfoldVCard = (v) => v.replace(/\r\n[ \t]/g, "");

test("聯絡人備註的稱謂取自 config，三語都一致", () => {
  for (const lang of ["zh", "en", "ja"]) {
    const note = unfoldVCard(buildVCard({ language: lang })).split("\r\n").find((l) => l.startsWith("NOTE"));
    const title = shop.pharmacy.pharmacist.title[lang];
    assert.ok(note.includes(`${title}：`), `${lang}：備註應以「${title}」稱呼，實際為 ${note}`);
  }
});

test("稱謂不是藥師時，聯絡人裡不得出現藥師字樣", () => {
  if (shop.pharmacy.pharmacist.title.zh === "藥師") return;
  for (const [lang, word] of [["zh", "藥師"], ["en", "Pharmacist"], ["ja", "薬剤師"]]) {
    const v = unfoldVCard(buildVCard({ language: lang }));
    assert.ok(!v.includes(word), `${lang}：聯絡人檔出現「${word}」，但這家店的稱謂是「${shop.pharmacy.pharmacist.title[lang]}」`);
  }
});
