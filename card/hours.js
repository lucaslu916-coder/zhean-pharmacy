// 營業狀態判斷。
//
// 抽成獨立模組是為了「可被測試」——「現在有沒有開」是藥局名片上最常被看、
// 也最容易寫錯的一格：午休、公休日、跨日、國定假日、時區，每一項都會出錯，
// 而錯了不會當掉，只會安靜地騙客人白跑一趟。所以這裡不碰 DOM，只做純計算，
// 由測試直接餵各種時刻驗證。
//
// 時區一律 Asia/Taipei：客人可能人在國外用漫遊網路看這張名片，
// 拿瀏覽器當地時間判斷會得到荒謬的答案。

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const TAIPEI = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Taipei",
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// 把任一時刻換算成台北當地的「星期幾／幾點幾分／日期字串」
export function taipeiParts(date) {
  const parts = Object.fromEntries(
    TAIPEI.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  // Intl 在午夜會回 "24"，換算成 0 才不會讓 minutes 爆表
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  return {
    weekday: WEEKDAY_INDEX[parts.weekday],
    minutes: hour * 60 + Number(parts.minute),
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function toMinutes(hhmm) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
  if (!match) return null;   // "TODO" 等未填值一律視為無效，不讓它意外變成 00:00
  const [, h, m] = match;
  const minutes = Number(h) * 60 + Number(m);
  return minutes >= 0 && minutes <= 24 * 60 ? minutes : null;
}

// 取某一天的營業時段，過濾掉格式無效的設定
export function rangesFor(hours, weekday, isoDate) {
  if (hours.closedDates?.includes(isoDate)) return [];
  const raw = hours.weekly?.[weekday] ?? [];
  return raw
    .map(([open, close]) => [toMinutes(open), toMinutes(close)])
    .filter(([open, close]) => open !== null && close !== null && close > open);
}

/**
 * 現在的營業狀態。
 *
 * 回傳：
 *   state         "open" | "closed"
 *   closingSoon   營業中且距離打烊 <= closingSoonMinutes
 *   openingSoon   休息中且距離開門 <= openingSoonMinutes（僅限今天稍後還會開）
 *   todayRanges   今天的營業時段（給頁面顯示用）
 *   nextOpen      下一次開門 { weekday, minutes, daysAhead }；一週內都不開則為 null
 */
export function statusAt(date, hours, { closingSoonMinutes = 30, openingSoonMinutes = 60 } = {}) {
  const { weekday, minutes, isoDate } = taipeiParts(date);
  const todayRanges = rangesFor(hours, weekday, isoDate);

  const current = todayRanges.find(([open, close]) => minutes >= open && minutes < close);
  if (current) {
    return {
      state: "open",
      closingSoon: current[1] - minutes <= closingSoonMinutes,
      openingSoon: false,
      closesAt: current[1],
      todayRanges,
      nextOpen: null,
    };
  }

  // 今天稍後還有時段就用今天的，否則往後找——最多找滿一週。
  // 找滿一週才收手，是為了「只有週三開門」這種設定也能正確回答「下次何時開」。
  let nextOpen = null;
  for (let daysAhead = 0; daysAhead <= 7 && !nextOpen; daysAhead += 1) {
    const day = (weekday + daysAhead) % 7;
    const probe = new Date(date.getTime() + daysAhead * 86400000);
    const ranges = rangesFor(hours, day, taipeiParts(probe).isoDate);
    const upcoming = ranges.find(([open]) => daysAhead > 0 || open > minutes);
    if (upcoming) nextOpen = { weekday: day, minutes: upcoming[0], daysAhead };
  }

  return {
    state: "closed",
    closingSoon: false,
    openingSoon: Boolean(nextOpen) && nextOpen.daysAhead === 0
      && nextOpen.minutes - minutes <= openingSoonMinutes,
    closesAt: null,
    todayRanges,
    nextOpen,
  };
}

export const formatMinutes = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export default statusAt;
