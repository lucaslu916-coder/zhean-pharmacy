# 喆安藥行 電子名片

> **暫存位置說明**：本 repo 的慣例是「程式類專案各自獨立成 repo」。
> 這個專案原本要開在獨立 repo `zhean-pharmacy`，但本 session 的 GitHub App
> 沒有建立 repo 的權限（`POST /user/repos` 回 403），因此先暫存在 ai-workspace
> 保存工作成果。開好獨立 repo 之後，把 `projects/zhean-pharmacy/` 整個搬過去、
> 從 ai-workspace 移除，並刪掉這段說明即可（搬移指令見本檔最後一節）。

NFC 貼紙／QR Code 掃出來就是這張卡：可一鍵撥電話、開啟導航、加 LINE，
把店家存進手機通訊錄，並且會告訴客人「現在有沒有開」。

**純靜態，沒有建置步驟。** 改完 commit、push，GitHub Pages 約一分鐘後自動生效。
不需要 node_modules 才能跑網站（`npm` 只用來跑測試與產生聯絡人檔）。

---

## 現在該做什麼：填資料

網站本身已經做完並測過了，**缺的只有真實資料**。

1. 打開 `card/config.js`，把所有標著 `TODO` 的欄位換成真的內容
2. 跑 `npm run vcf` 重新產生聯絡人檔
3. 跑 `npm test`，全部通過才算可以上線

沒填完之前 `npm test` 會失敗並直接列出還差哪幾欄——這是刻意的。
一張名片最糟的失敗不是當掉，而是安靜地掛著錯的電話或錯的營業時間，
沒有人發現，直到客人白跑一趟。

## 網址架構：為什麼多一層轉址

```
NFC / QR  →  https://lucaslu916-coder.github.io/zhean-pharmacy/  →  /zhean-pharmacy/card/
             （永不變更，已發出的都靠它）                              （想換就換）
```

根目錄的 `index.html` 只做一件事：把人轉到名片頁。
**NFC 貼紙與所有印出去的 QR Code 一律寫根網址，不要寫 `/card/`。**

這一層不是多此一舉。同一套架構在 Lucas Lu 的名片上救過一次：
發布平台停用、整個網站必須搬家時，因為有轉址層，一片 NFC 貼紙都沒有重寫。
日後要換網域、換平台，也只要改 `index.html` 裡的 `TARGET`（連同上方的
`meta refresh` 與 `canonical` 一起改，三處要一致）。

## 檔案

| 檔案 | 內容 |
|---|---|
| `index.html` | 永久入口轉址層。**唯一不能隨便改網址的東西** |
| `card/index.html` | 頁面骨架。中文版直接寫在 HTML 裡，JS 失效時仍可讀、可撥號 |
| `card/config.js` | **內容的單一真相**：店名、藥師、電話、地址、營業時間、服務項目 |
| `card/hours.js` | 「現在有沒有開」的判斷。午休、公休、國定假日、時區 |
| `card/vcard.js` | vCard 3.0 產生器 |
| `card/maps.js` | 導航連結 |
| `card/save-strategy.js` | 存聯絡人的降級順序 |
| `card/app.js` | 渲染、語言切換、儲存聯絡人；介面用語三語表也在這裡 |
| `card/styles.css` | 樣式，自足、不需建置工具 |
| `scripts/build-vcf.mjs` | 重新產生靜態聯絡人檔（`npm run vcf`） |

## 營業時間怎麼設定

`card/config.js` 的 `hours.weekly`，key 是 `0`=週日 … `6`=週六，
每天是一個**時段陣列**：

```js
1: [["08:30", "12:30"], ["14:00", "21:00"]],   // 週一，中午休息
0: [],                                          // 週日公休
```

- 時間一律 24 小時制 `"HH:MM"`
- 時區固定 **Asia/Taipei**，不看客人手機的時區——
  客人人在國外用漫遊看這張名片時，該顯示的是店裡的時間
- 國定假日或臨時公休寫進 `closedDates`（`"YYYY-MM-DD"`），當天一律顯示休息
- 打烊前 30 分鐘會自動改顯示「即將打烊」

## 改了資料要重新產生聯絡人檔

`card/Zhe-An-Pharmacy.vcf` 是預先產生的檔案，**不會自動跟著 `config.js` 變**。
iPhone 走的捷徑直接讀這個檔，忘記重跑就會存進舊資料：

