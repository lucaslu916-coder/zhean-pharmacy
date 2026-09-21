import { shop } from "./config.js";
import { buildVCard } from "./vcard.js";
import { deliveryPlan } from "./save-strategy.js";
import { statusAt, rangesFor, formatMinutes, taipeiParts } from "./hours.js";
import { mapsUrl } from "./maps.js";

/* ────────────────────────────────────────────────────────────
   介面文字（三語）。名片內容在 config.js，這裡只放介面用語。
   ──────────────────────────────────────────────────────────── */
const UI = {
  zh: {
    htmlLang: "zh-Hant", langAria: "語言切換",
    weekdays: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
    callLabel: "撥打電話", mapLabel: "開啟導航",
    hoursStep: "營業時間", hoursTitle: "每週營業時間", closed: "公休",
    servicesStep: "服務項目", servicesTitle: "我們提供的服務", servicesAria: "服務項目",
    aboutStep: "關於我們",
    open: "營業中", closingSoon: "營業中，即將打烊", closedNow: "休息中",
    closesAt: (t) => `營業中，${t} 打烊`,
    opensToday: (t) => `休息中，今天 ${t} 開門`,
    opensOn: (day, t) => `休息中，${day} ${t} 開門`,
    noHours: "營業時間尚未設定",
    lineTitle: "加入喆安藥行 LINE",
    lineDesc: "藥材詢問、備藥需求，都可以直接用 LINE 聯絡。",
    lineButton: "開啟 LINE 加好友",
    lineQrAria: "開啟 LINE 加入喆安藥行",
    saveStep: "儲存名片", saveTitle: "把喆安藥行存進手機",
    saveIntro: "存成聯絡人之後，電話、地址與營業時間都會一起帶進通訊錄，不用再回來找這一頁。",
    saveButton: "儲存到聯絡人", saveOpening: "正在開啟聯絡人…",
    footDefault: "手機會先開啟分享選單；請選擇「聯絡人」。若沒有此選項，可先「儲存到檔案」再開啟該檔。",
    footDownloaded: "已下載聯絡人檔案，開啟它即可加入通訊錄。",
    footIosInApp: "此 App 內建瀏覽器不支援分享聯絡人檔案。請點右下角的指南針圖示，以 Safari 開啟本頁後再試一次。",
    footError: "無法自動開啟聯絡人。請長按下方連結另存檔案，再點開它加入通訊錄。",
    manual: "長按這裡另存聯絡人檔案",
    resultTitle: "已下載聯絡人檔案",
    resultBody: "檔案已存到手機的「下載」資料夾。點下方按鈕開啟它，手機就會問你要不要加入聯絡人。",
    resultAction: "開啟檔案並加入聯絡人",
    shareTitle: "喆安藥行 聯絡人名片",
  },
  en: {
    htmlLang: "en", langAria: "Language",
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    callLabel: "Call us", mapLabel: "Get directions",
    hoursStep: "HOURS", hoursTitle: "Opening hours", closed: "Closed",
    servicesStep: "SERVICES", servicesTitle: "What we offer", servicesAria: "Services",
    aboutStep: "ABOUT",
    open: "Open now", closingSoon: "Open, closing soon", closedNow: "Closed now",
    closesAt: (t) => `Open now, closes at ${t}`,
    opensToday: (t) => `Closed, opens today at ${t}`,
    opensOn: (day, t) => `Closed, opens ${day} at ${t}`,
    noHours: "Opening hours not set",
    lineTitle: "Connect on LINE",
    lineDesc: "Questions about herbs or stock? Just message us on LINE.",
    lineButton: "Add on LINE",
    lineQrAria: "Open LINE to add Zhe-An Pharmacy",
    saveStep: "SAVE CONTACT", saveTitle: "Save us to your phone",
    saveIntro: "Saving the contact brings our phone number, address and opening hours into your address book.",
    saveButton: "Save to Contacts", saveOpening: "Opening contact…",
    footDefault: "On mobile, choose Contacts in the share sheet. If it is unavailable, save the file and open it.",
    footDownloaded: "The contact file has been downloaded. Open it to add the contact.",
    footIosInApp: "This in-app browser cannot share contact files. Tap the compass icon at the bottom right to open this page in Safari, then try again.",
    footError: "Could not open the contact automatically. Long-press the link below to save the file, then open it.",
    manual: "Long-press here to save the contact file",
    resultTitle: "Contact file downloaded",
    resultBody: "The file is in your Downloads folder. Open it below and your phone will offer to add the contact.",
    resultAction: "Open the file to add the contact",
    shareTitle: "Contact card for Zhe-An Pharmacy",
  },
  ja: {
    htmlLang: "ja", langAria: "言語切り替え",
    weekdays: ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"],
    callLabel: "電話をかける", mapLabel: "経路を開く",
    hoursStep: "営業時間", hoursTitle: "営業時間", closed: "定休",
    servicesStep: "サービス", servicesTitle: "提供サービス", servicesAria: "サービス",
    aboutStep: "私たちについて",
    open: "営業中", closingSoon: "まもなく閉店", closedNow: "休業中",
    closesAt: (t) => `営業中（${t} 閉店）`,
    opensToday: (t) => `休業中（本日 ${t} 開店）`,
    opensOn: (day, t) => `休業中（${day} ${t} 開店）`,
    noHours: "営業時間は未設定です",
    lineTitle: "LINE で友だち追加",
    lineDesc: "薬材のご相談や在庫のお問い合わせは LINE からどうぞ。",
    lineButton: "LINE で友だち追加",
    lineQrAria: "LINE を開いて喆安薬局を友だち追加",
    saveStep: "連絡先を保存", saveTitle: "連絡先に登録",
    saveIntro: "連絡先に保存すると、電話番号・住所・営業時間がまとめて電話帳に入ります。",
    saveButton: "連絡先に保存", saveOpening: "連絡先を開いています…",
    footDefault: "モバイルでは共有メニューが開きます。「連絡先」を選択してください。表示されない場合は、ファイルに保存してから開いてください。",
    footDownloaded: "連絡先ファイルをダウンロードしました。ファイルを開くと連絡先に追加できます。",
    footIosInApp: "このアプリ内ブラウザは連絡先ファイルを共有できません。右下のコンパスアイコンから Safari で開いて、もう一度お試しください。",
    footError: "連絡先を自動で開けませんでした。下のリンクを長押しして保存し、開いてください。",
    manual: "長押しして連絡先ファイルを保存",
    resultTitle: "連絡先ファイルをダウンロードしました",
    resultBody: "ファイルは「ダウンロード」フォルダに保存されました。下のボタンから開くと、連絡先に追加するかどうかの確認画面が表示されます。",
    resultAction: "ファイルを開いて連絡先に追加",
    shareTitle: "喆安薬局の連絡先カード",
  },
};

