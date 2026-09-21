// 喆安藥行電子名片：內容的單一真相。
// 改店名、藥師、電話、地址、營業時間、服務項目，只要改這個檔，
// 頁面、營業狀態與聯絡人 VCF 會一起跟著變。
//
// 每個可翻譯欄位都是 { zh, en, ja } 三語對照，缺一測試就會擋下。
// 凡是值為 "TODO" 或含 TODO 的欄位，代表尚未填入真實資料，
// `npm test` 會失敗並列出清單——不會讓半成品的名片默默上線。

export const shop = {
  site: {
    // 名片頁本體的網址。NFC／QR 不寫這個，寫上一層的永久入口（見 repo 根目錄 index.html）
    publicUrl: "https://lucaslu916-coder.github.io/zhean-pharmacy/card/",
    title: "喆安藥行｜電子名片",
    description: "喆安藥行的聯絡方式、營業時間與導航。可一鍵撥電話、開啟導航、加 LINE，或把聯絡人存進手機。",
  },

  pharmacy: {
    // 店名。漢字店名為 vCard 的正式識別，三語共用，不隨介面語言改變
    name: { zh: "喆安藥行", en: "Zhe-An Pharmacy", ja: "喆安薬局" },
    // 招牌上的原文，不是另外編的行銷詞
    tagline: {
      zh: "參茸燕桂・地道藥材・貨真價實",
      en: "Ginseng, antler, bird's nest & cinnamon — authentic herbs, honestly priced",
      ja: "参茸燕桂・本場の漢方薬材・正直な品と値",
    },

    // 負責藥師。vCard 的 N 欄位需要姓／名分開，
    // 明確分欄可避免原版「取姓名第一個字當姓」在複姓時拆錯的問題。
    pharmacist: {
      familyName: "呂",
      givenName: "凱文",
      display: { zh: "呂凱文", en: "Lu Kai-Wen", ja: "呂凱文" },
      // 使用者 2026-09-21 確認為「負責人」。
      // 不要改成「藥師」——這是中藥行（招牌：參茸燕桂、地道藥材、代客煎藥），
      // 「藥師」在台灣是有法律意義的宣稱，寫錯不是排版問題。
      title: { zh: "負責人", en: "Proprietor", ja: "店主" },
      // 執照字號要不要對外公開由你們決定；不公開就維持 null
      license: null,
    },

    phone: {
      display: "02 2222 1614",
      international: "+886-2-2222-1614",
    },

    // 沒有公司信箱就維持 null。不要放私人 Gmail 到公開頁面，除非本人同意。
    email: null,

    address: {
      // 顯示用地址（三語）
      // Google 地圖顯示為「235 台灣中和區民有里民治街5巷1號」。
      // 「民有里」是行政區里別，郵寄地址不需要；補上「新北市」才是完整的標準寫法。
      text: {
        zh: "235 新北市中和區民治街5巷1號",
        en: "No. 1, Ln. 5, Minzhi St., Zhonghe Dist., New Taipei City 235, Taiwan",
        ja: "235 新北市中和区民治街5巷1号",
      },
      // Google Maps 導航用。店家在 Google 地圖上的正式短連結——
      // 比用地址字串搜尋準，不會導到同名的別家店。
      // 原連結尾端的 ?g_st=ic 是 Google 地圖 App 的來源追蹤參數，與地點無關，已移除。
      // 使用者 2026-09-21 提供。解析後 place id 為 0x3442a82759a829c5:0xeeb65ee458ab7ed，
      // 座標 25.0051851, 121.4750621，名稱「喆安藥行」——與舊連結同一地點，
      // 但這條是正式的 /maps/place/ 連結，導航會釘在店本身而不是拿地址去搜。
      mapsUrl: "https://maps.app.goo.gl/7pSFWRpASSVSg5W59",
      // vCard ADR 欄位：[郵政信箱, 樓層, 街道, 城市, 縣市, 郵遞區號, 國家]
      vcard: ["", "", "民治街5巷1號", "中和區", "新北市", "235", "台灣"],
    },

    // LINE 加好友連結。2026-09-21 由負責人提供。
    // 這是個人 LINE（/ti/p/ 開頭），不是官方帳號（@ 開頭）——加好友會直接加到負責人本人。
    // 設為 null 時整個 LINE 區塊不顯示。
    line: {
      url: "https://line.me/ti/p/pDqmCeRzKt",
      // 有 LINE QR 圖檔時填檔名（放在 card/ 下），沒有就 null，頁面會只顯示按鈕
      qr: null,
    },

    // 有官網或 FB／IG 粉專就填，沒有留 null
    website: null,
  },

  // 營業時間。weekly 的 key 為 0=週日 … 6=週六，
  // 每天是一個「時段陣列」——午休就寫兩段，公休寫空陣列 []。
  // 時間一律 24 小時制 "HH:MM"，時區固定 Asia/Taipei。
  hours: {
    weekly: {
      // 2026-09-21 負責人提供：週一至週五 10:00-19:00、週六 10:00-17:00、週日公休。
      // （歷程：最初口述 18:00 → 對齊 Google 地圖改 19:00 → 負責人確認週六提早到 17:00）
      0: [],                                                   // 週日：公休
      1: [["10:00", "19:00"]],                                 // 週一
      2: [["10:00", "19:00"]],                                 // 週二
      3: [["10:00", "19:00"]],                                 // 週三
      4: [["10:00", "19:00"]],                                 // 週四
      5: [["10:00", "19:00"]],                                 // 週五
      6: [["10:00", "17:00"]],                                 // 週六：提早到 17:00
    },
    // 國定假日或臨時公休（YYYY-MM-DD），當天一律顯示為休息
    closedDates: [],
    // ⚠️ 這行是我依「週一至週六 10:00-18:00、週日公休」推出來的保守寫法，
    // 國定假日與春節的實際安排沒有確認過，所以只寫「請先來電確認」而不編一個規則。
    // 如果實際有固定的假日安排，改掉這三行。
    note: {
      zh: "週日公休。國定假日與臨時休息請先來電確認。",
      en: "Closed on Sundays. Please call ahead for public holidays and unscheduled closures.",
      ja: "日曜定休。祝日および臨時休業はお電話でご確認ください。",
    },
  },

  // 服務項目。想加減項目直接改這個陣列，頁面會跟著變。
  // 2026-09-21 改用負責人自己的說法（先前三項取自招牌副標）。
  // 招牌上的「參茸燕桂・地道藥材・貨真價實」仍保留在 tagline。
  services: [
    { zh: "中藥材販售", en: "Chinese herbal medicine", ja: "漢方薬材の販売" },
    { zh: "代客煎藥", en: "Herb decoction service", ja: "煎じ薬の代行" },
  ],

  // 「關於我們」。2026-09-21 由負責人提供：
  //   「在地經營 40 多年貨真價實，給予藥材詢問與建議關心」
  // 內文只調語序與標點，事實（40 多年、貨真價實、藥材詢問與建議）未增減。
  // 設為 null 時整個區塊不顯示。
  about: {
    heading: {
      zh: "在地經營 40 多年",
      en: "Serving the neighborhood for over 40 years",
      ja: "地元で 40 年以上",
    },
    body: {
      zh: "喆安藥行在中和在地經營 40 多年，貨真價實。歡迎來店詢問藥材，我們樂意提供建議與關心。",
      en: "Zhe-An Pharmacy has served Zhonghe for over 40 years with genuine goods at honest prices. Drop by with any questions about herbs — we are always glad to help.",
      ja: "喆安薬局は中和で 40 年以上、確かな品を誠実な価格でお届けしてきました。薬材のことはお気軽にご相談ください。",
    },
  },

  // 藥局視覺以綠色為主：十字、健康、安心
  theme: { primary: "#1f9d55", dark: "#146c3a", accent: "#2bb673" },

  // ⚠️ 這區只是紀錄，程式不會讀它。
  // 檔案實際是被 styles.css（.masthead 的 background-image）與 index.html（og:image）
  // 直接以檔名引用的。要換圖就換掉 card/ 下的同名檔，或連同那兩處一起改。
  assets: {
    logo: null,                              // 店徽目前是 CSS 畫的朱紅印章，不吃圖檔
    // ⚠️ 換圖時，styles.css 與 index.html 裡的 ?v= 版號要一起 +1，否則快取會擋住更新。
    storefront: "shop-interior.webp",        // 店招背景（1200px 寬，99 KB，目前 v2）
    socialPreview: "social-preview.jpg",     // 分享預覽（1200x630，OG 規格）
  },

  // vCard 內的機構固定用中文原文，不隨介面語言切換——
  // 這是聯絡人的正式紀錄，保持單一寫法才不會同一間店存出三種版本。
  vcard: {
    fileName: "Zhe-An-Pharmacy.vcf",
    organization: ["喆安藥行"],
  },
};

export default shop;
