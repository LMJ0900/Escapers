/** 후기를 한 번에 가져오는 개수. 서버 렌더링과 클라이언트 후속 요청이 같은 값을 쓴다. */
export const REVIEW_PAGE_SIZE = 5;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** "YYYY-MM-DD" → { label: "3/1", weekday: "토" }. 타임존에 영향받지 않도록 UTC 로 해석한다. */
export function formatSlotDate(date: string): {
  label: string;
  weekday: string;
} {
  const [, month, day] = date.split("-").map(Number);
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return { label: `${month}/${day}`, weekday: WEEKDAY_LABELS[weekday] };
}

/** "인원 범위" 표시. 최소/최대 중 하나라도 없으면 있는 쪽만, 둘 다 없으면 null. */
export function formatPlayers(
  min: number | null,
  max: number | null
): string | null {
  if (min !== null && max !== null) {
    return min === max ? `${min}인` : `${min}–${max}인`;
  }
  if (min !== null) return `${min}인 이상`;
  if (max !== null) return `최대 ${max}인`;
  return null;
}

/** 남은 시간(초) → "03:12" */
export function formatRemainingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" → "YYYY.MM.DD" */
export function formatReviewDate(writtenAt: string): string {
  return writtenAt.slice(0, 10).replaceAll("-", ".");
}
