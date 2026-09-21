// 聯絡人交付策略。
//
// 自 Lucas Lu 電子名片 v2.2.0 移植。那邊的順序不是推論出來的，是 iPhone 與
// Android 實機逐項測出來的，直接沿用：
//   iOS Safari 導航到同網域 .vcf → 直接顯示聯絡人卡片，比分享選單少一步
//   Android 三種導航方式一律變成下載，intent:// 完全無反應——
//   平台沒有開放讓網頁直接開啟新增聯絡人的介面，只能走下載，不要再試。
//
// 與個人名片的一項差異：個人名片會即時把「相識時間／場合／GPS」寫進 vCard，
// 所以有填資料時不能走預先產生的靜態檔。店家名片沒有這種即時內容——
// 店名、電話、地址、營業時間都是固定的——因此 iOS 一律可以走靜態檔的捷徑。
//
// 抽成獨立模組是為了可被測試：分享永遠不是死路，後面一定還有退路。
export function deliveryPlan({ canShareFiles, isIOS }) {
  const steps = [];

  // ① iOS Safari：導航到預先產生的靜態 .vcf，直接跳出聯絡人卡片。
  //    以 canShareFiles 作為「是否為 Safari」的判準——App 內建瀏覽器
  //    （LINE／FB）在此為 false，而它們連導航到 .vcf 都會失敗，
  //    走這條路只會讓使用者卡在沒有回饋的畫面。
  if (isIOS && canShareFiles) steps.push("direct-vcf");

  // ② 系統分享選單：iOS 可選「聯絡人」
  if (canShareFiles) steps.push("share");

  // ③ iOS 無法分享，代表身處 App 內建瀏覽器：這類瀏覽器連下載都會被擋，
  //    硬試只會再失敗一次，直接給正確指引。
  //    其他平台則走一般下載——Android 與桌面瀏覽器都支援。
  steps.push(isIOS ? "ios-in-app-guidance" : "download");

  // ④ 最後一道退路：亮出可長按另存的連結，永遠不讓使用者卡在死路
  steps.push("manual-link");

  return steps;
}

export default deliveryPlan;
