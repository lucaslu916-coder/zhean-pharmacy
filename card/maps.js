// 導航連結。
// 店家有正式的 Google 地圖連結就用它（能指到正確的商家頁，評論、電話都在）；
// 沒有就以地址字串組出搜尋網址——地址本身已經夠精確，不需要經緯度。
// 一律用 google.com/maps 的通用網址：手機上會被系統接手開啟 Google 地圖 App，
// 沒裝 App 的人則留在網頁版，兩邊都不會落空。
export function mapsUrl({ mapsUrl: explicit, addressText }) {
  if (explicit && !String(explicit).includes("TODO")) return explicit;
  const query = String(addressText ?? "").trim();
  if (!query || query.includes("TODO")) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default mapsUrl;