const $ = (id) => document.getElementById(id);
const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// 預先產生的靜態 vCard。由 npm test 確保它與 config.js 同步。
const STATIC_VCARD = shop.vcard.fileName;

let language = "zh";
let lastBlobUrl = null;

/* ────────────────────────────────────────────────────────────
   營業狀態
   ──────────────────────────────────────────────────────────── */
function renderOpenState() {
  const t = UI[language];
  const el = $("open-state");
  const status = statusAt(new Date(), shop.hours);
  const hasAnyHours = [0, 1, 2, 3, 4, 5, 6].some((d) => rangesFor(shop.hours, d, null).length);

  // 營業時間還沒設定完（例如 config 仍是 TODO）就整格藏起來，
  // 寧可不顯示，也不要對客人宣告一個錯的「休息中」。
  if (!hasAnyHours) { el.hidden = true; return; }

  el.hidden = false;
  el.classList.remove("is-open", "is-closed", "is-soon");

  if (status.state === "open") {
    el.classList.add(status.closingSoon ? "is-soon" : "is-open");
    el.textContent = status.closesAt === null
      ? t.open
      : t.closesAt(formatMinutes(status.closesAt));
    return;
  }

  el.classList.add("is-closed");
  if (!status.nextOpen) { el.textContent = t.closedNow; return; }
  const { weekday, minutes, daysAhead } = status.nextOpen;
  el.textContent = daysAhead === 0
    ? t.opensToday(formatMinutes(minutes))
    : t.opensOn(t.weekdays[weekday], formatMinutes(minutes));
}