```bash
npm run vcf
```

忘記時 `npm test` 會失敗並指回這裡，不會默默送出過期的聯絡資訊。

## 存聯絡人為什麼要分流

按鈕按下去之後，`save-strategy.js` 依裝置決定嘗試順序：

| 裝置 | 順序 |
|---|---|
| iOS Safari | **導航到靜態 `.vcf` → 直接跳出聯絡人卡片** → 分享 → 手動連結 |
| iOS App 內建瀏覽器（LINE／FB） | 內建瀏覽器指引 → 手動連結 |
| Android／桌面 | 分享 → 下載 → 手動連結 |

這些順序是 Lucas Lu 名片專案用 iPhone 與 Android 實機逐項測出來的，直接沿用：

- iOS 導航到同網域 `.vcf`，Safari 會直接顯示聯絡人卡片，比分享選單少一步
- **Android 三種導航方式一律變成下載，`intent://` 完全無反應**——
  平台沒有開放讓網頁直接開啟新增聯絡人的介面，只能走下載。**不要再嘗試。**
- iOS App 內建瀏覽器連導航都會失敗，所以用 `canShare` 判斷是否為 Safari

任何一層失敗都往下一層走，**最後一層永遠是可長按另存的連結**，不讓客人卡在死路。

## 測試

```bash
npm test
```

測的是**行為**，不是原始碼字串。前一代名片的 8 項測試之所以全過卻讓 Android
壞著上線，是因為它們用正規表示式比對原始碼有沒有出現某段字，
等於把當時的錯誤行為鎖成正確答案。

`tests/ready.test.mjs` 是上線前的資料閘門，資料沒填完本來就會失敗。

## 上線前檢查清單

- [ ] `card/config.js` 沒有任何 TODO
- [ ] `npm run vcf` 已重跑、`npm test` 全過
- [ ] 電話點下去真的撥得出去
- [ ] 導航點下去開到**正確的店**（不是同名的別家）
- [ ] 營業時間與實際一致，午休與公休日都對
- [ ] LINE 按鈕真的加得到好友
- [ ] **iPhone 實機**：按儲存 → 直接跳出聯絡人卡片，存進去的電話地址正確
- [ ] **Android 實機**：按儲存 → 下載成功且有看得見的回饋，開啟後能加入聯絡人
      （不可以「程式碼一樣所以應該都會過」推論——前一代就是這樣讓 bug 潛伏的）
- [ ] 中文／English／日本語 三顆按鈕都能切換全部主要內容
- [ ] GitHub Pages 已啟用，根網址能自動轉到 `/card/`
- [ ] NFC 貼紙與 QR 寫的是**根網址**，不是 `/card/`

## NFC 貼紙

- 晶片建議 **NTAG215**，通用性最好、價差極小
- 寫入類型務必選 **URL／URI**，不要選「文字／Text」——選錯手機只會顯示純文字
- 貼在金屬表面（金屬名片盒、櫃台金屬板）**必須買防金屬款**，一般貼紙完全無法感應
- **不要鎖唯讀**：鎖了沒有好處，但萬一要調整轉址層位置，已鎖的貼紙就是廢片
- 多片貼紙不可疊放，會互相干擾
- 測試要用**另一支手機**，不要用寫入的那支

## QR Code 印刷

- 四周留白**不可裁掉**（實測裁掉後完全掃不出來）
- 成品至少 2.5 公分見方
- 不要在 QR 上壓字或放 logo

---

## 搬到獨立 repo

在 GitHub 上開一個空的 public repo `zhean-pharmacy`（不要勾 Add a README），然後：

```bash
cd projects/zhean-pharmacy
git init -b main
git add -A
git commit -m "喆安藥行電子名片：轉址層、三語名片頁、營業狀態與存聯絡人"
git remote add origin https://github.com/lucaslu916-coder/zhean-pharmacy.git
git push -u origin main
```

推完之後到 repo 的 **Settings → Pages**，Source 選 **Deploy from a branch**，
分支 `main`、目錄 `/ (root)`，並啟用 **Enforce HTTPS**。約一分鐘後
`https://lucaslu916-coder.github.io/zhean-pharmacy/` 就會自動轉到名片頁。

搬完記得把 `projects/zhean-pharmacy/` 從 ai-workspace 移除，避免兩份各改各的。
