// 資源指紋與內容同步。
// 改了 JS 或 styles.css 卻忘了 npm run stamp，這裡會擋下——
// 否則上線後會有客人拿到新舊混用的頁面（詳見 scripts/asset-stamp.mjs 開頭說明）。

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeStamp, renderHeadBlock, appScriptTag, MODULES, STYLES } from "../scripts/asset-stamp.mjs";

const cardDir = join(dirname(fileURLToPath(import.meta.url)), "..", "card");
const html = readFileSync(join(cardDir, "index.html"), "utf8");
const stamp = computeStamp(cardDir);

test("index.html 的資源指紋與目前檔案內容一致（改了程式要跑 npm run stamp）", () => {
  assert.ok(html.includes(renderHeadBlock(stamp)), `import map／樣式表的指紋過期，請執行：npm run stamp（目前應為 ${stamp}）`);
  assert.ok(html.includes(appScriptTag(stamp)), `app.js 的指紋過期，請執行：npm run stamp（目前應為 ${stamp}）`);
});

test("import map 在任何模組腳本之前（否則瀏覽器會忽略它）", () => {
  const map = html.indexOf('<script type="importmap">');
  const firstModule = html.indexOf('<script type="module"');
  assert.ok(map >= 0 && map < firstModule, "import map 必須出現在 <script type=\"module\"> 之前");
});

test("card/ 下每個 JS 都有列入指紋清單（新增模組忘了登記，它就不會換網址）", () => {
  const onDisk = readdirSync(cardDir).filter((f) => f.endsWith(".js")).sort();
  assert.deepEqual(onDisk, [...MODULES].sort(), "scripts/asset-stamp.mjs 的 MODULES 與 card/*.js 不一致");
  assert.deepEqual(STYLES, ["styles.css"]);
});

test("所有模組彼此引用都用相對路徑 ./xxx.js，才會被 import map 對應到", () => {
  for (const m of MODULES) {
    const src = readFileSync(join(cardDir, m), "utf8");
    for (const [, spec] of src.matchAll(/^import[^"']*["']([^"']+)["']/gm)) {
      assert.match(spec, /^\.\/[\w-]+\.js$/, `${m} 引用了 ${spec}，import map 對不到`);
    }
  }
});
