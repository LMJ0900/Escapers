// 슬롯 날짜 · 시간 변환. 사이트는 모두 한국 시간(UTC+9, 서머타임 없음)으로 표기한다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 시간 기준 오늘부터 days 일치 "YYYY-MM-DD" 목록 */
export function seoulDates(now: Date, days: number): string[] {
  const today = new Date(now.getTime() + KST_OFFSET_MS);
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  });
}

/** 한국 시간 "YYYY-MM-DD" + "HH:mm" → 시각 */
export function toSlotStartsAt(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+09:00`);
}
