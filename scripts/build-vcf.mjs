// 重新產生靜態聯絡人檔。
// 這個檔是預先產生的，不會自動跟著 config.js 變——改了店名、電話、地址或
// 營業時間之後一定要重跑，否則 iPhone 走捷徑存進去的會是舊資料。
// 忘記重跑時 `npm test` 會失敗並指回這裡，不會默默送出過期的聯絡資訊。
import { writeFileSync } from "node:fs";
import { buildVCard } from "../card/vcard.js";
import { shop } from "../card/config.js";

const target = new URL(`../card/${shop.vcard.fileName}`, import.meta.url);
writeFileSync(target, buildVCard({ language: "zh", timestamp: new Date("2026-01-01T00:00:00.000Z") }));
console.log(`已產生 card/${shop.vcard.fileName}`);
