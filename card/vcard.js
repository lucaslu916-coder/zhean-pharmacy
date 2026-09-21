// vCard 3.0 產生器。
// escapeText 與 foldLine 自 Lucas Lu 電子名片 v2.2.0 原樣移植，折行、跳脫與
// 欄位順序完全不變——這些細節決定 iOS／Android 通訊錄認不認得這張卡，不要自行「整理」。
//
// 與個人名片的差別：這張存的是「一間店」，不是一個人。
// 因此 FN／ORG 都是店名、N 留空，並加上 X-ABShowAs:COMPANY，
// 讓 iPhone 通訊錄以公司名顯示，而不是把店名硬拆成姓和名。
import { shop } from "./config.js";
import { rangesFor, formatMinutes } from "./hours.js";

const escapeText = (value) =>
  value
    .replace(/\r\n?/g, "\n")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\;");

// RFC 2426 規定每行最多 75 位元組，續行以一個空格開頭。
// 以位元組而非字元計算，中日文才不會在多位元組字中間被切斷。
const foldLine = (line) => {
  const encoder = new TextEncoder();
  const folded = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    if (current && currentBytes + characterBytes > limit) {
      folded.push(`${folded.length ? " " : ""}${current}`);
      current = character;
      currentBytes = characterBytes;
      limit = 74; // 續行的開頭空格也算一個位元組
    } else {
      current += character;
      currentBytes += characterBytes;
    }
  }

  folded.push(`${folded.length ? " " : ""}${current}`);
  return folded;
};

const LABELS = {
  zh: { weekdays: ["日", "一", "二", "三", "四", "五", "六"], hours: "營業時間", closed: "公休" },
  en: { weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], hours: "Hours", closed: "Closed" },
  ja: { weekdays: ["日", "月", "火", "水", "木", "金", "土"], hours: "営業時間", closed: "定休" },
};

// 營業時間寫進 NOTE：客人把名片存進通訊錄之後，最常需要的就是「現在開不開」。
// 相鄰且時段相同的日子會合併成「一–五 08:30–21:00」，避免七行流水帳。
export const formatWeeklyHours = (hours, language = "zh") => {
  const labels = LABELS[language] ?? LABELS.zh;
  const describe = (weekday) => {
    const ranges = rangesFor(hours, weekday, null);
    if (!ranges.length) return labels.closed;
    return ranges.map(([open, close]) => `${formatMinutes(open)}–${formatMinutes(close)}`).join(", ");
  };

  // 由週一起算，週日排最後——符合台灣看營業時間的習慣
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups = [];
  for (const weekday of order) {
    const text = describe(weekday);
    const last = groups.at(-1);
    if (last && last.text === text) last.days.push(weekday);
    else groups.push({ days: [weekday], text });
  }

  return groups
    .map(({ days, text }) => {
      const span = days.length === 1
        ? labels.weekdays[days[0]]
        : `${labels.weekdays[days[0]]}–${labels.weekdays[days.at(-1)]}`;
      return `${span} ${text}`;
    })
    .join("\n");
};

export const buildVCard = ({ language = "zh", timestamp = new Date() } = {}) => {
  const lang = LABELS[language] ? language : "zh";
  const labels = LABELS[lang];
  const p = shop.pharmacy;

  const noteLines = [
    // 稱謂一律取 config 的 title，不在這裡寫死。
    // 原本這裡寫死「藥師」，網頁改成「負責人」後，存進手機的聯絡人卻仍寫著「藥師」——
    // 而「藥師」在台灣是有法律意義的宣稱。
    `${p.pharmacist.title[lang]}：${p.pharmacist.display[lang]}`,
    `${labels.hours}：`,
    formatWeeklyHours(shop.hours, lang),
  ];

  const logicalLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `PRODID:-//${shop.pharmacy.name.en}//Digital Business Card//${{ zh: "ZH-TW", en: "EN", ja: "JA" }[lang]}`,
    // 店家聯絡人：N 留空、FN 用店名，並明確告訴 Apple 通訊錄這是公司
    "N;CHARSET=UTF-8:;;;;",
    `FN;CHARSET=UTF-8:${escapeText(shop.pharmacy.name.zh)}`,
    `ORG;CHARSET=UTF-8:${shop.vcard.organization.map(escapeText).join(";")}`,
    "X-ABShowAs:COMPANY",
    `TEL;TYPE=WORK,VOICE:${p.phone.international}`,
    ...(p.email ? [`EMAIL;TYPE=INTERNET,WORK:${p.email}`] : []),
    `ADR;TYPE=WORK;CHARSET=UTF-8:${p.address.vcard.map(escapeText).join(";")}`,
    ...(p.website ? [`URL:${p.website}`] : [`URL:${shop.site.publicUrl}`]),
    ...(p.line.url && !p.line.url.includes("TODO") ? [`X-SOCIALPROFILE;TYPE=LINE:${p.line.url}`] : []),
    `NOTE;CHARSET=UTF-8:${escapeText(noteLines.join("\n"))}`,
    `REV:${timestamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    "END:VCARD",
  ];

  return `${logicalLines.flatMap(foldLine).join("\r\n")}\r\n`;
};

export default buildVCard;
