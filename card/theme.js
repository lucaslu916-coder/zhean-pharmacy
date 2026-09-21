// 深淺色主題。
//
// 規則只有兩條：
// 1. 客人按過切換鈕，就照他選的（記在這支手機的瀏覽器裡）。
// 2. 沒按過，就跟著手機系統的深淺設定走，系統切換時頁面也跟著變。
//
// index.html 的 <head> 裡有一段同樣邏輯的小腳本，在畫面畫出來之前先套好主題，
// 避免深色模式的客人一打開先閃一下白畫面。改規則時兩邊要一起改。

export const STORAGE_KEY = "zhean-theme";
const VALID = new Set(["light", "dark"]);

// 讀取客人存過的選擇。無痕模式、封鎖網站資料時 localStorage 會丟錯或拿不到——
// 那就當作沒選過，不能讓主題功能把整張名片弄壞。
export const readSaved = (storage) => {
  try {
    const v = storage?.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : null;
  } catch {
    return null;
  }
};

export const writeSaved = (storage, theme) => {
  try {
    storage?.setItem(STORAGE_KEY, theme);
  } catch {
    /* 存不了就算了：這次切換照樣生效，只是下次打開會回到系統設定 */
  }
};

export const resolveTheme = (saved, systemPrefersDark) =>
  VALID.has(saved) ? saved : (systemPrefersDark ? "dark" : "light");

export const nextTheme = (current) => (current === "dark" ? "light" : "dark");