function renderHoursTable() {
  const t = UI[language];
  const body = $("hours-body");
  // 「今天」一律以台北時區為準，與營業狀態同一個基準；
  // 用 new Date().getDay() 會拿到瀏覽器當地的星期，客人在國外看就會標錯列。
  const todayWeekday = taipeiParts(new Date()).weekday;
  body.innerHTML = "";

  // 由週一起算，週日排最後——符合台灣看營業時間的習慣
  for (const weekday of [1, 2, 3, 4, 5, 6, 0]) {
    const ranges = rangesFor(shop.hours, weekday, null);
    const row = document.createElement("tr");
    if (weekday === todayWeekday) row.className = "today";

    const dayCell = document.createElement("th");
    dayCell.scope = "row";
    dayCell.textContent = t.weekdays[weekday];

    const timeCell = document.createElement("td");
    timeCell.textContent = ranges.length
      ? ranges.map(([open, close]) => `${formatMinutes(open)}–${formatMinutes(close)}`).join("　")
      : t.closed;
    if (!ranges.length) timeCell.className = "closed";

    row.append(dayCell, timeCell);
    body.appendChild(row);
  }
}

/* ────────────────────────────────────────────────────────────
   整頁渲染
   ──────────────────────────────────────────────────────────── */
function render() {
  const t = UI[language];
  const p = shop.pharmacy;

  document.documentElement.lang = t.htmlLang;
  $("card").lang = t.htmlLang;

  $("shop-name").textContent = p.name[language];
  $("tagline").textContent = p.tagline[language];
  $("pharmacist").textContent = `${p.pharmacist.title[language]}　${p.pharmacist.display[language]}`;

  $("lang-group").setAttribute("aria-label", t.langAria);
  document.querySelectorAll("[data-t]").forEach((el) => {
    const key = el.dataset.t;
    if (typeof t[key] === "string") el.textContent = t[key];
  });

  $("call-link").href = `tel:${p.phone.international}`;
  $("call-value").textContent = p.phone.display;

  const directions = mapsUrl({ mapsUrl: p.address.mapsUrl, addressText: p.address.text[language] });
  const mapLink = $("map-link");
  if (directions) {
    mapLink.href = directions;
    mapLink.hidden = false;
  } else {
    mapLink.hidden = true;   // 地址還沒填就不要給一顆點了沒反應的按鈕
  }
  $("map-value").textContent = p.address.text[language];
  $("footer-address").textContent = p.address.text[language];

  $("hours-title").textContent = t.hoursTitle;
  $("hours-caption").textContent = t.hoursTitle;
  $("hours-note").textContent = shop.hours.note[language];
  renderHoursTable();
  renderOpenState();

  $("services-title").textContent = t.servicesTitle;
  $("service-list").setAttribute("aria-label", t.servicesAria);
  $("service-list").innerHTML = "";
  shop.services.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item[language];
    $("service-list").appendChild(li);
  });

  // 「關於我們」是選填區塊：沒資料就整塊不出現，而不是印出空標題或 TODO
  $("about-section").hidden = !shop.about;
  if (shop.about) {
    $("about-title").textContent = shop.about.heading[language];
    $("about-body").textContent = shop.about.body[language];
  }

  const hasLine = Boolean(p.line.url) && !p.line.url.includes("TODO");
  $("line-section").hidden = !hasLine;
  if (hasLine) {
    $("line-title").textContent = t.lineTitle;
    $("line-desc").textContent = t.lineDesc;
    $("line-button").textContent = t.lineButton;
    $("line-button").href = p.line.url;
    const qrLink = $("line-qr-link");
    qrLink.hidden = !p.line.qr;
    if (p.line.qr) {
      qrLink.href = p.line.url;
      qrLink.setAttribute("aria-label", t.lineQrAria);
      $("line-qr-image").src = p.line.qr;
      $("line-qr-image").alt = t.lineQrAria;
    }
  }

  $("save-title").textContent = t.saveTitle;
  $("save-intro").textContent = t.saveIntro;
  $("save-button").textContent = t.saveButton;
  $("manual-fallback").textContent = t.manual;
  $("manual-fallback").download = STATIC_VCARD;
  $("save-result-title").textContent = t.resultTitle;
  $("save-result-body").textContent = t.resultBody;
  $("save-result-action").textContent = t.resultAction;

  document.querySelectorAll("#lang-group button").forEach((b) => {
    const on = b.dataset.lang === language;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

/* ────────────────────────────────────────────────────────────
   儲存聯絡人
   —— 逐級降級鏈，任何一層失敗都往下一層走，絕不停在死路。
   ──────────────────────────────────────────────────────────── */
function setFootnote(kind) {
  const t = UI[language];
  const el = $("save-footnote");
  el.classList.remove("error", "warning");
  if (kind === "error") { el.classList.add("error"); el.textContent = t.footError; }
  else if (kind === "iosInApp") { el.classList.add("warning"); el.textContent = t.footIosInApp; }
  else if (kind === "downloaded") { el.textContent = t.footDownloaded; }
  else { el.textContent = t.footDefault; }
}

// Android 的下載提示常常很不顯眼，使用者會誤以為什麼都沒發生。
// 頁面自己給一張看得見的成功卡片，並捲進視野。
function showDownloadResult(blobUrl) {
  const panel = $("save-result");
  $("save-result-action").href = blobUrl;
  $("save-result-action").download = STATIC_VCARD;
  panel.hidden = false;
  $("save-footnote").hidden = true;
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideDownloadResult() {
  $("save-result").hidden = true;
  $("save-footnote").hidden = false;
}

async function saveContact() {
  const t = UI[language];
  const button = $("save-button");
  button.disabled = true;
  button.textContent = t.saveOpening;
  $("manual-fallback").hidden = true;
  hideDownloadResult();

  try {
    const vcard = buildVCard({ language, timestamp: new Date() });
    const file = new File([vcard], STATIC_VCARD, { type: "text/vcard;charset=utf-8" });

    // 備援連結先備好，之後任何一層失敗都能立刻亮出來
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    lastBlobUrl = URL.createObjectURL(file);
    $("manual-fallback").href = lastBlobUrl;

    let canShareFiles = false;
    try { canShareFiles = navigator.canShare?.({ files: [file] }) === true; } catch { /* 舊瀏覽器會直接丟例外 */ }

    const plan = deliveryPlan({ canShareFiles, isIOS: isIOS() });
    let degraded = false;

    for (const step of plan) {
      if (step === "direct-vcf") {
        // iOS Safari 導航到同網域 .vcf 會直接顯示聯絡人卡片，比分享選單少一步。
        // 導航後本頁即被聯絡人預覽接管，後續步驟不會執行——這是預期行為。
        location.assign(STATIC_VCARD);
        return;
      }

      if (step === "share") {
        try {
          await navigator.share({ files: [file], title: t.shareTitle });
          setFootnote("default");
          return;
        } catch (error) {
          if (error?.name === "AbortError") { setFootnote("default"); return; } // 使用者自己取消
          degraded = true;
        }
      } else if (step === "ios-in-app-guidance") {
        setFootnote("iosInApp");
        $("manual-fallback").hidden = false;
        return;
      } else if (step === "download") {
        try {
          const anchor = document.createElement("a");
          anchor.href = lastBlobUrl;
          anchor.download = STATIC_VCARD;
          anchor.rel = "noopener";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setFootnote("downloaded");
          showDownloadResult(lastBlobUrl);
          if (degraded) $("manual-fallback").hidden = false; // 前面失敗過，多留一條路
          return;
        } catch {
          degraded = true;
        }
      } else if (step === "manual-link") {
        setFootnote("error");
        $("manual-fallback").hidden = false;
        return;
      }
    }
  } catch {
    setFootnote("error");
    if (lastBlobUrl) $("manual-fallback").hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = UI[language].saveButton;
  }
}

/* ──────────────────────────────────────────────────────────── */
document.querySelectorAll("#lang-group button").forEach((b) => {
  b.addEventListener("click", () => {
    language = b.dataset.lang;
    render();
    setFootnote("default");
    $("manual-fallback").hidden = true;
    hideDownloadResult();
  });
});
$("save-button").addEventListener("click", () => { void saveContact(); });

render();
// 客人可能把頁面擱著不關：每分鐘重算一次，打烊了畫面就會自己改口
setInterval(renderOpenState, 60000);
