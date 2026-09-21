// npm run stamp：重新計算資源指紋並寫進 card/index.html。
// 改了任何 JS 或 styles.css 之後都要跑；忘了跑，npm test 會擋下。

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeStamp, renderHeadBlock, appScriptTag } from "./asset-stamp.mjs";

const cardDir = join(dirname(fileURLToPath(import.meta.url)), "..", "card");
const htmlPath = join(cardDir, "index.html");
const stamp = computeStamp(cardDir);

let html = readFileSync(htmlPath, "utf8");

const block = /<!-- asset-stamp:start[\s\S]*?<!-- asset-stamp:end -->/;
if (block.test(html)) {
  html = html.replace(block, renderHeadBlock(stamp));
} else {
  // 第一次：把原本的樣式表連結換成指紋區塊
  const link = /<link rel="stylesheet" href="styles\.css[^"]*">/;
  if (!link.test(html)) throw new Error("index.html 找不到 styles.css 的 <link>");
  html = html.replace(link, renderHeadBlock(stamp));
}

const app = /<script type="module" src="app\.js[^"]*"><\/script>/;
if (!app.test(html)) throw new Error("index.html 找不到 app.js 的 <script>");
html = html.replace(app, appScriptTag(stamp));

writeFileSync(htmlPath, html);
console.log(`資源指紋 ${stamp} 已寫入 card/index.html`);
