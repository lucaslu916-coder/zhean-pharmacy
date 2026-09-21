// 資源指紋：讓每個 JS／CSS 的網址跟著內容變。
//
// 為什麼需要：GitHub Pages 對靜態檔給 10 分鐘快取（max-age=600）。
// 若 HTML 是新的、JS 卻是快取裡的舊版，頁面就會新舊混用——
// 2026-09-21 實際發生過：新 HTML 已套淺色，舊 app.js 又依舊規則改回深色。
// 網址帶上內容指紋後，內容一變網址就變，瀏覽器不可能拿到舊檔。
//
// 做法（不需要建置工具）：
// - index.html 直接載入的 styles.css、app.js 加 ?v=指紋
// - app.js 再引用的模組（config.js、hours.js…）用瀏覽器原生的 import map 統一加 ?v=指紋
//
// 指紋 = 所有前端檔案內容的 SHA-256 前 10 碼。任何一個檔改了，全部一起換，
// 這樣不會出現「config.js 新、hours.js 舊」這種半套的組合。

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// 名片頁用到的所有 JS 模組與樣式。新增模組時要加進來，否則它不會被加上指紋。
export const MODULES = ["app.js", "config.js", "vcard.js", "save-strategy.js", "hours.js", "maps.js", "theme.js"];
export const STYLES = ["styles.css"];

export const computeStamp = (cardDir) => {
  const h = createHash("sha256");
  for (const f of [...MODULES, ...STYLES].sort()) {
    // 換行統一成 LF 再算：Windows 的 autocrlf 會讓同一份內容在不同機器上位元組不同
    h.update(f + "\0" + readFileSync(join(cardDir, f), "utf8").replace(/\r\n/g, "\n") + "\0");
  }
  return h.digest("hex").slice(0, 10);
};

// index.html 裡 <!-- asset-stamp:start --> 與 <!-- asset-stamp:end --> 之間的內容
export const renderHeadBlock = (stamp) => {
  const imports = Object.fromEntries(
    MODULES.filter((m) => m !== "app.js").map((m) => [`./${m}`, `./${m}?v=${stamp}`]),
  );
  return [
    "<!-- asset-stamp:start — 由 npm run stamp 產生，請勿手改 -->",
    '<script type="importmap">',
    JSON.stringify({ imports }, null, 2),
    "</script>",
    `<link rel="stylesheet" href="styles.css?v=${stamp}">`,
    "<!-- asset-stamp:end -->",
  ].join("\n");
};

export const appScriptTag = (stamp) => `<script type="module" src="app.js?v=${stamp}"></script>`;
